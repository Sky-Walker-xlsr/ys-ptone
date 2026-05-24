'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/locales/index';
import { auth } from '@/locales/auth.strings';

const LANDING_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:3002'
  : 'https://ptone.yannicksalm.ch';

function PTOneLogo() {
  return (
    <svg width="110" height="32" viewBox="0 0 110 32" fill="none" aria-label="PTOne">
      <rect x="1" y="5" width="16" height="16" rx="3" fill="var(--accent)" opacity="0.9"/>
      <rect x="7" y="11" width="16" height="16" rx="3" fill="var(--accent)" opacity="0.5"/>
      <text x="30" y="22" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" fontSize="17" fontWeight="700" fill="var(--text-primary)">PT</text>
      <text x="53" y="22" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" fontSize="17" fontWeight="400" fill="var(--text-muted)">One</text>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function setSessionCookie() {
  document.cookie = 'ptone_session=1; path=/; max-age=604800; SameSite=Lax';
}

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const s = t(auth);

  const [checking, setChecking] = useState(true);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    let done = false;
    const timeout = setTimeout(() => {
      if (!done) { done = true; setChecking(false); }
    }, 4000);

    async function check() {
      try {
        const supabase = createClient();
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) console.error('getSession error:', error);
        if (done) return;
        done = true;
        clearTimeout(timeout);
        if (session) { setSessionCookie(); router.replace('/dashboard'); }
        else { setChecking(false); }
      } catch (err) {
        console.error('Session check threw:', err);
        if (!done) { done = true; clearTimeout(timeout); setChecking(false); }
      }
    }

    check();
    return () => { done = true; clearTimeout(timeout); };
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError || !data.session) {
        setError(authError?.message ?? s.loginError);
        setLoading(false);
        return;
      }
      setSessionCookie();
      router.replace('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(s.loginError);
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
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

  if (checking) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border-strong)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <PTOneLogo />
          <a href={LANDING_URL} style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            {s.backToHome}
          </a>
        </div>

        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 20, padding: '36px 32px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
        }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{s.loginTitle}</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>{s.loginSubClient}</p>

          <button onClick={handleGoogleLogin} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '11px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500,
            background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
            color: 'var(--text-primary)', transition: 'background 0.15s', marginBottom: 20,
          }}>
            <GoogleIcon /> {s.googleBtn}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{s.orDivider}</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>{s.email}</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                style={inputStyle} placeholder="du@example.com"
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border-strong)')}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>{s.password}</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                style={inputStyle} placeholder="••••••••"
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border-strong)')}
              />
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13, background: 'rgba(240,68,68,0.1)', border: '1px solid rgba(240,68,68,0.25)', color: '#f04444' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '13px', borderRadius: 10, fontSize: 15, fontWeight: 600,
              background: loading ? 'rgba(124,106,255,0.5)' : 'var(--accent)',
              color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'background 0.15s', marginTop: 4,
            }}>
              {loading ? s.loading : s.loginBtn}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 24 }}>
            {s.noAccount}{' '}
            <a href={`${LANDING_URL}/register`} style={{ color: 'var(--accent)', fontWeight: 500 }}>{s.signUp}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
