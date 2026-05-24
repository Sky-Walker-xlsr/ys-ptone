'use client';

import { useTranslation } from '@/locales';
import { home } from '@/locales/home.strings';

export function FeaturesClient() {
  const { t } = useTranslation();
  const s = t(home);

  const features = [
    {
      title: s.featC1Title,
      desc:  s.featC1Desc,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
      color: '#7c6aff',
    },
    {
      title: s.featC2Title,
      desc:  s.featC2Desc,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      ),
      color: '#3ecf8e',
    },
    {
      title: s.featC3Title,
      desc:  s.featC3Desc,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      ),
      color: '#a78bfa',
    },
    {
      title: s.featC4Title,
      desc:  s.featC4Desc,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
      ),
      color: '#f5a623',
    },
  ];

  return (
    <section className="section" style={{ position: 'relative' }}>
      {/* Glow */}
      <div style={{ position: 'absolute', top: '30%', right: '-10%', width: 500, height: 500, background: 'radial-gradient(ellipse, rgba(62,207,142,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>

          {/* Left: Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 18 }}>
                <div style={{
                  width:        44,
                  height:       44,
                  borderRadius: 12,
                  background:   `${f.color}15`,
                  border:       `1px solid ${f.color}25`,
                  display:      'flex',
                  alignItems:   'center',
                  justifyContent: 'center',
                  color:        f.color,
                  flexShrink:   0,
                }}>
                  {f.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Title + Client mockup */}
          <div>
            <div className="section-eyebrow" style={{ marginBottom: 12 }}>Für deine Clients</div>
            <h2 className="section-title" style={{ marginBottom: 16 }}>{s.featClientHeadline}</h2>
            <p className="section-sub" style={{ marginBottom: 36 }}>{s.featClientSub}</p>

            {/* Mini client app mockup */}
            <div style={{
              background:   '#0d0d1e',
              border:       '1px solid rgba(124,106,255,0.2)',
              borderRadius: 16,
              overflow:     'hidden',
              boxShadow:    '0 20px 60px rgba(0,0,0,0.5)',
            }} aria-hidden="true">
              {/* Phone-ish header */}
              <div style={{ background: '#111122', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>ptclient.yannicksalm.ch</span>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3ecf8e' }} />
              </div>
              <div style={{ padding: 20 }}>
                {/* Workout card */}
                <div style={{ background: 'rgba(124,106,255,0.1)', border: '1px solid rgba(124,106,255,0.2)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Aktives Workout · 23:14</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 12 }}>Push Day A</div>
                  {[
                    { ex: 'Bankdrücken', sets: '4×8', kg: '80 kg', done: true },
                    { ex: 'Schulterdrücken', sets: '3×10', kg: '50 kg', done: true },
                    { ex: 'Trizeps', sets: '3×12', kg: '25 kg', done: false },
                  ].map((e, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, background: e.done ? '#3ecf8e' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {e.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <span style={{ flex: 1, fontSize: 12, color: e.done ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.8)', textDecoration: e.done ? 'line-through' : 'none' }}>{e.ex}</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{e.sets}</span>
                      <span style={{ fontSize: 11, color: '#7c6aff' }}>{e.kg}</span>
                    </div>
                  ))}
                </div>
                {/* PR badge */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 8, padding: '6px 12px' }}>
                  <span style={{ fontSize: 14 }}>🏆</span>
                  <span style={{ fontSize: 12, color: '#f5a623', fontWeight: 600 }}>Personal Record · Bankdrücken 80kg</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
