# PTOne – Logik-Referenz für die Entwicklung

---

## 1. PROJEKT SETUP

### Struktur

```
C:\Users\Schule\Projects\ys-ptone\
├── landing\   → ptone.yannicksalm.ch
├── pt\        → pt.yannicksalm.ch
└── client\    → ptclient.yannicksalm.ch
```

- Jeder Ordner = komplett unabhängiges Next.js Projekt
- Deployment: OpenNext + Cloudflare Workers (via WSL)
- Gleiche Supabase DB + Storage, gleiche MS Graph API (nur noch für E-Mail)

### Subdomains (Cloudflare, Proxied)

```
ptone.yannicksalm.ch     → Worker: ptone-landing
pt.yannicksalm.ch        → Worker: ptone-pt
ptclient.yannicksalm.ch  → Worker: ptone-client
```

### Dev-Ports

```
landing → 3002
pt      → 3000
client  → 3001
```

---

## 2. AUTH & LOGIN LOGIK

### Rollen

```
role = 'pt'     → Redirect nach pt.yannicksalm.ch
role = 'client' → Redirect nach ptclient.yannicksalm.ch
```

PT-Rolle wird manuell vom Admin (Yannick) direkt in der DB gesetzt.

### Client Login-Sperre

Client kann sich ERST einloggen wenn `profiles.has_coach = true`. `has_coach` wird automatisch via DB Trigger gesetzt sobald ein PT den Client in `trainer_clients` auf `status = 'active'` setzt.

```typescript
// middleware.ts auf ptclient.yannicksalm.ch
if (user.role === 'client' && !user.has_coach) {
  redirect('/waiting')
}
```

**Warteseite `/waiting`:**

- Erklärt dass der Account noch nicht aktiviert ist
- Link zu PT-Suche + Anfrage stellen
- Logout Button

### Registrierung Flow

```
1. Email + Name eingeben (oder Google OAuth)
2. Account erstellt mit role = 'client', has_coach = false
3. Weiterleitung auf /waiting
4. Option A: PT suchen → Anfrage schreiben → PT akzeptiert → has_coach = true
5. Option B: PT lädt per Email-Link ein → Client klickt → has_coach = true
```

### Google OAuth

- Supabase Auth Provider: Google
- Nach Login: prüfen ob `profiles` Eintrag existiert, sonst erstellen (Trigger)

---

## 3. SUPABASE STORAGE

### Migrationsstrategie

```
Phase 1 (aktuell): Supabase Cloud   → SUPABASE_URL = https://xxxx.supabase.co
Phase 2:           Supabase Local   → SUPABASE_URL = http://127.0.0.1:54321
Phase 3:           Produktion       → Supabase Cloud (eigenes Projekt) oder Self-Hosted
```

> Der gesamte Code bleibt identisch — nur `SUPABASE_URL` ändert sich zwischen den Phasen.

---

### Bucket Struktur

| Bucket               | Typ      | Beschreibung                                        |
|----------------------|----------|-----------------------------------------------------|
| `pt-profile`         | **public** | Hero-Bild + Gallery (sichtbar auf Landing Page)  |
| `exercise-videos`    | private  | PT-Übungsvideos (pro Übung)                         |
| `client-documents`   | private  | Dokumente, Progress-Fotos                           |
| `invoices`           | private  | Generierte Rechnungs-PDFs                           |
| `email-assets`       | private  | PT-Logos für E-Mail-Templates                       |

---

### Ordnerstruktur (innerhalb der Buckets)

```
pt-profile/
└── {pt_id}/
    ├── hero.jpg
    └── gallery/
        ├── 0.jpg
        └── 1.jpg

exercise-videos/
└── {pt_id}/
    └── {exercise_id}.mp4

client-documents/
└── {pt_id}/
    └── {client_id}/
        ├── documents/
        │   └── {filename}
        └── progress-photos/
            └── {filename}

invoices/
└── {pt_id}/
    └── {client_id}/
        └── {invoice_number}.pdf

email-assets/
└── {pt_id}/
    └── logo.{ext}
```

---

### Storage Calls (Beispiele)

```typescript
// Datei hochladen
const { data, error } = await supabase.storage
  .from('client-documents')
  .upload(`${pt_id}/${client_id}/documents/${filename}`, file, {
    upsert: false,
    contentType: file.type,
  });

// Datei löschen
await supabase.storage
  .from('client-documents')
  .remove([`${pt_id}/${client_id}/documents/${filename}`]);

// Signed URL (private Buckets, z.B. 1h gültig)
const { data } = await supabase.storage
  .from('client-documents')
  .createSignedUrl(`${pt_id}/${client_id}/documents/${filename}`, 3600);

// Public URL (nur für pt-profile Bucket)
const { data } = supabase.storage
  .from('pt-profile')
  .getPublicUrl(`${pt_id}/hero.jpg`);
```

---

### RLS Policies (Storage)

```sql
-- pt-profile: Öffentlich lesbar, PT kann eigene Bilder verwalten
CREATE POLICY "public_read_pt_profile"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pt-profile');

CREATE POLICY "pt_manage_own_profile"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'pt-profile' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- exercise-videos: PT verwaltet eigene, Client liest vom eigenen PT
CREATE POLICY "pt_manage_exercise_videos"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'exercise-videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "client_read_pt_videos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'exercise-videos' AND
    (storage.foldername(name))[1] IN (
      SELECT trainer_id::text FROM trainer_clients
      WHERE client_id = auth.uid() AND status = 'active'
    )
  );

-- client-documents: PT verwaltet alle Dokumente seiner Clients
CREATE POLICY "pt_manage_client_documents"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'client-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Client liest eigene Dokumente (visibility-Check via drive_files Tabelle)
CREATE POLICY "client_read_own_documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'client-documents' AND
    auth.uid()::text = (storage.foldername(name))[2]
  );

-- invoices: PT verwaltet, Client liest eigene
CREATE POLICY "pt_manage_invoices"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'invoices' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "client_read_own_invoices"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'invoices' AND
    auth.uid()::text = (storage.foldername(name))[2]
  );

-- email-assets: Nur PT liest/schreibt eigene Assets
CREATE POLICY "pt_manage_email_assets"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'email-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

### PT Video Upload Flow

```
1. PT wählt Übung + lädt Video hoch (im PT Dashboard)
2. Video → Supabase Storage: exercise-videos/{pt_id}/{exercise_id}.mp4
3. Storage gibt storage_path zurück
4. INSERT into exercise_pt_videos (exercise_id, pt_id, storage_path)
5. Storage RLS + exercise_pt_videos RLS sichern Zugriff
```

```typescript
// Video-URL beim Abspielen generieren (Signed URL, 1h)
const { data } = await supabase.storage
  .from('exercise-videos')
  .createSignedUrl(`${pt_id}/${exercise_id}.mp4`, 3600);
```

### exercise_pt_videos Tabelle (angepasst)

```sql
-- storage_path statt onedrive_file_id / onedrive_url
CREATE TABLE exercise_pt_videos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id uuid REFERENCES exercises(id),
  pt_id       uuid REFERENCES profiles(id),
  storage_path text NOT NULL, -- z.B. "uuid-pt/uuid-exercise.mp4"
  created_at  timestamptz DEFAULT now()
);
```

### RLS für PT-Videos (DB-Tabelle)

```sql
CREATE POLICY "client_sees_own_pt_videos" ON exercise_pt_videos
  FOR SELECT USING (
    pt_id IN (
      SELECT trainer_id FROM trainer_clients
      WHERE client_id = auth.uid() AND status = 'active'
    )
  );
```

### Exercise Video Anzeige-Logik (Client)

```typescript
if (exercise_pt_videos.find(v => v.pt_id === myPtId)) {
  // Signed URL aus Supabase Storage holen und abspielen
  const { data } = await supabase.storage
    .from('exercise-videos')
    .createSignedUrl(video.storage_path, 3600);
  // URL abspielen
} else {
  // Bilder aus exercisedb anzeigen (exercise.image_url / image_url_2)
}
```

---

## 4. BUCHHALTUNG LOGIK

### Zahlungsstatus Flow

```
Rechnung erstellt → payment_status = 'offen'
    ↓ (nach payment_due_days Tagen)
Cron prüft täglich → reminder1_enabled?
    ↓ JA: Email senden, status = 'gemahnt_1'
    ↓ (nach reminder2_days_after_r1 Tagen)
reminder2_enabled?
    ↓ JA: Email senden, status = 'gemahnt_2'
PT markiert manuell bezahlt → status = 'bezahlt', paid_date = today
```

### Kalender-Farben für Rechnungen

```
bezahlt               → 🟢 Grün
kurz vor Fälligkeit   → 🟠 Orange  (< 3 Tage bis due_date)
überfällig            → 🔴 Rot
gemahnt_1             → 🟣 Purple
gemahnt_2             → 🟤 Lila
```

### Mahnungs-Email via Graph API

Edge Function `send-invoice-reminder` läuft täglich 08:00.

```typescript
// 1. PDF aus Supabase Storage laden (storage_path)
const { data: pdfBlob } = await supabase.storage
  .from('invoices')
  .download(`${pt_id}/${client_id}/${invoice_number}.pdf`);

// 2. HTML Template laden aus accounting_settings.reminder_email_template
// 3. Platzhalter ersetzen:
//    {{client_name}}, {{betrag}}, {{faelligkeitsdatum}},
//    {{rechnungsnummer}}, {{mahnung_nr}}
// 4. Email senden via Graph API als info@yannicksalm.ch
//    POST /users/info@yannicksalm.ch/sendMail
// 5. INSERT into invoice_reminders (log)
// 6. UPDATE invoices SET payment_status = 'gemahnt_1' / 'gemahnt_2'
```

> **Hinweis:** MS Graph API wird nur noch für den **E-Mail-Versand** verwendet. Dateispeicherung läuft vollständig über Supabase Storage.

### Email Vorlage Editor

- Library: **Unlayer** oder **Grapesjs** (embedded React component)
- Drag & Drop Blöcke: Text, Bild, Button, Divider, Spacer
- PT lädt Logo hoch → gespeichert in `email-assets/{pt_id}/logo.{ext}` → Signed URL in Template
- HTML wird gespeichert in `accounting_settings.reminder_email_template`
- Platzhalter werden clientseitig als Badge angezeigt, serverseitig ersetzt

### PDF Generierung

Edge Function `create-invoice-pdf`:

```typescript
// 1. Rechnungsdaten + accounting_settings laden
// 2. PDF generieren (z.B. @react-pdf/renderer oder Puppeteer)
// 3. PDF via Supabase Storage hochladen
const { data, error } = await supabase.storage
  .from('invoices')
  .upload(`${pt_id}/${client_id}/${invoice_number}.pdf`, pdfBuffer, {
    contentType: 'application/pdf',
    upsert: true,
  });

// 4. UPDATE invoices SET pdf_storage_path = `${pt_id}/${client_id}/${invoice_number}.pdf`
```

### Wiederkehrende Einnahmen/Ausgaben

Cron `auto-create-recurring` läuft täglich:

```typescript
// Sucht alle incomes/expenses mit is_recurring = true
// Prüft recurrence_interval und letzten Eintrag
// Erstellt neuen Eintrag wenn fällig
// recurrence_interval: 'weekly_monday' | 'monthly_1' | 'quarterly' | 'custom'
```

### Export

```typescript
// CSV: JSON → CSV String → Download
// PDF: Puppeteer/jsPDF → Blob → Download
// Filter: Zeitraum, Kunde, Kategorie, Status
```

---

## 5. PLANS & WORKOUT LOGIK

### Unterschied plans vs training_plans

```
plans          → User-eigene Pläne (Client erstellt selbst)
training_plans → PT erstellt für Client (ordnerbasiert via client_folders)
```

### Workout Session starten

```typescript
// Option A: Leeres Workout
INSERT workout_sessions { source: 'own', title: 'Workout' }

// Option B: Aus eigenem Plan
INSERT workout_sessions { plan_id, source: 'plan', title: plan.title }
// Kopiert alle plan_exercises + plan_sets als workout_exercises + sets

// Option C: Aus PT Training Plan
INSERT workout_sessions { training_plan_id, source: 'training_plan' }
// exercises aus training_plans.exercises (jsonb) übernehmen
```

### Aktive Session (Offline-safe)

```typescript
// Aktive Session in IndexedDB speichern (crash-safe)
// Bei jeder Änderung sofort sync zu Supabase wenn online
// Falls offline: sync wenn Verbindung wiederhergestellt
// Status: 'active' | 'completed' | 'cancelled'
```

### Superset Logik

```typescript
// plan_exercises.superset_group = 'A' → alle Übungen mit 'A' sind ein Superset
// Visuell: Klammer + SUPERSET Badge
// Auto-Advance: nach Set einer Übung → direkt nächste Superset-Übung
// Auch in training_plans.exercises jsonb als superset_group gespeichert
```

### PR Erkennung

Edge Function `calculate-pr` bei jedem `INSERT` auf `sets`:

```typescript
// Vergleicht set.weight_kg mit bisherigem Max für diese Übung
// PR-Typen: max_weight, max_reps, 1rm_estimate (= weight * (1 + reps/30)), duration, distance
// Falls PR: sets.is_pr = true + INSERT personal_records
```

### zuvor-Spalte

```typescript
// Beim Öffnen einer Übung: letztes workout_session mit dieser Übung laden
// Anzeigen: letztes Gewicht + Wiederholungen pro Satz
```

---

## 6. JOURNAL LOGIK

### Wochen-Format (PT wählt in Einstellungen)

```
'kw'   → week_label = 'KW12'  (Kalenderwoche)
'date' → week_label = '17.03' (Datum Wochenanfang)
```

### Journal ausfüllen (Client)

```
1. Client öffnet Journal
2. Sieht Liste aller journal_entries (nach week_label sortiert)
3. Neuer Eintrag: PT erstellt Template, Client füllt aus
4. Felder: Gewicht, Umfänge, Scores pro Kategorie (Woche 1-4, Skala 1-10)
5. Submit → Edge Function on-journal-submit
```

### Edge Function: on-journal-submit

```typescript
// 1. Gewicht → INSERT body_weight_logs (source: 'journal')
// 2. Umfänge → INSERT body_measurement_logs (source: 'journal')
// 3. UPDATE client_profiles SET weight_kg, waist_cm, ... (letzter Wert)
// 4. avg_score berechnen aus allen journal_ratings
// 5. UPDATE journal_entries SET avg_score, submitted_at
```

### Bewertungskategorien (PT konfigurierbar)

Standard-Kategorien (auto-erstellt bei neuem PT):

- Training
- Ernährung
- Aktivität
- Energie / Schlaf
- Sicherheit & Herausforderung

---

## 7. GOOGLE CALENDAR SYNC

### Setup

```typescript
// PT verbindet Google Account via OAuth 2.0
// Scopes: https://www.googleapis.com/auth/calendar
// Token → verschlüsselt in calendar_integrations (Supabase Vault)
```

### Sync-Richtungen

```
Termin erstellt in App  → Google Calendar (via Edge Function sync-google-calendar)
Termin geändert in App  → Google Calendar update
Rechnungsfälligkeiten   → Google Calendar Event (wenn sync_invoices = true)
Mahnungs-Termine        → Google Calendar Event (wenn sync_reminders = true)
```

### Token Refresh

Cron `refresh-google-token` stündlich:

```typescript
// Prüft alle calendar_integrations auf token_expires_at < now() + 10min
// Refresht via Google OAuth Token Endpoint
// UPDATE calendar_integrations SET access_token, token_expires_at
```

### Farben in Google Calendar

```typescript
// Google Calendar Farben-IDs:
// 2 = Sage (Grün) → bezahlt
// 6 = Tangerine (Orange) → kurz vor Fälligkeit
// 11 = Tomato (Rot) → überfällig
// 9 = Grape (Purple) → gemahnt_1
// 3 = Lavender (Lila) → gemahnt_2
```

---

## 8. PT PROFIL & LANDING PAGE

### PT Profil öffentlich machen

```typescript
// pt_profiles.is_public = false → nicht auf Landing Page sichtbar
// pt_profiles.is_public = true  → erscheint in PT-Liste
// PT kann in Einstellungen togglen
```

### Slug generieren

```typescript
// slug = `${first_name}-${last_name}`.toLowerCase().replace(/\s+/g, '-')
// Bei Duplikat: slug + '-2', '-3', etc.
// URL: ptone.yannicksalm.ch/pt/{slug}
```

### Bilder Upload (PT Profil)

```typescript
// Hero:    → pt-profile/{pt_id}/hero.jpg
// Gallery: → pt-profile/{pt_id}/gallery/{index}.jpg
// max 6 Gallery-Bilder
// Public URL direkt aus Supabase Storage abrufbar (Bucket ist public)

const { data } = supabase.storage
  .from('pt-profile')
  .getPublicUrl(`${pt_id}/hero.jpg`);

// URL in pt_profiles.hero_image_url / gallery_urls[]
```

### Landing Page PT-Liste

```typescript
// Nur PTs mit is_public = true anzeigen
// Suche: über name, location, specializations
// Filter: location, languages, specializations
// Sortierung: neueste zuerst (created_at DESC)
```

---

## 9. DRIVE LOGIK

### Dateien hochladen (PT)

```typescript
// 1. PT wählt Client
// 2. PT wählt Ordner (oder erstellt neuen, wird in drive_folders gespeichert)
// 3. Datei upload → Supabase Storage → client-documents/{pt_id}/{client_id}/documents/{filename}
const { data, error } = await supabase.storage
  .from('client-documents')
  .upload(`${pt_id}/${client_id}/documents/${filename}`, file);

// 4. INSERT drive_files (storage_path statt onedrive_file_id)
// 5. visibility: 'shared' = Client sieht es, 'pt_only' = nur PT
```

### drive_files Tabelle (angepasst)

```sql
-- storage_path statt onedrive_file_id / onedrive_url
CREATE TABLE drive_files (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pt_id        uuid REFERENCES profiles(id),
  client_id    uuid REFERENCES profiles(id),
  folder_id    uuid REFERENCES drive_folders(id),
  filename     text NOT NULL,
  storage_path text NOT NULL,  -- z.B. "uuid-pt/uuid-client/documents/datei.pdf"
  storage_bucket text NOT NULL DEFAULT 'client-documents',
  mime_type    text,
  size_bytes   bigint,
  visibility   text DEFAULT 'pt_only', -- 'shared' | 'pt_only'
  is_invoice   boolean DEFAULT false,
  invoice_id   uuid REFERENCES invoices(id),
  created_at   timestamptz DEFAULT now()
);
```

### Client sieht nur shared Files

```sql
-- DB-Policy: Client sieht nur eigene, shared Dateien
CREATE POLICY "client_own_files" ON drive_files
  FOR SELECT USING (
    client_id = auth.uid() AND visibility = 'shared'
  );

-- Storage-Policy erlaubt Zugriff auf Pfad (reicht nicht allein → drive_files RLS ist die Hauptkontrolle)
-- PT liest die Signed URL serverseitig und gibt sie weiter wenn visibility = 'shared'
```

### Datei-URL abrufen

```typescript
// Für PT: direkt Signed URL
const { data } = await supabase.storage
  .from(file.storage_bucket)
  .createSignedUrl(file.storage_path, 3600);

// Für Client: nur wenn visibility = 'shared' (RLS prüft das in drive_files)
// → gleicher Code, DB-RLS verhindert unerlaubten Zugriff
```

### Rechnungen in Drive

```typescript
// Wenn Rechnung PDF erstellt wird:
// → automatisch als client-documents/{pt_id}/{client_id}/invoices/{invoice_number}.pdf ablegen
// ODER: eigener invoices-Bucket: invoices/{pt_id}/{client_id}/{invoice_number}.pdf
// → drive_files.is_invoice = true, drive_files.invoice_id = invoice.id
// → Client sieht es unter "Dokumente & Rechnungen"
```

---

## 10. CLIENT DOKUMENTE & RECHNUNGEN (Markierungen)

### Farblogik für Client-Ansicht

```typescript
const getInvoiceStatus = (invoice) => {
  const today = new Date()
  const due = new Date(invoice.due_date)
  const daysUntilDue = Math.ceil((due - today) / (1000 * 60 * 60 * 24))

  if (invoice.payment_status === 'bezahlt') return 'green'
  if (invoice.payment_status === 'gemahnt_2') return 'lila'
  if (invoice.payment_status === 'gemahnt_1') return 'purple'
  if (daysUntilDue < 0) return 'red'        // überfällig
  if (daysUntilDue <= 3) return 'orange'     // kurz vor Fälligkeit
  return 'default'
}
```

### Banner auf Client Startseite

```typescript
// Wenn offene/überfällige Rechnungen vorhanden:
// → roter/oranger Banner oben auf der Startseite
// "Du hast 1 offene Rechnung – CHF 200 fällig am 20.05.2026"
```

---

## 11. NOTIFICATIONS (PWA Push)

### Kanäle

- **PWA Push Notifications** (Service Worker)
- **Email** via Graph API (info@yannicksalm.ch)

### Wann Push senden?

```
PT:     Neue Anfrage von Client
PT:     Rechnung bezahlt
Client: Neuer Plan zugewiesen
Client: Neue Notiz geteilt
Client: Neues Dokument hochgeladen
Client: Rechnung überfällig (Banner + Push)
```

---

## 12. UMGEBUNGSVARIABLEN

### Alle 3 Apps (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co   # Phase 1: Cloud / Phase 2: http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Nur noch für E-Mail-Versand via Graph API
MS_TENANT_ID=xxxxxx
MS_CLIENT_ID=xxxxxx
MS_CLIENT_SECRET=xxxxxx
MS_SERVICE_ACCOUNT=info@yannicksalm.ch
```

### Wrangler Secrets (für Production)

```bash
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put MS_CLIENT_SECRET
```

---

## 13. WICHTIGE ENTSCHEIDUNGEN / DESIGN CHOICES

| Thema                  | Entscheidung                                                        |
|------------------------|---------------------------------------------------------------------|
| **Storage**            | **Supabase Storage** (Buckets: pt-profile, exercise-videos, client-documents, invoices, email-assets) |
| Auth                   | Supabase Auth (Email + Google OAuth)                                |
| PT-Rolle setzen        | Manuell vom Admin in DB                                             |
| Client Login           | Gesperrt bis PT zugewiesen (has_coach Trigger)                      |
| Subdomains             | pt. / ptclient. / ptone. (kein sub-subdomain, SSL-Problem)          |
| Deployment             | OpenNext + Cloudflare Workers (3 unabhängige Worker)                |
| Email-Versand          | Microsoft Graph API als info@yannicksalm.ch (nur noch E-Mail, kein Dateispeicher) |
| PT Videos              | Separate Tabelle exercise_pt_videos, Storage RLS + DB RLS           |
| Datei-URLs             | Signed URLs (private Buckets, 1h) / Public URLs (pt-profile)        |
| Storage Migration      | Cloud (Test) → Local Docker → Cloud Produktion (nur URL ändert sich)|
| Calendar               | Nur PT (kein Client-Kalender)                                       |
| Journal Format         | PT wählt: KW oder DD.MM                                             |
| Mahnungen              | 1. + 2. Mahnung optional, konfigurierbare Tage                      |
| Email Template         | HTML Editor (Unlayer/Grapesjs) mit Platzhaltern                     |
| Ernährungsplan         | Prototyp, nur Freitext vorerst                                      |
| Inbox                  | Nur Anfragen, später ausbaubar                                      |
| plans vs training_plans| plans = user-eigene, training_plans = PT-erstellt für Client        |