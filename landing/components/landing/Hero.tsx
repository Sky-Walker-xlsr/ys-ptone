'use client';

import { useTranslation } from '@/locales';
import { home } from '@/locales/home.strings';
import { AppMockup } from './AppMockup';

const REGISTER_URL = '/register';

export function Hero() {
  const { t } = useTranslation();
  const s = t(home);

  return (
    <section style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      paddingTop: 64,
    }}>
      {/* Background glow */}
      <div style={{ position: 'absolute', top: '10%', left: '20%', width: 750, height: 750, background: 'radial-gradient(ellipse, rgba(124,106,255,0.15) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '5%', right: '15%', width: 500, height: 500, background: 'radial-gradient(ellipse, rgba(62,207,142,0.07) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Grid pattern */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, opacity: 0.025,
        backgroundImage: 'linear-gradient(var(--text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)',
        backgroundSize: '75px 75px',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 1400, margin: '0 auto', padding: '100px 30px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)',
          gap: 75,
          alignItems: 'center',
        }}>

          {/* Left: Text */}
          <div>
            {/* Eyebrow badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '5px 15px', borderRadius: 999, fontSize: 15, fontWeight: 500,
              background: 'rgba(124,106,255,0.12)', color: '#bdb0ff',
              border: '1px solid rgba(124,106,255,0.2)', marginBottom: 30,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c6aff', display: 'inline-block', flexShrink: 0 }} />
              {s.heroEyebrow}
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: 'clamp(45px, 6.25vw, 75px)',
              fontWeight: 800,
              lineHeight: 1.08,
              marginBottom: 30,
              letterSpacing: '-0.02em',
            }}>
              <span style={{ color: 'var(--text-primary)' }}>{s.heroTitle}</span>
              <br />
              <span style={{
                background: 'linear-gradient(135deg, #7c6aff, #a78bfa, #3ecf8e)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {s.heroTitleAccent}
              </span>
            </h1>

            {/* Subtitle */}
            <p style={{
              fontSize: 23,
              color: 'var(--text-muted)',
              lineHeight: 1.7,
              marginBottom: 45,
              maxWidth: 600,
            }}>
              {s.heroSub}
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap' }}>
              <a
                href={REGISTER_URL}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  padding: '18px 35px', borderRadius: 10,
                  fontSize: 20, fontWeight: 600,
                  background: '#7c6aff', color: '#fff',
                  textDecoration: 'none', whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
              >
                {s.heroCTAPrimary}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
              <a
                href="/pt"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  padding: '18px 35px', borderRadius: 10,
                  fontSize: 20, fontWeight: 600,
                  background: 'var(--bg-card)', color: 'var(--text-primary)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  textDecoration: 'none', whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
              >
                {s.heroCTASecondary}
              </a>
            </div>

            {/* Trust signals */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 25, marginTop: 40, flexWrap: 'wrap' }}>
              {['DSGVO-konform', 'Hosted in 🇪🇺', 'Kostenlos starten'].map((label) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3ecf8e" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: App mockup */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} className="hide-mobile">
            <div style={{ position: 'relative', width: '100%' }}>
              <div style={{ position: 'absolute', inset: -50, background: 'radial-gradient(ellipse, rgba(124,106,255,0.2) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <AppMockup />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom fade */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, background: 'linear-gradient(to bottom, transparent, var(--bg-page))', pointerEvents: 'none', zIndex: 1 }} />
    </section>
  );
}
