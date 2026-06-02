'use client';

import { useState } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { useTranslation } from '@/locales';
import { home } from '@/locales/home.strings';

export default function ContactPage() {
  const { t } = useTranslation();
  const s = t(home);

  const [form, setForm]     = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    try {
      // Formspree — no backend needed, works on Cloudflare Workers too
      const res = await fetch('https://formspree.io/f/mreybznj', {
        method:  'POST',
        body:    new FormData(e.currentTarget),
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('failed');
      setStatus('success');
      setForm({ name: '', email: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 64, minHeight: '100vh', background: 'var(--bg-page)' }}>
        {/* Hero */}
        <div style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          padding: '72px 24px 64px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(124,106,255,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
            <div className="section-eyebrow" style={{ marginBottom: 16 }}>Kontakt</div>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16, letterSpacing: '-0.02em' }}>
              {s.contactTitle}
            </h1>
            <p style={{ fontSize: 18, color: 'var(--text-muted)', lineHeight: 1.7 }}>{s.contactSub}</p>
          </div>
        </div>

        {/* Content */}
        <div className="container" style={{ padding: '80px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 80, alignItems: 'start', maxWidth: 900, margin: '0 auto' }}>

            {/* Left: Info */}
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Wir freuen uns von dir zu hören</h2>
              <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 36 }}>
                Fragen zu PTOne, Feedback oder Kooperationsanfragen – meld dich einfach.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {[
                  { icon: '✉️', label: 'Email', value: 'yannicksalm07@gmail.com', href: 'mailto:yannicksalm07@gmail.com' },
                  { icon: '📍', label: 'Standort', value: 'Aarau, Schweiz' },
                  { icon: '⏱',  label: 'Antwortzeit', value: '< 24 Stunden' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 2 }}>{item.label}</div>
                      {item.href
                        ? <a href={item.href} style={{ fontSize: 15, color: 'var(--accent)', textDecoration: 'none' }}>{item.value}</a>
                        : <div style={{ fontSize: 15, color: 'var(--text-primary)' }}>{item.value}</div>
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Form */}
            <div className="card" style={{ padding: 36 }}>
              {status === 'success' ? (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                  <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
                  <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--text-primary)', marginBottom: 8 }}>{s.contactSuccess}</div>
                  <button onClick={() => setStatus('idle')} style={{ marginTop: 20, fontSize: 14, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Weitere Nachricht senden
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Hidden source field so Formspree emails know this is from PTOne */}
                  <input type="hidden" name="_subject" value="PTOne Kontaktformular" />
                  {[
                    { label: s.contactName,    key: 'name',  type: 'text',  ph: 'Max Mustermann' },
                    { label: s.contactEmail,   key: 'email', type: 'email', ph: 'max@example.com' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>{f.label}</label>
                      <input
                        className="input" type={f.type} name={f.key} required placeholder={f.ph}
                        value={(form as Record<string,string>)[f.key]}
                        onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      />
                    </div>
                  ))}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>{s.contactMessage}</label>
                    <textarea className="input" name="message" required rows={5} placeholder="Deine Nachricht…"
                      value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
                  </div>

                  {status === 'error' && (
                    <div style={{ padding: '10px 14px', background: 'rgba(240,68,68,0.1)', border: '1px solid rgba(240,68,68,0.2)', borderRadius: 8, fontSize: 13, color: 'var(--danger)' }}>
                      {s.contactError}
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary" disabled={status === 'loading'}
                    style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15 }}>
                    {status === 'loading' ? 'Senden…' : s.contactSend}
                    {status !== 'loading' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
