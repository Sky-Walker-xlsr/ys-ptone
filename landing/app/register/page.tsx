'use client';

import { useState } from 'react';
import { useTranslation } from '@/locales';
import { auth } from '@/locales/auth.strings';
import { createClient } from '@/lib/supabase/client';

function PTOneLogo() {
  return (
    <svg width="110" height="32" viewBox="0 0 110 32" fill="none" aria-label="PTOne">
      <rect x="1" y="5" width="16" height="16" rx="3" fill="var(--accent)" opacity="0.9" />
      <rect x="7" y="11" width="16" height="16" rx="3" fill="var(--accent)" opacity="0.5" />
      <text x="30" y="22" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" fontSize="17" fontWeight="700" fill="var(--text-primary)">PT</text>
      <text x="53" y="22" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" fontSize="17" fontWeight="400" fill="var(--text-muted)">One</text>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

type Step = 'form' | 'success';

export default function RegisterPage() {
  const { t } = useTranslation();
  const s = t(auth);

  const [step, setStep]           = useState<Step>('form');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name:  lastName,
          full_name:  `${firstName} ${lastName}`.trim(),
          role:       'client',
        },
      },
    });

    if (signUpError) {
      console.error('Supabase signUp error:', signUpError);
      const msg = signUpError.message ?? '';
      setError(
        msg.toLowerCase().includes('already')
          ? s.emailExists
          : `${s.registerError} (${msg})`
      );
      setLoading(false);
      return;
    }

    // If email confirmation is required, show success screen
    if (!data.session) {
      setStep('success');
      setLoading(false);
      return;
    }

    // Auto-confirmed → go to waiting (new clients always need a coach)
    window.location.href = 'https://ptclient.yannicksalm.ch/waiting';
  }

  async function handleGoogleRegister() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px',
    background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
    borderRadius: 10, color: 'var(--text-primary)', fontSize: 15,
    fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  };

  if (step === 'success') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-page)', padding: '24px',
        backgroundImage: 'radial-gradient(ellipse at 30% 20%, rgba(124,106,255,0.08) 0%, transparent 60%)',
      }}>
        <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
            <a href="/"><PTOneLogo /></a>
          </div>
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 20, padding: '40px 32px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(62,207,142,0.15)', border: '1px solid rgba(62,207,142,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3ecf8e" strokeWidth="2.5" strokeLinecap="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>{s.successTitle}</h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>{s.successMsg}</p>
            <a
              href="/login"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginTop: 28, padding: '12px 28px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                background: 'var(--accent)', color: '#fff', textDecoration: 'none',
              }}
            >
              {s.signIn}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-page)', padding: '24px',
      backgroundImage: 'radial-gradient(ellipse at 30% 20%, rgba(124,106,255,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(62,207,142,0.05) 0%, transparent 60%)',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo + back */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center' }}><PTOneLogo /></a>
          <a href="/" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            {s.backToHome}
          </a>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 20, padding: '36px 32px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
        }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{s.registerTitle}</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>{s.registerSub}</p>

          {/* Google OAuth */}
          <button
            onClick={handleGoogleRegister}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '11px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500,
              background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
              color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'inherit',
              transition: 'background 0.15s', marginBottom: 20,
            }}
          >
            <GoogleIcon /> {s.googleBtn}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{s.orDivider}</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Name row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>{s.firstName}</label>
                <input
                  type="text" required value={firstName} onChange={e => setFirstName(e.target.value)}
                  style={inputStyle} placeholder="Max"
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>{s.lastName}</label>
                <input
                  type="text" required value={lastName} onChange={e => setLastName(e.target.value)}
                  style={inputStyle} placeholder="Mustermann"
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>{s.email}</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                style={inputStyle} placeholder="du@example.com"
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>
                {s.password}
                <span style={{ fontWeight: 400, color: 'var(--text-subtle)', marginLeft: 6 }}>({s.passwordHint})</span>
              </label>
              <input
                type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
                style={inputStyle} placeholder="••••••••"
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-strong)'}
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, fontSize: 13,
                background: 'rgba(240,68,68,0.1)', border: '1px solid rgba(240,68,68,0.25)',
                color: '#f04444',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '13px', borderRadius: 10, fontSize: 15, fontWeight: 600,
                background: loading ? 'rgba(124,106,255,0.5)' : 'var(--accent)',
                color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'background 0.15s', marginTop: 4,
              }}
            >
              {loading ? s.loading : s.registerBtn}
            </button>

            {/* Terms */}
            <p style={{ fontSize: 11, color: 'var(--text-subtle)', textAlign: 'center', lineHeight: 1.5 }}>
              {s.termsNote}{' '}
              <a href="/terms" style={{ color: 'var(--accent)', textDecoration: 'none' }}>{s.termsLink}</a>
              {' '}{s.termsAnd}{' '}
              <a href="/privacy" style={{ color: 'var(--accent)', textDecoration: 'none' }}>{s.privacyLink}</a>
              {s.termsEnd}
            </p>
          </form>

          {/* Switch to login */}
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 24 }}>
            {s.alreadyAccount}{' '}
            <a href="/login" style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>{s.signIn}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
