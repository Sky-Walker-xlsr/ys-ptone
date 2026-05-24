'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // Supabase auto-detects ?code= in the URL and completes the PKCE exchange.
    // INITIAL_SESSION fires first (null), then SIGNED_IN fires after the exchange.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        document.cookie = 'ptone_session=1; path=/; max-age=604800; SameSite=Lax';
        router.replace('/dashboard');
      } else if (event === 'SIGNED_OUT') {
        router.replace('/login?error=auth_failed');
      }
    });

    // Fallback: if the exchange never resolves, give up after 10s
    const timeout = setTimeout(() => router.replace('/login?error=auth_failed'), 10_000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border-strong)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
