'use client';

import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { useTranslation } from '@/locales';

const PT_FEATURES = {
  de: [
    {
      icon: '👥', color: '#7c6aff', title: 'Client-Management',
      tagline: 'Alle Klienten. Alles auf einen Blick.',
      desc: 'Verwalte alle deine Clients in einem übersichtlichen Dashboard. Sieh auf einen Blick wer aktiv ist, wer Aufmerksamkeit braucht und wie sich jeder einzelne entwickelt.',
      details: [
        'Vollständige Client-Profile mit Zielen, Startdaten und Körpermessungen',
        'Automatischer Sync von Gewicht und Maßen aus dem Wochenjournal',
        'Statusanzeige: Aktiv, Pause, Ausstehend',
        'Schnellzugriff auf letztes Journal, letztes Workout, offene Rechnungen',
        'Interne Notizen pro Client (nur für dich sichtbar)',
      ],
    },
    {
      icon: '📋', color: '#3ecf8e', title: 'Trainingspläne',
      tagline: 'Erstellen. Teilen. Tracken.',
      desc: 'Erstelle individuelle Trainingspläne für jeden Client, teile sie per Klick und verfolge in Echtzeit welche Einheiten abgeschlossen wurden.',
      details: [
        'Drag & Drop Übungsreihenfolge',
        'Superset-Gruppierung mit visueller Klammerdarstellung',
        'Sätze, Wiederholungen, Gewicht, Pausen – alles konfigurierbar',
        'Plan einem Client zuweisen mit einem Klick',
        'Echtzeit-Tracking: sieh was dein Client gerade trainiert',
        'Plan-Vorlagen speichern und wiederverwenden',
      ],
    },
    {
      icon: '📓', color: '#a78bfa', title: 'Wochenjournal',
      tagline: 'Wöchentlicher Check-in. Immer informiert.',
      desc: 'Konfigurierbare Bewertungskategorien, Körpermessungen und Fotos – deine Clients füllen wöchentlich aus, du siehst den Verlauf sofort.',
      details: [
        'Konfigurierbare Kategorien (Training, Ernährung, Energie, Schlaf, …)',
        'Bewertungsskala 1–10 pro Kategorie',
        'Gewicht, Umfänge und optionale Fortschrittsfotos',
        'Automatische Benachrichtigung wenn Client eingereicht hat',
        'Verlaufsdiagramme für alle Metriken über Zeit',
        'Durchschnittsscore berechnet und gespeichert',
      ],
    },
    {
      icon: '💰', color: '#f5a623', title: 'Buchhaltung',
      tagline: 'Rechnungen. Mahnungen. Übersicht.',
      desc: 'Von der Rechnungserstellung bis zum Steuerexport – PTOne deckt deinen kompletten Buchaltungsworkflow ab, ohne Steuerberater-Wissen zu erfordern.',
      details: [
        'Rechnungen in Sekunden erstellen und als PDF versenden',
        'Automatische 1. und 2. Mahnung per Email (konfigurierbare Tage)',
        'Zahlungsstatus-Farben: Grün / Orange / Rot / Lila',
        'Wiederkehrende Einnahmen und Ausgaben automatisch erstellen',
        'Monats- und Jahresberichte mit Export',
        'Google Calendar Sync für Fälligkeitstermine',
      ],
    },
    {
      icon: '🗂️', color: '#4b9eff', title: 'Drive & Dokumente',
      tagline: 'Alle Dateien. Sicher gespeichert.',
      desc: 'Alle Dateien werden in Supabase Storage gespeichert – strukturiert nach PT und Client. Volle Kontrolle über Sichtbarkeit, kein Drittanbieter-Account nötig.',
      details: [
        'Automatische Ordnerstruktur: Dokumente, Fotos, Rechnungen pro Client',
        'Dokumente hochladen und mit Clients teilen (oder privat halten)',
        'Eigene Instruktionsvideos pro Übung hochladen',
        'Fortschrittsfotos sicher gespeichert und versioniert',
        'Rechnungs-PDFs automatisch abgelegt und abrufbar',
        'Zugriffssteuerung: "Shared" oder "Nur für PT" per Datei',
      ],
    },
    {
      icon: '📅', color: '#f06292', title: 'Kalender & Termine',
      tagline: 'Termine im Griff. Google Calendar inklusive.',
      desc: 'Verwalte Kundentermine direkt in PTOne und synchronisiere optional mit Google Calendar – inklusive Rechnungsfälligkeiten und Mahnungsterminen.',
      details: [
        'Terminverwaltung pro Client',
        'Optional: Google Calendar Sync (bidirektional)',
        'Rechnungsfälligkeiten als Kalenderevents (konfigurierbar)',
        'Mahnungstermine im Kalender anzeigen',
        'Farbcodierung nach Zahlungsstatus',
      ],
    },
  ],
  en: [
    {
      icon: '👥', color: '#7c6aff', title: 'Client management',
      tagline: 'All clients. Everything at a glance.',
      desc: 'Manage all your clients in a clear dashboard. See at a glance who is active, who needs attention and how each individual is progressing.',
      details: [
        'Complete client profiles with goals, start dates and body measurements',
        'Automatic sync of weight and measurements from the weekly journal',
        'Status display: Active, Pause, Pending',
        'Quick access to last journal, last workout, open invoices',
        'Internal notes per client (visible only to you)',
      ],
    },
    {
      icon: '📋', color: '#3ecf8e', title: 'Training plans',
      tagline: 'Create. Share. Track.',
      desc: 'Create individual training plans for each client, share them with a click and track in real time which sessions have been completed.',
      details: [
        'Drag & drop exercise ordering',
        'Superset grouping with visual bracket display',
        'Sets, reps, weight, rest — all configurable',
        'Assign a plan to a client with one click',
        'Real-time tracking: see what your client is currently training',
        'Save and reuse plan templates',
      ],
    },
    {
      icon: '📓', color: '#a78bfa', title: 'Weekly journal',
      tagline: 'Weekly check-in. Always informed.',
      desc: 'Configurable rating categories, body measurements and photos — your clients fill in weekly, you see the progress immediately.',
      details: [
        'Configurable categories (training, nutrition, energy, sleep, …)',
        'Rating scale 1–10 per category',
        'Weight, measurements and optional progress photos',
        'Automatic notification when client submits',
        'Progress charts for all metrics over time',
        'Average score calculated and saved',
      ],
    },
    {
      icon: '💰', color: '#f5a623', title: 'Accounting',
      tagline: 'Invoices. Reminders. Overview.',
      desc: 'From invoice creation to tax export — PTOne covers your complete accounting workflow without requiring accountant knowledge.',
      details: [
        'Create invoices in seconds and send as PDF',
        'Automatic 1st and 2nd reminder emails (configurable days)',
        'Payment status colours: Green / Orange / Red / Purple',
        'Automatically create recurring income and expenses',
        'Monthly and annual reports with export',
        'Google Calendar sync for due dates',
      ],
    },
    {
      icon: '🗂️', color: '#4b9eff', title: 'Drive & documents',
      tagline: 'All files. Securely stored.',
      desc: 'All files are stored in Supabase Storage — structured by PT and client. Full control over visibility, no third-party account required.',
      details: [
        'Automatic folder structure: documents, photos, invoices per client',
        'Upload documents and share with clients (or keep private)',
        'Upload custom instruction videos per exercise',
        'Progress photos stored securely and versioned',
        'Invoice PDFs automatically filed and accessible',
        'Access control: "Shared" or "PT only" per file',
      ],
    },
    {
      icon: '📅', color: '#f06292', title: 'Calendar & appointments',
      tagline: 'Appointments under control. Google Calendar included.',
      desc: 'Manage client appointments directly in PTOne and optionally sync with Google Calendar — including invoice due dates and reminder appointments.',
      details: [
        'Appointment management per client',
        'Optional: Google Calendar sync (bidirectional)',
        'Invoice due dates as calendar events (configurable)',
        'Show reminder appointments in calendar',
        'Colour coding by payment status',
      ],
    },
  ],
};

export default function FeaturesPage() {
  const { lang } = useTranslation();
  const features = PT_FEATURES[lang] ?? PT_FEATURES.de;

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 64, background: 'var(--bg-page)' }}>
        {/* Hero */}
        <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: '72px 24px 64px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 400, background: 'radial-gradient(ellipse, rgba(124,106,255,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', maxWidth: 680, margin: '0 auto' }}>
            <div className="section-eyebrow" style={{ marginBottom: 16 }}>PT Dashboard</div>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16, letterSpacing: '-0.02em' }}>
              {lang === 'de' ? 'Alles was du als PT brauchst' : 'Everything you need as a PT'}
            </h1>
            <p style={{ fontSize: 18, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 36 }}>
              {lang === 'de'
                ? 'PTOne vereint alle Tools für Personal Trainer in einer eleganten App – von der Clientverwaltung bis zur Buchhaltung.'
                : 'PTOne combines all tools for personal trainers in one elegant app — from client management to accounting.'}
            </p>
            <a href="/register" className="btn btn-primary" style={{ fontSize: 16, padding: '14px 32px' }}>
              {lang === 'de' ? 'Kostenlos starten' : 'Start for free'}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
        </div>

        {/* Features */}
        <div className="container" style={{ padding: '80px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: i % 2 === 0 ? '1fr 1fr' : '1fr 1fr', gap: 56, alignItems: 'center' }}>
                {/* Text side */}
                <div style={{ order: i % 2 === 0 ? 0 : 1 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, background: `${f.color}18`, color: f.color, border: `1px solid ${f.color}30`, marginBottom: 20 }}>
                    <span>{f.icon}</span> {f.title}
                  </div>
                  <h2 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, letterSpacing: '-0.02em' }}>
                    {f.tagline}
                  </h2>
                  <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: 24 }}>{f.desc}</p>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {f.details.map((d, j) => (
                      <li key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <svg style={{ flexShrink: 0, marginTop: 2 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={f.color} strokeWidth="2.5" strokeLinecap="round">
                          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        <span style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual side */}
                <div style={{ order: i % 2 === 0 ? 1 : 0 }}>
                  <div style={{ background: 'var(--bg-surface)', border: `1px solid ${f.color}25`, borderRadius: 20, padding: 32, minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 50%, ${f.color}12 0%, transparent 70%)`, pointerEvents: 'none' }} />
                    <div style={{ fontSize: 72, filter: 'grayscale(0.2)' }}>{f.icon}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div style={{ textAlign: 'center', marginTop: 80, padding: '60px 40px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 24 }}>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
              {lang === 'de' ? 'Bereit loszulegen?' : 'Ready to get started?'}
            </h2>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 28 }}>
              {lang === 'de' ? 'Starte kostenlos – keine Kreditkarte nötig.' : 'Start for free — no credit card required.'}
            </p>
            <a href="/register" className="btn btn-primary" style={{ fontSize: 16, padding: '14px 32px' }}>
              {lang === 'de' ? 'Jetzt kostenlos starten' : 'Start for free now'}
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
