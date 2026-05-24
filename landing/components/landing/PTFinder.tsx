'use client';

import { useState } from 'react';
import { useTranslation } from '@/locales';
import { home } from '@/locales/home.strings';

// Placeholder PT cards (werden später aus Supabase geladen), wichtig in supabase und pt-dashboard en und de!
const PLACEHOLDER_PTS = [
  {
    name:            'Yannick Salm',
    slug:            'yannick-salm',
    location:        'Zürich, CH',
    specializations: ['Muskelaufbau', 'Gewichtsabnahme', 'Ernährungsberatung'],
    languages:       ['DE', 'EN'],
    yearsExp:        6,
    shortBio:        'Zertifizierter Personal Trainer mit Fokus auf nachhaltige Körpertransformation und individuelle Betreuung.',
    initials:        'YS',
    color:           '#7c6aff',
  },
  {
    name:            'Lena Müller',
    slug:            'lena-mueller',
    location:        'Basel, CH',
    specializations: ['Ausdauer', 'Rehabilitation', 'Yoga'],
    languages:       ['DE'],
    yearsExp:        4,
    shortBio:        'Spezialisiert auf funktionelles Training und Rehabilitation nach Verletzungen.',
    initials:        'LM',
    color:           '#3ecf8e',
  },
  {
    name:            'Marco Bianchi',
    slug:            'marco-bianchi',
    location:        'Bern, CH',
    specializations: ['Kraftsport', 'Muskelaufbau', 'Wettkampf-Vorbereitung'],
    languages:       ['DE', 'IT', 'EN'],
    yearsExp:        9,
    shortBio:        'Ehemaliger Wettkampf-Athlet, heute Trainer für ambitionierte Kraftsportler und Bodybuilder.',
    initials:        'MB',
    color:           '#f5a623',
  },
];

export function PTFinder() {
  const { t, lang } = useTranslation();
  const s = t(home);
  const [query, setQuery] = useState('');

  const filtered = PLACEHOLDER_PTS.filter(pt =>
    query === '' ||
    pt.name.toLowerCase().includes(query.toLowerCase()) ||
    pt.location.toLowerCase().includes(query.toLowerCase()) ||
    pt.specializations.some(sp => sp.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <section id="find-pt" className="section" style={{ background: 'var(--bg-surface)', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'var(--border)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'var(--border)' }} />

      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="section-eyebrow">PT Finder</div>
          <h2 className="section-title" style={{ margin: '0 auto 14px' }}>{s.finderTitle}</h2>
          <p className="section-sub" style={{ margin: '0 auto 32px' }}>{s.finderSub}</p>

          {/* Search bar */}
          <div style={{ maxWidth: 520, margin: '0 auto', position: 'relative' }}>
            <svg
              style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }}
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="input"
              style={{ paddingLeft: 48 }}
              type="text"
              placeholder={s.finderPlaceholder}
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* PT Cards */}
        {filtered.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20, marginBottom: 40 }}>
            {filtered.map((pt, i) => (
              <div key={i} className="card" style={{ padding: 24 }}>
                {/* Header */}
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{
                    width:          56,
                    height:         56,
                    borderRadius:   '50%',
                    background:     `${pt.color}25`,
                    border:         `2px solid ${pt.color}40`,
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    fontSize:       18,
                    fontWeight:     700,
                    color:          pt.color,
                    flexShrink:     0,
                  }}>
                    {pt.initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)' }}>{pt.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {pt.location}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 2 }}>
                      {pt.yearsExp} {lang === 'de' ? 'Jahre Erfahrung' : 'years experience'}
                    </div>
                  </div>
                  {/* Languages */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    {pt.languages.map(l => (
                      <span key={l} style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'var(--accent-muted)', color: 'var(--accent-text)' }}>{l}</span>
                    ))}
                  </div>
                </div>

                {/* Bio */}
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16 }}>
                  {pt.shortBio}
                </p>

                {/* Specializations */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                  {pt.specializations.map(sp => (
                    <span key={sp} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      {sp}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={`/pt/${pt.slug}`} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: 13, padding: '9px 16px' }}>
                    {s.finderViewProfile}
                  </a>
                  <a href={`/pt/${pt.slug}#request`} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 13, padding: '9px 16px' }}>
                    {s.finderRequest}
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 600, fontSize: 17, color: 'var(--text-primary)', marginBottom: 8 }}>{s.finderEmptyTitle}</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{s.finderEmptySub}</div>
          </div>
        )}

        {/* View all CTA */}
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <a href="/pt" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600,
            background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
            color: 'var(--text-primary)', textDecoration: 'none', transition: 'all 0.15s',
          }}>
            {lang === 'de' ? 'Alle Trainer anzeigen' : 'View all trainers'}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>
      </div>
    </section>
  );
}
