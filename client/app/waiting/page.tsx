'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

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

export default function WaitingPage() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    document.cookie = 'ptone_session=; path=/; max-age=0';
    router.replace('/login');
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-page)', padding: '24px',
      backgroundImage: 'radial-gradient(ellipse at 50% 30%, rgba(124,106,255,0.1) 0%, transparent 60%)',
    }}>
      <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
          <PTOneLogo />
        </div>

        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 20, padding: '40px 32px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(124,106,255,0.15)', border: '1px solid rgba(124,106,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
            Konto erstellt!
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 8 }}>
            Dein Account ist bereit. Nun musst du auf deinen Personal Trainer warten.
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-subtle)', lineHeight: 1.6, marginBottom: 28 }}>
            Sobald dein PT dich in der App hinzufügt, erhältst du Zugang zum vollen Dashboard.
          </p>

          <div style={{
            background: 'rgba(124,106,255,0.08)', border: '1px solid rgba(124,106,255,0.2)',
            borderRadius: 12, padding: '14px 16px', marginBottom: 28,
            fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Teile deine E-Mail-Adresse mit deinem PT, damit er dich verbinden kann.
          </div>

          <button
            onClick={handleSignOut}
            style={{
              width: '100%', padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 500,
              background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
              color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Abmelden
          </button>
        </div>
      </div>
    </div>
  );
}
