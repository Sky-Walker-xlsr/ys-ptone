'use client';

import { useTranslation } from '@/locales';
import { home } from '@/locales/home.strings';

export function HowItWorks() {
  const { t } = useTranslation();
  const s = t(home);

  const steps = [
    { num: '01', title: s.how1Title, desc: s.how1Desc, icon: '👤' },
    { num: '02', title: s.how2Title, desc: s.how2Desc, icon: '📨' },
    { num: '03', title: s.how3Title, desc: s.how3Desc, icon: '🚀' },
  ];

  return (
    <section id="how-it-works" className="section" style={{ background: 'var(--bg-surface)', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'var(--border)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'var(--border)' }} />
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <div className="section-eyebrow">{s.howTitle}</div>
          <h2 className="section-title" style={{ maxWidth: 500, margin: '0 auto 16px' }}>{s.howTitle}</h2>
          <p className="section-sub" style={{ margin: '0 auto' }}>{s.howSub}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 0, position: 'relative' }}>
          {steps.map((step, i) => (
            <div key={i} style={{ position: 'relative' }}>
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hide-mobile" style={{
                  position: 'absolute',
                  top:      44,
                  right:    0,
                  width:    '50%',
                  height:   1,
                  background: 'linear-gradient(to right, var(--accent), transparent)',
                  zIndex:   0,
                }} />
              )}

              <div style={{ padding: '0 32px 0 0', position: 'relative', zIndex: 1 }}>
                {/* Step number + icon */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div style={{
                    width:        48,
                    height:       48,
                    borderRadius: '50%',
                    background:   'var(--accent-muted)',
                    border:       '1px solid rgba(124,106,255,0.3)',
                    display:      'flex',
                    alignItems:   'center',
                    justifyContent: 'center',
                    fontSize:     22,
                    flexShrink:   0,
                  }}>
                    {step.icon}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-text)', letterSpacing: '0.04em' }}>
                    {step.num}
                  </span>
                </div>

                <h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
