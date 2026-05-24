'use client';

import { useState } from 'react';
import { useTranslation } from '@/locales';
import { home } from '@/locales/home.strings';

export function ContactSection() {
  const { t } = useTranslation();
  const s = t(home);

  const [form, setForm]     = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      // Edge Function: /api/contact → Supabase contact_submissions + Email via Graph API
      const res = await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      if (!res.ok) throw new Error('failed');
      setStatus('success');
      setForm({ name: '', email: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  const fieldStyle: React.CSSProperties = {
    display:       'flex',
    flexDirection: 'column',
    gap:           6,
  };

  const labelStyle: React.CSSProperties = {
    fontSize:   13,
    fontWeight: 500,
    color:      'var(--text-muted)',
  };

  return (
    <section id="contact" className="section" style={{ background: 'var(--bg-surface)', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'var(--border)' }} />

      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>

          {/* Left: Info */}
          <div>
            <div className="section-eyebrow">Kontakt</div>
            <h2 className="section-title">{s.contactTitle}</h2>
            <p className="section-sub" style={{ marginBottom: 36 }}>{s.contactSub}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { icon: '📧', label: 'Email', value: 'info@yannicksalm.ch' },
                { icon: '📍', label: 'Standort', value: 'Zürich, Schweiz' },
                { icon: '⏱', label: 'Antwortzeit', value: '< 24 Stunden' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{item.label}</div>
                    <div style={{ fontSize: 15, color: 'var(--text-primary)' }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Form */}
          <div className="card" style={{ padding: 32 }}>
            {status === 'success' ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <div style={{ fontWeight: 600, fontSize: 18, color: 'var(--text-primary)', marginBottom: 8 }}>{s.contactSuccess}</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>{s.contactName}</label>
                  <input
                    className="input"
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Max Mustermann"
                  />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>{s.contactEmail}</label>
                  <input
                    className="input"
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="max@example.com"
                  />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>{s.contactMessage}</label>
                  <textarea
                    className="input"
                    required
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Deine Nachricht…"
                    rows={5}
                  />
                </div>

                {status === 'error' && (
                  <div style={{ padding: '10px 14px', background: 'rgba(240,68,68,0.1)', border: '1px solid rgba(240,68,68,0.2)', borderRadius: 8, fontSize: 13, color: 'var(--danger)' }}>
                    {s.contactError}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={status === 'loading'}
                  style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15 }}
                >
                  {status === 'loading' ? (
                    <span>Senden…</span>
                  ) : (
                    <>
                      {s.contactSend}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
