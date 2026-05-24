import { NextRequest, NextResponse } from 'next/server';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

export async function GET(request: NextRequest) {
  const trainerId = request.nextUrl.searchParams.get('trainer_id');
  if (!trainerId) {
    return NextResponse.json({ error: 'Missing trainer_id' }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 500 });
  }

  // Derive redirect URI from the incoming request — works in dev AND production
  const redirectUri = new URL('/api/google/callback', request.nextUrl.origin).href;
  const state       = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: 'code',
    scope:         SCOPES,
    access_type:   'offline',
    prompt:        'consent',
    state,
  });

  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
  );
  response.cookies.set(
    'google_oauth',
    JSON.stringify({ state, trainer_id: trainerId }),
    { httpOnly: true, secure: true, maxAge: 600, sameSite: 'lax', path: '/' },
  );
  return response;
}
