'use client';

import { useTranslation } from '@/locales';
import { home } from '@/locales/home.strings';

const REGISTER_URL = '/register';

export function CTASection() {
  const { t, lang } = useTranslation();
  const s = t(home);

  const clientFeatures = lang === 'de'
    ? [
        { icon: '🏋️', title: 'Workout tracken',       desc: 'Übungen aus deinem Plan starten, Gewichte & Wiederholungen loggen, PRs automatisch erkennen.' },
        { icon: '📓', title: 'Wochenjournal',          desc: 'Wöchentliches Check-in mit Körperdaten, Fotos und Bewertungen – direkt an deinen Trainer.' },
        { icon: '📈', title: 'Fortschritt sehen',       desc: 'Gewichtsverlauf, Körpermaße und Leistungskurven auf einen Blick.' },
        { icon: '📄', title: 'Rechnungen & Dokumente', desc: 'Alle Rechnungen und geteilten Dateien immer griffbereit. Mit Fälligkeits-Hinweisen.' },
      ]
    : [
        { icon: '🏋️', title: 'Track workouts',         desc: 'Start exercises from your plan, log weights & reps, PRs recognised automatically.' },
        { icon: '📓', title: 'Weekly journal',          desc: 'Weekly check-in with body data, photos and ratings – sent directly to your trainer.' },
        { icon: '📈', title: 'See your progress',       desc: 'Weight history, body measurements and performance curves at a glance.' },
        { icon: '📄', title: 'Invoices & documents',   desc: 'All invoices and shared files always at hand. With due-date reminders.' },
      ];

  return (
    <>
      {/* ── PT CTA ── */}
      <section className="section" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(124,106,255,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid rgba(124,106,255,0.25)',
            borderRadius: 24, padding: '72px 48px', textAlign: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'linear-gradient(var(--text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

            <div className="badge" style={{ marginBottom: 24 }}><span>✦</span> PTOne</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16, letterSpacing: '-0.02em' }}>
              {s.ctaTitle}
            </h2>
            <p style={{ fontSize: 18, color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto 36px' }}>
              {s.ctaSub}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              {/* Clients register freely */}
              <a href={REGISTER_URL} className="btn btn-primary" style={{ fontSize: 16, padding: '14px 32px' }}>
                {s.ctaPrimary}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
              {/* PTs contact to get access */}
              <a href="/contact" className="btn btn-secondary" style={{ fontSize: 16, padding: '14px 32px' }}>
                {lang === 'de' ? 'PT-Zugang anfragen' : 'Request PT access'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </a>
            </div>
            <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-subtle)' }}>
              {lang === 'de'
                ? '👤 Clients registrieren sich direkt · 🏋️ Personal Trainer werden nach Kontaktaufnahme freigeschaltet'
                : '👤 Clients register directly · 🏋️ Personal Trainers get access after contacting us'}
            </p>
          </div>
        </div>
      </section>

      {/* ── Client Dashboard Preview ── */}
      <section className="section" style={{ background: 'var(--bg-surface)', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'var(--border)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'var(--border)' }} />

        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="section-eyebrow" style={{ marginBottom: 12 }}>
              {lang === 'de' ? 'Für deine Clients' : 'For your clients'}
            </div>
            <h2 className="section-title" style={{ margin: '0 auto 14px' }}>
              {lang === 'de' ? 'Was deine Clients sehen' : 'What your clients see'}
            </h2>
            <p className="section-sub" style={{ margin: '0 auto' }}>
              {lang === 'de'
                ? 'Eine dedizierte Client-App, die genau das bietet, was deine Klienten brauchen.'
                : 'A dedicated client app that gives your clients exactly what they need.'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20, marginBottom: 40 }}>
            {clientFeatures.map((f, i) => (
              <div key={i} className="card" style={{ padding: '24px 22px' }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <a href="/client-features" className="btn btn-secondary" style={{ fontSize: 15, padding: '13px 28px' }}>
              {lang === 'de' ? 'Mehr zur Client-App' : 'Learn more about the client app'}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
