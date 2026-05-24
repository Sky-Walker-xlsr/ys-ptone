'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { fetchPublicPTs, type PT } from '@/lib/pt-data';
import { useTranslation } from '@/locales';

export default function PTIndexPage() {
  const { lang } = useTranslation();
  const [pts, setPts]       = useState<PT[]>([]);
  const [loading, setLoad]  = useState(true);
  const [query, setQuery]   = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchPublicPTs().then(data => { setPts(data); setLoad(false); });
  }, []);

  const allSpecs = Array.from(new Set(pts.flatMap(p => p.specializations)));

  const filtered = pts.filter(pt => {
    const matchQ = query === '' ||
      pt.name.toLowerCase().includes(query.toLowerCase()) ||
      (pt.location ?? '').toLowerCase().includes(query.toLowerCase()) ||
      pt.specializations.some(s => s.toLowerCase().includes(query.toLowerCase()));
    const matchF = filter === '' || pt.specializations.includes(filter);
    return matchQ && matchF;
  });

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 64, minHeight: '100vh', background: 'var(--bg-page)' }}>

        {/* Hero */}
        <div style={{
          background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)',
          padding: '72px 24px 64px', textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 400, background: 'radial-gradient(ellipse, rgba(124,106,255,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
            <div className="section-eyebrow" style={{ marginBottom: 16 }}>PT Finder</div>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16, letterSpacing: '-0.02em' }}>
              {lang === 'de' ? 'Finde deinen Personal Trainer' : 'Find your Personal Trainer'}
            </h1>
            <p style={{ fontSize: 18, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 36 }}>
              {lang === 'de'
                ? 'Durchsuche zertifizierte Personal Trainer in der Schweiz.'
                : 'Browse certified personal trainers in Switzerland.'}
            </p>

            {/* Search */}
            <div style={{ maxWidth: 560, margin: '0 auto', position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }}
                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input className="input" style={{ paddingLeft: 48 }} type="text"
                placeholder={lang === 'de' ? 'Nach Name, Standort oder Spezialisierung…' : 'Search by name, location or specialisation…'}
                value={query} onChange={e => setQuery(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="container" style={{ padding: '48px 24px 80px' }}>

          {loading ? (
            /* Skeleton */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24, marginTop: 56 }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="card" style={{ padding: 28, height: 240 }}>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-tertiary)' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 16, background: 'var(--bg-tertiary)', borderRadius: 6, marginBottom: 8, width: '60%' }} />
                      <div style={{ height: 13, background: 'var(--bg-tertiary)', borderRadius: 6, width: '40%' }} />
                    </div>
                  </div>
                  <div style={{ height: 13, background: 'var(--bg-tertiary)', borderRadius: 6, marginBottom: 8 }} />
                  <div style={{ height: 13, background: 'var(--bg-tertiary)', borderRadius: 6, width: '70%' }} />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Filter chips */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
                <button onClick={() => setFilter('')} style={{
                  padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid',
                  background: filter === '' ? 'var(--accent)' : 'transparent',
                  borderColor: filter === '' ? 'var(--accent)' : 'var(--border-strong)',
                  color: filter === '' ? '#fff' : 'var(--text-muted)',
                  fontFamily: 'inherit', transition: 'all 0.15s',
                }}>
                  {lang === 'de' ? 'Alle' : 'All'}
                </button>
                {allSpecs.map(sp => (
                  <button key={sp} onClick={() => setFilter(filter === sp ? '' : sp)} style={{
                    padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid',
                    background: filter === sp ? 'var(--accent)' : 'transparent',
                    borderColor: filter === sp ? 'var(--accent)' : 'var(--border-strong)',
                    color: filter === sp ? '#fff' : 'var(--text-muted)',
                    fontFamily: 'inherit', transition: 'all 0.15s',
                  }}>
                    {sp}
                  </button>
                ))}
              </div>

              {/* Results count */}
              <p style={{ fontSize: 13, color: 'var(--text-subtle)', marginBottom: 24 }}>
                {filtered.length} {lang === 'de' ? 'Trainer gefunden' : 'trainers found'}
              </p>

              {/* Cards */}
              {filtered.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
                  {filtered.map(pt => (
                    <div key={pt.slug} className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 18 }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${pt.color}20`, border: `2px solid ${pt.color}50`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: pt.color, flexShrink: 0 }}>
                          {pt.initials}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-primary)', marginBottom: 3 }}>{pt.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            {pt.location ?? '—'}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 2 }}>
                            {pt.yearsExp != null ? `${pt.yearsExp} ${lang === 'de' ? 'Jahre Erfahrung' : 'years exp.'}` : ''}
                            {pt.yearsExp != null && pt.priceFrom ? ' · ' : ''}
                            {pt.priceFrom ?? ''}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {pt.languages.map(l => (
                            <span key={l} style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'var(--accent-muted)', color: 'var(--accent-text)' }}>{l}</span>
                          ))}
                        </div>
                      </div>

                      <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: 16 }}>{pt.shortBio ?? ''}</p>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                        {pt.specializations.map(sp => (
                          <span key={sp} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{sp}</span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
                        <a href={`/pt/${pt.slug}`} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: 14 }}>
                          {lang === 'de' ? 'Profil ansehen' : 'View profile'}
                        </a>
                        <a href={`/pt/${pt.slug}#request`} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 14 }}>
                          {lang === 'de' ? 'Anfrage senden' : 'Send request'}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                  <div style={{ fontWeight: 600, fontSize: 18, color: 'var(--text-primary)', marginBottom: 8 }}>
                    {lang === 'de' ? 'Keine Trainer gefunden' : 'No trainers found'}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                    {lang === 'de' ? 'Versuche einen anderen Suchbegriff.' : 'Try a different search term.'}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
