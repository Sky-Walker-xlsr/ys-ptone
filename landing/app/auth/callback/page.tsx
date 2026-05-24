'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { markAsLoggedIn } from '@/lib/auth-cache';

const PT_URL     = 'https://pt.yannicksalm.ch';
const CLIENT_URL = 'https://ptclient.yannicksalm.ch/waiting';

export default function AuthCallbackPage() {
  useEffect(() => {
    const supabase = createClient();

    // Supabase auto-exchanges the PKCE code on init (detectSessionInUrl: true).
    // We just listen for the resulting SIGNED_IN event — no manual exchange needed.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        markAsLoggedIn();
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        window.location.href = profile?.role === 'pt' ? PT_URL : CLIENT_URL;
      } else if (event === 'SIGNED_OUT') {
        window.location.href = '/login?error=auth_failed';
      }
    });

    // Fallback: if nothing resolves in 10s, something went wrong
    const timeout = setTimeout(() => {
      window.location.href = '/login?error=auth_failed';
    }, 10_000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-page)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid var(--accent)', borderTopColor: 'transparent',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
        }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Wird angemeldet…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
