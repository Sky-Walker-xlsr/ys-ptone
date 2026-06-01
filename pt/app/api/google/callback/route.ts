import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { searchParams } = request.nextUrl;
  const code  = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Derive all URLs from the incoming request — works in dev AND production
  const origin      = request.nextUrl.origin;
  const redirectUri = new URL('/api/google/callback', origin).href;
  const settingsUrl = new URL('/settings', origin).href;

  if (error || !code || !state) {
    return NextResponse.redirect(`${settingsUrl}?google_error=${error ?? 'no_code'}`);
  }

  const cookieRaw = request.cookies.get('google_oauth')?.value;
  if (!cookieRaw) {
    return NextResponse.redirect(`${settingsUrl}?google_error=invalid_state`);
  }

  let oauthCookie: { state: string; trainer_id: string };
  try {
    oauthCookie = JSON.parse(cookieRaw);
  } catch {
    return NextResponse.redirect(`${settingsUrl}?google_error=invalid_state`);
  }

  if (oauthCookie.state !== state) {
    return NextResponse.redirect(`${settingsUrl}?google_error=invalid_state`);
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CALENDAR_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
      redirect_uri:  redirectUri,
      grant_type:    'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${settingsUrl}?google_error=token_failed`);
  }

  const tokens = await tokenRes.json() as {
    access_token: string; refresh_token?: string; expires_in?: number; scope?: string;
  };

  let googleEmail: string | null = null;
  try {
    const infoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (infoRes.ok) {
      const info = await infoRes.json() as { email?: string };
      googleEmail = info.email ?? null;
    }
  } catch { /* non-fatal */ }

  const { error: dbErr } = await admin
    .from('google_calendar_connections')
    .upsert({
      trainer_id:    oauthCookie.trainer_id,
      access_token:  tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      token_expiry:  tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
      scope:        tokens.scope ?? null,
      google_email: googleEmail,
      updated_at:   new Date().toISOString(),
    }, { onConflict: 'trainer_id' });

  if (dbErr) {
    return NextResponse.redirect(`${settingsUrl}?google_error=db_error`);
  }

  const response = NextResponse.redirect(`${settingsUrl}?google_connected=1`);
  response.cookies.delete('google_oauth');
  return response;
}
