'use client';

import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { useTranslation } from '@/locales';

const CLIENT_FEATURES = {
  de: [
    {
      icon: '🏋️', color: '#7c6aff', title: 'Workout tracken',
      tagline: 'Jedes Training. Genau dokumentiert.',
      desc: 'Starte dein Training direkt aus dem zugewiesenen Plan deines Trainers. Logge Gewicht, Wiederholungen und Sätze in Echtzeit – auch offline.',
      details: [
        'Training aus PT-Plan starten oder leeres Workout beginnen',
        'Gewichte, Wiederholungen und Sätze in Echtzeit eingeben',
        'Offline-sicher: Daten werden bei Verbindung synchronisiert',
        'Personal Records automatisch erkannt und angezeigt',
        '"Zuletzt"-Spalte: sieh dein letztes Gewicht pro Übung',
        'Superset-Unterstützung mit automatischem Wechsel',
        'Training abschliessen und Zusammenfassung einsehen',
      ],
    },
    {
      icon: '📓', color: '#3ecf8e', title: 'Wochenjournal',
      tagline: 'Wöchentlicher Check-in. Immer aktuell.',
      desc: 'Dein Trainer erstellt ein individuelles Journal-Template für dich. Du füllst es wöchentlich aus – Bewertungen, Körperdaten, Fotos.',
      details: [
        'Bewertungsskala 1–10 pro Kategorie (Training, Ernährung, Energie, …)',
        'Gewicht und Körpermaße eingeben',
        'Optionale Fortschrittsfotos hochladen',
        'Direkt an deinen Trainer übermittelt',
        'Verlaufsansicht deiner eigenen Einträge',
        'Automatische Erinnerung wenn Journal fällig ist',
      ],
    },
    {
      icon: '📈', color: '#a78bfa', title: 'Fortschritt',
      tagline: 'Deine Entwicklung. Klar sichtbar.',
      desc: 'Sieh auf einen Blick wie du dich entwickelst – Gewichtsverlauf, Körpermaße, Bestleistungen und Trainingsvolumen als übersichtliche Charts.',
      details: [
        'Gewichtskurve über Zeit',
        'Körpermaße: Taille, Hüfte, Brust, Arme, Beine',
        'Personal-Record-Verlauf pro Übung',
        'Trainingsvolumen und -frequenz pro Woche',
        'Fortschrittsfotos Vergleich (vorher / nachher)',
        'Durchschnittliche Journal-Scores über Zeit',
      ],
    },
    {
      icon: '📄', color: '#f5a623', title: 'Rechnungen & Dokumente',
      tagline: 'Alles an einem Ort. Immer griffbereit.',
      desc: 'Rechnungen deines Trainers, geteilte Dokumente, Ernährungspläne und Trainingsunterlagen – übersichtlich sortiert und immer verfügbar.',
      details: [
        'Alle Rechnungen mit Fälligkeitsdatum und Status',
        'Farbiger Banner bei offenen oder überfälligen Rechnungen',
        'Geteilte Dokumente und Dateien vom Trainer',
        'Ernährungspläne und Informationsmaterial',
        'PDF-Anzeige direkt in der App',
        'Download-Funktion für alle Dateien',
      ],
    },
  ],
  en: [
    {
      icon: '🏋️', color: '#7c6aff', title: 'Track workouts',
      tagline: 'Every session. Precisely documented.',
      desc: 'Start your training directly from the plan assigned by your trainer. Log weight, reps and sets in real time — even offline.',
      details: [
        'Start training from PT plan or begin an empty workout',
        'Enter weights, reps and sets in real time',
        'Offline-safe: data synced when connection is restored',
        'Personal records automatically recognised and displayed',
        '"Previous" column: see your last weight per exercise',
        'Superset support with automatic switching',
        'Finish training and review summary',
      ],
    },
    {
      icon: '📓', color: '#3ecf8e', title: 'Weekly journal',
      tagline: 'Weekly check-in. Always up to date.',
      desc: 'Your trainer creates an individual journal template for you. You fill it in weekly — ratings, body data, photos.',
      details: [
        'Rating scale 1–10 per category (training, nutrition, energy, …)',
        'Enter weight and body measurements',
        'Upload optional progress photos',
        'Sent directly to your trainer',
        'History view of your own entries',
        'Automatic reminder when journal is due',
      ],
    },
    {
      icon: '📈', color: '#a78bfa', title: 'Progress',
      tagline: 'Your development. Clearly visible.',
      desc: 'See at a glance how you are progressing — weight history, body measurements, personal bests and training volume as clear charts.',
      details: [
        'Weight curve over time',
        'Body measurements: waist, hips, chest, arms, legs',
        'Personal record history per exercise',
        'Training volume and frequency per week',
        'Progress photo comparison (before / after)',
        'Average journal scores over time',
      ],
    },
    {
      icon: '📄', color: '#f5a623', title: 'Invoices & documents',
      tagline: 'Everything in one place. Always at hand.',
      desc: 'Your trainer\'s invoices, shared documents, nutrition plans and training materials — neatly sorted and always available.',
      details: [
        'All invoices with due date and status',
        'Coloured banner for open or overdue invoices',
        'Shared documents and files from your trainer',
        'Nutrition plans and information material',
        'PDF viewer directly in the app',
        'Download function for all files',
      ],
    },
  ],
};

export default function ClientFeaturesPage() {
  const { lang } = useTranslation();
  const features = CLIENT_FEATURES[lang] ?? CLIENT_FEATURES.de;

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 64, background: 'var(--bg-page)' }}>
        {/* Hero */}
        <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: '72px 24px 64px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 400, background: 'radial-gradient(ellipse, rgba(62,207,142,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', maxWidth: 680, margin: '0 auto' }}>
            <div className="section-eyebrow" style={{ marginBottom: 16 }}>
              {lang === 'de' ? 'Client Dashboard' : 'Client Dashboard'}
            </div>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16, letterSpacing: '-0.02em' }}>
              {lang === 'de' ? 'Die App für deine Clients' : 'The app for your clients'}
            </h1>
            <p style={{ fontSize: 18, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 36 }}>
              {lang === 'de'
                ? 'Deine Clients bekommen eine eigene App mit allem was sie brauchen – nicht mehr, nicht weniger.'
                : 'Your clients get their own app with everything they need — nothing more, nothing less.'}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/register" className="btn btn-primary" style={{ fontSize: 16, padding: '14px 32px' }}>
                {lang === 'de' ? 'Als PT starten' : 'Start as a PT'}
              </a>
              <a href="/features" className="btn btn-secondary" style={{ fontSize: 16, padding: '14px 32px' }}>
                {lang === 'de' ? 'PT Dashboard ansehen' : 'View PT dashboard'}
              </a>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="container" style={{ padding: '80px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>
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

                <div style={{ order: i % 2 === 0 ? 1 : 0 }}>
                  <div style={{ background: 'var(--bg-surface)', border: `1px solid ${f.color}25`, borderRadius: 20, padding: 32, minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 50%, ${f.color}12 0%, transparent 70%)`, pointerEvents: 'none' }} />
                    <div style={{ fontSize: 72 }}>{f.icon}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div style={{ textAlign: 'center', marginTop: 80, padding: '60px 40px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 24 }}>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
              {lang === 'de' ? 'Deine Clients verdienen das Beste.' : 'Your clients deserve the best.'}
            </h2>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 28 }}>
              {lang === 'de' ? 'Starte als PT und lade deine Clients sofort ein.' : 'Start as a PT and invite your clients right away.'}
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
