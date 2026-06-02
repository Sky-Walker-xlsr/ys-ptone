# PTOne — Full Application Documentation

> Personal Training Management Platform  
> Stack: Next.js 16 · Supabase · Cloudflare Workers · TypeScript

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Apps & Deployment](#2-apps--deployment)
3. [Database Schema](#3-database-schema)
4. [Authentication & RLS](#4-authentication--rls)
5. [PT Dashboard (pt app)](#5-pt-dashboard-pt-app)
   - [Dashboard / Overview](#51-dashboard--overview)
   - [Clients](#52-clients)
   - [Training Plans](#53-training-plans)
   - [Journal](#54-journal)
   - [Accounting](#55-accounting)
   - [Calendar](#56-calendar)
   - [Drive](#57-drive)
   - [Inbox](#58-inbox)
   - [Profile & Settings](#59-profile--settings)
6. [Client App (client app)](#6-client-app-client-app)
   - [Plans Tab](#61-plans-tab)
   - [Logbook Tab](#62-logbook-tab)
   - [Journal Tab](#63-journal-tab)
   - [Account Tab](#64-account-tab)
7. [Landing Page](#7-landing-page)
8. [API Routes](#8-api-routes)
9. [Storage Buckets](#9-storage-buckets)
10. [Environment Variables & Secrets](#10-environment-variables--secrets)
11. [Migrations](#11-migrations)
12. [Key Features Deep-Dive](#12-key-features-deep-dive)

---

## 1. Architecture Overview

```
ys-ptone/
├── pt/          — PT Dashboard (Next.js 16, Cloudflare Workers)
├── client/      — Client App   (Next.js 16, Cloudflare Workers)
├── landing/     — Landing Page (Next.js 16, Cloudflare Workers)
├── supabase/    — SQL migrations + schema reference
└── assets/      — Documentation, canvas mindmaps
```

All three apps are built with **Next.js 16** and deployed to **Cloudflare Workers** via `@opennextjs/cloudflare`. The backend is **Supabase** (PostgreSQL + Auth + Storage + Realtime).

### Data flow

```
Browser → Cloudflare Worker (Next.js SSR/API Routes) → Supabase PostgreSQL
                                                      → Supabase Storage
                                                      → Google Calendar API
                                                      → Resend (email)
                                                      → Microsoft Graph (OneDrive)
```

---

## 2. Apps & Deployment

| App | URL | Worker name |
|-----|-----|-------------|
| PT Dashboard | `pt.yannicksalm.ch` | `ptone-pt` |
| Client App | `ptclient.yannicksalm.ch` | `ptone-client` |
| Landing | `ptone.yannicksalm.ch` | `ptone-landing` |

### Deploy command
```bash
cd pt/      && npm run deploy
cd client/  && npm run deploy
cd landing/ && npm run deploy
```

### Build command
```bash
npm run build   # Next.js build
npm run preview # opennextjs-cloudflare build + wrangler dev
```

---

## 3. Database Schema

### Core tables

| Table | Purpose |
|-------|---------|
| `profiles` | All users (PT + clients). Fields: `id`, `role`, `email`, `display_name`, `first_name`, `last_name`, `avatar_url`, `is_approved`, `has_coach` |
| `trainer_clients` | PT ↔ Client relationship. Fields: `trainer_id`, `client_id`, `status` (`active`/`pending`/`paused`/`archived`) |
| `contact_requests` | Inbox messages from landing page. Fields: `pt_id`, `name`, `email`, `message`, `read` |

### Plans & Workouts

| Table | Purpose |
|-------|---------|
| `plans` | Training plan templates. `user_id`, `title`, `description`, `is_template` |
| `plan_exercises` | Exercises in a plan. `plan_id`, `exercise_id`, `position`, `superset_group`, `default_sets` |
| `plan_sets` | Default sets per exercise. `plan_exercise_id`, `set_number`, `weight_kg`, `reps` |
| `plan_assignments` | Plan assigned to client. `plan_id`, `trainer_id`, `client_id` |
| `plan_folders` | Template folders for organisation |
| `exercises` | Exercise library cache. `external_id` (from EDB), `name`, `source` |
| `workout_sessions` | Client workout sessions. `user_id`, `title`, `status`, `started_at`, `finished_at` |
| `workout_exercises` | Exercises in a session. `workout_session_id`, `exercise_id`, `position`, `superset_group` |
| `sets` | Logged sets in session. `workout_session_id`, `workout_exercise_id`, `set_number`, `weight_kg`, `reps`, `is_completed` |
| `exercise_notes` | Per-user notes per exercise |
| `pt_exercise_videos` | PT-uploaded demo videos per exercise. `pt_id`, `exercise_id`, `title`, `storage_path` |

### Journal

| Table | Purpose |
|-------|---------|
| `journal_templates` | Weekly journal templates created by PT |
| `journal_assignments` | Template assigned to client |
| `journal_entries` | Client weekly journal submissions. `client_id`, `pt_id`, `week_label`, `year`, `week_number`, `weight_kg`, `avg_score`, `submitted_at` |
| `journal_responses` | Answers to journal questions |
| `journal_ratings` | Numerical ratings in journal |
| `body_weight_logs` | Weight log entries |
| `body_measurement_logs` | Body measurement entries |
| `client_profiles` | Extended client data: height, goals, start date |

### Accounting

| Table | Purpose |
|-------|---------|
| `invoices` | Invoices. `pt_id`, `client_id`, `invoice_number`, `title`, `status`, `issue_date`, `due_date`, `subtotal`, `tax_rate`, `tax_amount`, `total`, `pdf_url`, `sent_at`, `paid_at` |
| `invoice_items` | Line items per invoice. `invoice_id`, `description`, `quantity`, `unit_price`, `total`, `position` |
| `expense_entries` | PT expenses. `pt_id`, `title`, `amount`, `category`, `date`, `receipt_url`, `is_recurring`, `recurring_interval`, `next_occurrence` |
| `accounting_settings` | Per-PT accounting config: currency, tax, invoice template, dunning settings, IBAN, item templates |

### Calendar

| Table | Purpose |
|-------|---------|
| `appointments` | PT-created appointments. `pt_id`, `client_id`, `title`, `start_at`, `end_at`, `google_event_id` |
| `google_calendar_connections` | OAuth tokens for Google Calendar. `trainer_id`, `access_token`, `refresh_token`, `google_email`, `default_calendar_id` |

### Drive

| Table | Purpose |
|-------|---------|
| `pt_files` | Files uploaded to drive. `trainer_id`, `client_id`, `name`, `storage_path`, `size_bytes`, `section`, `subfolder` |
| `pt_client_folders` | Folders per client in drive |
| `drive_files` | OneDrive file metadata |
| `drive_folders` | OneDrive folder metadata |

### Invoice status flow

```
draft → sent → paid
            → overdue → reminder1 → reminder2
```

---

## 4. Authentication & RLS

Authentication is handled by **Supabase Auth**. Every table has Row Level Security (RLS) enabled.

### Key RLS patterns

| Pattern | Example |
|---------|---------|
| PT owns their data | `USING (auth.uid() = pt_id)` |
| Client reads their data | `USING (auth.uid() = client_id)` |
| Active client reads PT data | `EXISTS (SELECT 1 FROM trainer_clients WHERE trainer_id = pt_id AND client_id = auth.uid() AND status = 'active')` |
| Service role bypasses all | API routes use `SUPABASE_SERVICE_ROLE_KEY` |

### Storage RLS patterns
- PT uploads to `{pt_id}/...` path → policy checks `(storage.foldername(name))[1] = auth.uid()::text`
- Clients can read from their PT's folder → checks trainer_clients relationship

---

## 5. PT Dashboard (pt app)

### 5.1 Dashboard / Overview

**Route:** `/dashboard`

A widget-based dashboard with freely draggable and resizable cards.

**Features:**
- 4 stat cards (always visible): Active Clients, Open Invoices, Monthly Revenue, Upcoming Appointments
- Draggable canvas cards: drag header to move, drag corner to resize
- 50px snap grid, cards cannot overlap
- Right boundary = screen edge, bottom is unlimited
- Edit mode (✎ button): shows × remove buttons, enables drag/resize
- + FAB: opens catalog to add more cards
- Layout persisted in `localStorage`

**Available card types:**
- `quick-actions` — New Invoice, New Appointment, Invite Client buttons
- `appointments-list` — Upcoming appointments
- `journal-list` — Recent journal submissions
- `clients-list` — Searchable client list
- `recent-invoices` — Latest invoices with status

**Quick actions from dashboard:**
- **New invoice** → navigates to `/accounting?new=1` (auto-opens modal)
- **New appointment** → opens inline modal, creates in Google Calendar + appointments table
- **Invite client** → navigates to `/clients?new=1`

---

### 5.2 Clients

**Route:** `/clients`

Manage PT ↔ Client relationships.

**Features:**
- List of active, pending, paused, archived clients
- Invite client by email (searches `profiles` by email)
- Client status management: accept/decline, pause, reactivate, disconnect
- `?new=1` URL param auto-opens the invite modal

**Client detail page:** `/clients/[id]`

Tabs:
- **Pläne / Plans** — Assign/create training plans, inline plan editor with exercise sets, supersets
- **Trainingsbuch / Logbook** — View client's completed workout sessions with exercise+set details
- **Journal** — Review client journal submissions, body measurements
- **Dokumente / Documents** — Upload/download files for this client (Drive integration)
- **Rechnungen / Invoices** — View accounting invoices, create new invoices, send, mark paid, download PDF

**Exercise menu (in plan editor):**
- Add to Superset / Dissolve Superset
- Replace Exercise
- 📹 Videos verwalten — Upload/manage demo videos for this exercise
- Remove Exercise

---

### 5.3 Training Plans

**Route:** `/plans`

Manage template plans and assign them to clients.

**Features:**
- Client plans: grouped by client, expandable
- Template plans: organised in folders
- Create new plan (blank or from template)
- Insert template into client plan (deep-copies exercises + sets)
- Rename/delete folders
- Full plan editor: exercises, supersets, sets (weight/reps defaults)
- Exercise menu with video management

**Template insertion bug fix:** Uses correct column names `position` and `superset_group` (not `order_index`/`superset_group_id`).

---

### 5.4 Journal

**Route:** `/journal`

Review weekly journals submitted by clients.

---

### 5.5 Accounting

**Route:** `/accounting`

Full accounting module for PT billing.

**Tabs:**

#### Rechnungen (Invoices)
- Create invoices with line items, tax, client selection
- Status badges: Draft → Sent → Paid / Overdue → 1. Mahnung → 2. Mahnung
- Filter by status
- Click invoice → detail modal with actions:
  - ⬇ PDF download (generated client-side with jsPDF)
  - ✉ Send (generates PDF → attaches to email via Resend → marks as sent → stores PDF in Drive)
  - Mark as paid
  - 1./2. Mahnung (reminder emails)
  - Edit / Delete

#### Einnahmen (Income)
- Auto-computed from paid invoices
- Summary cards: this month, this year, total
- 12-month bar chart
- List of paid invoices

#### Ausgaben (Expenses)
- Manual expense entries with categories
- Categories: Miete, Material, Software, Marketing, Transport, Versicherung, Weiterbildung, Sonstiges
- Recurring expenses: weekly/monthly/quarterly/yearly (auto-generated by cron route)
- Receipt upload to `accounting` storage bucket

#### Berichte (Reports)
- P&L summary cards
- Dual bar chart (income vs expenses per month)
- Category breakdown with progress bars
- CSV export

#### Vorlagen (Templates)
- Create/edit/delete item templates
- Templates appear as quick-insert in invoice creation

#### Einstellungen (Settings)
- General: currency, default tax rate, tax number, payment due days
- Invoice template: prefix (e.g. RE), accent color, footer text
- Email & Dunning: auto-send toggle, notification email, 1./2. Mahnung config with `{{placeholders}}`
- QR-Rechnung (Swiss QR): IBAN, creditor name/address → appends Swiss QR payment slip to all PDFs

#### Invoice numbering
Format: `{PREFIX}-{YEAR}-{0000001}` (7-digit sequence, resets each year)  
Example: `RE-2026-0000001`

#### PDF generation (jsPDF)
- Client-side, no server needed
- Colored header bar, PT info, client info, line items table, totals
- Swiss QR payment slip (SPS 2022, 31-element format) if IBAN configured
- QR code with Swiss cross, Empfangsschein, Zahlteil sections

#### Email sending (Resend REST API)
- Triggered on "Send" or auto via cron for reminders
- PDF attached as base64
- When sent: PDF uploaded to `ptone_drive` storage at `{ptId}/clients/{clientId}/invoices/` AND `{ptId}/invoices/`
- Creates `pt_files` records → appears in Drive

#### Cron (on page load)
`POST /api/accounting/cron`:
1. Updates `sent` invoices → `overdue` after due date
2. Sends 1. Mahnung after `reminder1_days_after_due`
3. Sends 2. Mahnung after `reminder2_days_after_r1`
4. Auto-generates recurring expense entries

---

### 5.6 Calendar

**Route:** `/calendar`

Google Calendar integration for appointment management.

**Features:**
- Connects via OAuth (`/api/google/connect` → `/api/google/callback`)
- Multiple calendar support (tabs per connected calendar)
- Default calendar setting
- Create appointments with client selector (searchable autocomplete)
- Appointments mirrored to `appointments` table → clients can see them
- Delete appointments (removes from Google Calendar + appointments table)

---

### 5.7 Drive

**Route:** `/drive`

File management for PT and clients.

**Sections:**
- **My Files** — PT's own files
- **Videos** — PT's exercise videos
- **Clients** — Per-client files
  - Documents tab: folder tree with upload, download, delete
  - Invoices tab: accounting invoices from `invoices` table + manually uploaded PDFs

**Storage bucket:** `ptone_drive`  
**Path structure:**
- `{ptId}/clients/{clientId}/invoices/{file}` — client invoices
- `{ptId}/invoices/{file}` — PT invoice archive
- `{ptId}/clients/{clientId}/documents/{folder}/{file}` — client documents

---

### 5.8 Inbox

**Route:** `/inbox`

Contact requests from the landing page. Real-time unread badge in sidebar.

---

### 5.9 Profile & Settings

**Route:** `/profile`, `/settings`

Settings page tabs:
- **Appearance** — Dark/light mode toggle, language (DE/EN)
- **Notifications** — Journal submissions, payment reminders, appointments
- **Integrations** — Google Calendar connect/disconnect, default calendar selector
- **Account** — Export data, Sign out, Delete account

---

## 6. Client App (client app)

**URL:** `ptclient.yannicksalm.ch`

Mobile-first single-page app for PT clients. Bottom tab navigation.

### 6.1 Plans Tab

- View assigned training plans
- Start workout from plan or empty
- Plan view with exercises, sets, weights/reps
- Superset pairing support

### 6.2 Logbook Tab

- History of completed workout sessions
- Filter by date
- Session detail: exercise list with completed sets

### 6.3 Journal Tab

- View assigned weekly journal templates
- Submit weekly journal entries
- Body weight + measurement tracking
- Historical entries list

### 6.4 Account Tab

**Sub-views:**

**Main:**
- Profile card (name, email)
- Personal Trainer section: pending requests (accept/decline), active PT cards
- Upcoming appointments (from `appointments` table where `client_id = auth.uid()`)
- Documents → opens docs sub-view

**Documents sub-view → Documents tab:**
- Read-only folder tree of PT-shared files
- Download files

**Documents sub-view → Rechnungen tab:**
- Accounting invoices from `invoices` table (where `client_id = auth.uid()`)
- Each row is clickable → bottom sheet modal with:
  - Invoice metadata (number, dates, status)
  - Line items table (fetched from `invoice_items`)
  - Subtotal, tax, total breakdown
  - Notes
  - **⬇ PDF herunterladen** (uses stored `pdf_url` if available)
  - **⬇ PDF generieren & herunterladen** (generates client-side via jsPDF if no URL stored)
- Also shows manually uploaded PDF files from `pt_files`

**Exercise Videos (during workout):**
- When doing a workout, each exercise shows a "📹 X Videos von deinem PT" section
- Videos uploaded by PT are streamed via signed Supabase Storage URLs
- Tap to expand, ▶ Play to watch inline

**Appearance:** Dark/light mode, language (DE/EN)
**Sign out**

---

## 7. Landing Page

**URL:** `ptone.yannicksalm.ch`  
Contact form → creates entry in `contact_requests` → appears in PT inbox.

---

## 8. API Routes

All API routes live in the PT app (`pt/app/api/`).

### Google Calendar
| Route | Method | Description |
|-------|--------|-------------|
| `/api/google/connect` | GET | Start OAuth flow |
| `/api/google/callback` | GET | OAuth callback, store tokens |
| `/api/google/calendars` | GET | List PT's calendars |
| `/api/google/events` | GET | List events for month |
| `/api/google/event` | POST | Create event + mirror to appointments |
| `/api/google/event` | DELETE | Delete event + remove from appointments |

### Accounting
| Route | Method | Description |
|-------|--------|-------------|
| `/api/accounting/invoices` | GET | List invoices |
| `/api/accounting/invoices` | POST | Create invoice (auto-generates number) |
| `/api/accounting/invoices/[id]` | GET/PATCH/DELETE | Invoice CRUD |
| `/api/accounting/invoices/[id]/send` | POST | Send invoice email + upload PDF to Drive |
| `/api/accounting/expenses` | GET/POST | Expense CRUD |
| `/api/accounting/expenses/[id]` | PATCH/DELETE | Update/delete expense |
| `/api/accounting/settings` | GET/PUT | Accounting settings |
| `/api/accounting/cron` | POST | Status updates + auto-reminders + recurring expenses |

### Authentication helpers
- Session verification via `Authorization: Bearer {access_token}` header
- Admin client created with `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS)

---

## 9. Storage Buckets

| Bucket | Public | Used for |
|--------|--------|---------|
| `ptone_drive` | No | Drive files, client documents, invoice PDFs |
| `accounting` | No | Expense receipts |
| `pt_videos` | No | PT exercise demo videos |

### Path conventions
```
ptone_drive/
  {ptId}/
    invoices/           — PT invoice archive
    clients/
      {clientId}/
        invoices/       — Client-specific invoices
        documents/
          {folder}/     — Client documents in folders
    videos/             — PT video files

pt_videos/
  {ptId}/
    {exerciseId}/       — Videos per exercise

accounting/
  {ptId}/
    receipts/           — Expense receipts
```

---

## 10. Environment Variables & Secrets

### Public variables (in `wrangler.toml [vars]`)
These are bundled into client-side JavaScript and are public by design:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public, rate-limited by RLS) |
| `NEXT_PUBLIC_EXERCISE_SUPABASE_URL` | Exercise DB Supabase URL |
| `NEXT_PUBLIC_EXERCISE_SUPABASE_ANON_KEY` | Exercise DB anon key |
| `MS_TENANT_ID` | Microsoft tenant ID (non-secret) |
| `MS_CLIENT_ID` | Microsoft OAuth client ID (non-secret) |
| `GOOGLE_CALENDAR_CLIENT_ID` | Google OAuth client ID (non-secret) |
| `RESEND_FROM_EMAIL` | From address for emails |
| `NEXT_PUBLIC_APP_URL` | App public URL |

### Secrets (set via `wrangler secret put`, stored in Cloudflare vault)

| Secret | Description |
|--------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Full DB admin access — bypasses all RLS |
| `MS_CLIENT_SECRET` | Microsoft OAuth secret |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | Google OAuth secret |
| `RESEND_API_KEY` | Resend email API key |

### Setup commands (run once per worker)
```bash
# PT worker
cd pt
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put MS_CLIENT_SECRET
wrangler secret put GOOGLE_CALENDAR_CLIENT_SECRET
wrangler secret put RESEND_API_KEY

# Client worker
cd client
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

### Local development (`.env` file — already gitignored)
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GOOGLE_CALENDAR_CLIENT_ID=...
GOOGLE_CALENDAR_CLIENT_SECRET=...
RESEND_API_KEY=...
RESEND_FROM_EMAIL=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 11. Migrations

Run each in Supabase SQL editor in order:

| File | Description |
|------|-------------|
| `001_initial_schema.sql` | Core tables: profiles, trainer_clients, plans |
| `002_fix_trigger.sql` | Auth trigger fixes |
| `003_client_lookup.sql` | Client profile lookup helpers |
| `004_request_system.sql` | Contact requests |
| `005_fix_status_constraint.sql` | Status enum fixes |
| `006_plan_system.sql` | Plans, exercises, sets |
| `007_plan_folders.sql` | Template folders |
| `008_rls_policies.sql` | RLS for accounting_settings |
| `009_journal_system.sql` | Journal templates, entries, responses |
| `010_google_calendar.sql` | Google Calendar connections |
| `011_drive.sql` | Drive files, folders |
| `012_inbox.sql` | Contact request inbox |
| `013_pt_profile_extras.sql` | PT profile extra fields |
| `014_calendar_settings.sql` | Default calendar ID for appointments |
| `015_accounting.sql` | Invoices, invoice_items, expense_entries, accounting storage bucket |
| `016_item_templates.sql` | Item templates column in accounting_settings |
| `017_invoices_add_columns.sql` | Add missing columns to existing invoices table (title, status, subtotal, tax_amount, total, sent_at, paid_at, reminder timestamps) |
| `018_client_invoice_read.sql` | RLS: clients can read their invoices |
| `019_accounting_iban.sql` | IBAN + creditor address columns for Swiss QR invoices |
| `020_exercise_videos.sql` | pt_exercise_videos table + pt_videos storage bucket + RLS |
| `021_invoice_items_client_read.sql` | RLS: clients can read line items of their invoices |
| `022_accounting_settings_client_read.sql` | RLS: clients can read their PT's accounting settings (for PDF generation) |

---

## 12. Key Features Deep-Dive

### Swiss QR Invoice (SPS 2022)
The accounting module generates Swiss-standard QR payment slips compliant with SPS 2022:
- 31-element format separated by line feed (`\n`)
- Address type K (combined)
- Appended to bottom 105mm of A4 invoice PDF
- Contains: IBAN, creditor info, amount, currency, invoice number as reference
- Swiss cross centered on QR code (7×7mm, red background, white cross)
- Compatible with all Swiss banking apps (UBS, ZKB, PostFinance, Raiffeisen)

**Configuration:** Accounting → Settings → QR-Rechnung section

### Exercise Video System
PTs can upload demo videos for any exercise in their library:
- Upload via exercise `...` menu → "📹 Videos verwalten"
- Available in all 3 plan editor locations (client plan panel, standalone client plan editor, template plan editor)
- Stored in `pt_videos/{ptId}/{exerciseId}/` in Supabase Storage
- Clients see videos automatically during workout (if PT has uploaded for that exercise)
- Streamed via 1-hour signed URLs

### Invoice-to-Drive PDF Flow
When a PT sends an invoice:
1. PDF generated client-side (jsPDF)
2. Converted to base64 and sent to `/api/accounting/invoices/[id]/send`
3. Server uploads to `ptone_drive` at two paths:
   - `{ptId}/clients/{clientId}/invoices/{invoiceNumber}.pdf`
   - `{ptId}/invoices/{invoiceNumber}.pdf`
4. Creates `pt_files` records (appears in Drive)
5. Generates 1-year signed URL → stored in `invoice.pdf_url`

### Client PDF Download
Clients can download invoice PDFs two ways:
1. **Stored PDF** (`pdf_url` set): direct link, no generation needed
2. **Generate on-demand** (`pdf_url` null): client app uses jsPDF to generate the same PDF client-side, fetching PT profile and accounting settings (currency, colors, IBAN) from Supabase

### Google Calendar Integration
- OAuth 2.0 flow: PT connects their Google account
- Access tokens stored in `google_calendar_connections` with refresh token
- Auto-refresh: expired tokens refreshed transparently before API calls
- Multiple calendars: PT can select from their calendar list, set a default
- All appointments mirrored to `appointments` table → clients see them in their app

### Recurring Expenses
When `is_recurring = true` on an expense:
- `next_occurrence` stores the next due date
- On accounting page load, `/api/accounting/cron` generates new expense entries for all past-due recurring items
- Supports: weekly, monthly, quarterly, yearly intervals

### Drag-and-Drop Dashboard
The PT dashboard uses a free-form canvas:
- Cards are `position: absolute` with `(x, y, w, h)` stored in localStorage
- 50px snap grid for alignment
- Collision detection: cards cannot overlap (tested every frame during drag)
- No card can go past the right screen boundary
- Bottom is unlimited (canvas expands)
- Edit mode required for drag/resize (prevents accidental moves)

---

## Appendix: Technology Versions

| Technology | Version |
|-----------|---------|
| Next.js | 16.2.6 |
| React | 19.2.4 |
| @opennextjs/cloudflare | ^1.19.10 |
| @supabase/supabase-js | ^2.105.4 |
| wrangler | ^4.91.0 |
| jspdf | latest |
| jspdf-autotable | latest |
| qrcode | latest |
| TypeScript | ^5 |

---

*Last updated: June 2026*
