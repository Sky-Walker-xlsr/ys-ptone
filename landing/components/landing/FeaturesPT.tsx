'use client';

import { useTranslation } from '@/locales';
import { home } from '@/locales/home.strings';

const icons = [
  // Clients
  <svg key={0} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  // Plans
  <svg key={1} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  // Journal
  <svg key={2} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  // Accounting
  <svg key={3} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  // Drive
  <svg key={4} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>,
  // Calendar
  <svg key={5} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
];

const accentColors = ['#7c6aff', '#3ecf8e', '#a78bfa', '#f5a623', '#4b9eff', '#f06292'];

export function FeaturesPT() {
  const { t } = useTranslation();
  const s = t(home);

  const features = [
    { title: s.feat1Title, desc: s.feat1Desc },
    { title: s.feat2Title, desc: s.feat2Desc },
    { title: s.feat3Title, desc: s.feat3Desc },
    { title: s.feat4Title, desc: s.feat4Desc },
    { title: s.feat5Title, desc: s.feat5Desc },
    { title: s.feat6Title, desc: s.feat6Desc },
  ];

  return (
    <section id="features" className="section">
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: 56 }}>
          <div className="section-eyebrow">Für Personal Trainer</div>
          <h2 className="section-title">{s.featPTHeadline}</h2>
          <p className="section-sub">{s.featPTSub}</p>
        </div>

        {/* Grid */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap:                 20,
        }}>
          {features.map((f, i) => (
            <div
              key={i}
              className="card"
              style={{ padding: '28px 28px' }}
            >
              {/* Icon */}
              <div style={{
                width:        44,
                height:       44,
                borderRadius: 12,
                background:   `${accentColors[i]}18`,
                border:       `1px solid ${accentColors[i]}30`,
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                color:        accentColors[i],
                marginBottom: 18,
              }}>
                {icons[i]}
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>
                {f.title}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
