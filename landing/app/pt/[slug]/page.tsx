'use client';

import { use, useState, useEffect } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { fetchPTBySlug, type PT } from '@/lib/pt-data';
import { useTranslation } from '@/locales';
import { createClient } from '@/lib/supabase/client';

export default function PTDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug }  = use(params);
  const { lang }  = useTranslation();

  const [pt,         setPt]         = useState<PT | null | 'loading'>('loading');
  const [reqName,    setReqName]    = useState('');
  const [reqEmail,   setReqEmail]   = useState('');
  const [reqMsg,     setReqMsg]     = useState('');
  const [reqSent,    setReqSent]    = useState(false);
  const [reqError,   setReqError]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPTBySlug(slug).then(data => setPt(data));
  }, [slug]);

  if (pt === 'loading') {
    return (
      <>
        <Navbar />
        <main style={{ paddingTop: 64, minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
        </main>
        <Footer />
      </>
    );
  }

  if (!pt) {
    return (
      <>
        <Navbar />
        <main style={{ paddingTop: 64, minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>👤</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              {lang === 'de' ? 'Trainer nicht gefunden' : 'Trainer not found'}
            </h1>
            <a href="/pt" style={{ color: 'var(--accent)', fontSize: 15 }}>← {lang === 'de' ? 'Alle Trainer' : 'All trainers'}</a>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 64, minHeight: '100vh', background: 'var(--bg-page)' }}>

        {/* Hero banner */}
        <div style={{
          background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)',
          padding: '64px 24px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '0%', left: '30%', width: 600, height: 400, background: `radial-gradient(ellipse, ${pt.color}18 0%, transparent 70%)`, pointerEvents: 'none' }} />
          <div className="container" style={{ position: 'relative' }}>
            <a href="/pt" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 32 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              {lang === 'de' ? 'Alle Trainer' : 'All trainers'}
            </a>

            <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* Avatar */}
              <div style={{ width: 100, height: 100, borderRadius: '50%', background: `${pt.color}20`, border: `3px solid ${pt.color}50`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, color: pt.color, flexShrink: 0 }}>
                {pt.initials}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{pt.name}</h1>
                  <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: 'rgba(62,207,142,0.15)', color: '#3ecf8e', border: '1px solid rgba(62,207,142,0.3)' }}>
                    {lang === 'de' ? 'Verifiziert' : 'Verified'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 16 }}>
                  {pt.location && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, color: 'var(--text-muted)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {pt.location}
                    </span>
                  )}
                  {pt.yearsExp != null && (
                    <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                      {pt.yearsExp} {lang === 'de' ? 'Jahre Erfahrung' : 'years experience'}
                    </span>
                  )}
                  {pt.priceFrom && (
                    <span style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 600 }}>{pt.priceFrom}</span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {pt.languages.map(l => (
                    <span key={l} style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 5, background: 'var(--accent-muted)', color: 'var(--accent-text)' }}>{l}</span>
                  ))}
                  {pt.specializations.map(sp => (
                    <span key={sp} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, background: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{sp}</span>
                  ))}
                </div>
              </div>

              <a href="#request" className="btn btn-primary" style={{ fontSize: 15, padding: '13px 28px', flexShrink: 0 }}>
                {lang === 'de' ? 'Anfrage senden' : 'Send request'}
              </a>
            </div>
          </div>
        </div>

        <div className="container" style={{ padding: '64px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 56, alignItems: 'start' }}>

            {/* Left column */}
            <div>
              {/* About */}
              {pt.longBio && (
                <section style={{ marginBottom: 48 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
                    {lang === 'de' ? 'Über mich' : 'About me'}
                  </h2>
                  <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.8 }}>{pt.longBio}</p>
                </section>
              )}

              {/* Focus areas */}
              {pt.focusAreas.length > 0 && (
                <section style={{ marginBottom: 48 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
                    {lang === 'de' ? 'Schwerpunkte' : 'Focus areas'}
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {pt.focusAreas.map((fa, i) => (
                      <div key={i} className="card" style={{ padding: '20px 24px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: `${pt.color}20`, border: `1px solid ${pt.color}40`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: pt.color, fontWeight: 700, fontSize: 14 }}>
                          {i + 1}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>{fa.title}</div>
                          <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>{fa.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Certifications */}
              {pt.certifications.length > 0 && (
                <section>
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
                    {lang === 'de' ? 'Zertifikate & Ausbildung' : 'Certifications'}
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {pt.certifications.map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3ecf8e" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        <span style={{ fontSize: 15, color: 'var(--text-muted)' }}>{c}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right sidebar */}
            <div style={{ position: 'sticky', top: 88 }}>
              {/* Info card */}
              <div className="card" style={{ padding: 24, marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
                  {lang === 'de' ? 'Details' : 'Details'}
                </div>
                {[
                  { label: lang === 'de' ? 'Verfügbarkeit' : 'Availability', value: pt.availability },
                  { label: lang === 'de' ? 'Preis'         : 'Pricing',      value: pt.priceFrom },
                  { label: lang === 'de' ? 'Standort'      : 'Location',     value: pt.location },
                  { label: lang === 'de' ? 'Sprachen'      : 'Languages',    value: pt.languages.join(', ') || null },
                ].filter(r => r.value).map((row, i, arr) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-subtle)' }}>{row.label}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Request form */}
              <div id="request" className="card" style={{ padding: 24, border: `1px solid ${pt.color}30` }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {lang === 'de' ? 'Anfrage senden' : 'Send a request'}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                  {lang === 'de' ? `Direkte Anfrage an ${pt.name}` : `Direct request to ${pt.name}`}
                </p>

                {reqSent ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {lang === 'de' ? 'Anfrage gesendet!' : 'Request sent!'}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
                      {lang === 'de' ? `${pt.name} meldet sich bald.` : `${pt.name} will get back to you soon.`}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={async e => {
                    e.preventDefault();
                    setSubmitting(true);
                    setReqError('');
                    try {
                      const supabase = createClient();
                      const { error: insErr } = await supabase
                        .from('contact_requests')
                        .insert({ pt_id: pt.id, name: reqName, email: reqEmail, message: reqMsg });
                      if (insErr) throw insErr;
                      setReqSent(true);
                    } catch {
                      setReqError(lang === 'de' ? 'Fehler beim Senden. Bitte versuche es erneut.' : 'Error sending request. Please try again.');
                    } finally {
                      setSubmitting(false);
                    }
                  }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { label: lang === 'de' ? 'Name' : 'Name', val: reqName, set: setReqName, type: 'text',  ph: 'Max Mustermann' },
                      { label: 'Email',                          val: reqEmail, set: setReqEmail, type: 'email', ph: 'max@example.com' },
                    ].map(f => (
                      <div key={f.label}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 5 }}>{f.label}</label>
                        <input className="input" type={f.type} required placeholder={f.ph} value={f.val} onChange={e => f.set(e.target.value)} style={{ fontSize: 14, padding: '10px 14px' }} />
                      </div>
                    ))}
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 5 }}>
                        {lang === 'de' ? 'Nachricht' : 'Message'}
                      </label>
                      <textarea className="input" required rows={3} placeholder={lang === 'de' ? 'Kurze Beschreibung deiner Ziele…' : 'Brief description of your goals…'}
                        value={reqMsg} onChange={e => setReqMsg(e.target.value)} style={{ fontSize: 14, padding: '10px 14px' }} />
                    </div>
                    {reqError && (
                      <div style={{ fontSize: 13, color: 'var(--danger)', padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        {reqError}
                      </div>
                    )}
                    <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 14, padding: '11px', opacity: submitting ? 0.6 : 1 }}>
                      {submitting
                        ? (lang === 'de' ? 'Senden…' : 'Sending…')
                        : (lang === 'de' ? 'Anfrage senden' : 'Send request')}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
