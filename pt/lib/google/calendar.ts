// Server-only — never import this from a client component
import { createClient } from '@supabase/supabase-js';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const TOKEN_URL = 'https://oauth2.googleapis.com/token';

function calUrl(calendarId: string, path: string) {
  return `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}${path}`;
}

// ── Token management ──────────────────────────────────────────────────────────

async function refresh(trainerId: string, refreshToken: string): Promise<string | null> {
  const res = await fetch(TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: refreshToken,
      client_id:     process.env.GOOGLE_CALENDAR_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
    }),
  });
  if (!res.ok) return null;
  const { access_token, expires_in } = await res.json() as { access_token: string; expires_in: number };
  if (!access_token) return null;

  await getAdmin().from('google_calendar_connections').update({
    access_token,
    token_expiry: new Date(Date.now() + expires_in * 1000).toISOString(),
    updated_at:   new Date().toISOString(),
  }).eq('trainer_id', trainerId);

  return access_token;
}

export async function getValidToken(trainerId: string): Promise<string | null> {
  const { data } = await getAdmin()
    .from('google_calendar_connections')
    .select('access_token, refresh_token, token_expiry')
    .eq('trainer_id', trainerId)
    .single();
  if (!data) return null;

  const expiresSoon = data.token_expiry
    ? new Date(data.token_expiry).getTime() < Date.now() + 60_000
    : true;

  if (expiresSoon && data.refresh_token) {
    return refresh(trainerId, data.refresh_token);
  }
  return data.access_token as string;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GCalCalendar {
  id:              string;
  summary:         string;
  description:     string | undefined;
  primary:         boolean | undefined;
  backgroundColor: string | undefined;
  accessRole:      string;
}

export interface GCalEvent {
  id:          string;
  summary:     string;
  description: string | undefined;
  start:       { dateTime?: string; date?: string; timeZone?: string };
  end:         { dateTime?: string; date?: string; timeZone?: string };
  colorId:     string | undefined;
  htmlLink:    string | undefined;
}

// ── API helpers ───────────────────────────────────────────────────────────────

export async function listCalendars(trainerId: string): Promise<GCalCalendar[]> {
  const token = await getValidToken(trainerId);
  if (!token) return [];

  const res = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const json = await res.json() as { items?: GCalCalendar[] };
  return (json.items ?? []).filter(
    c => c.accessRole === 'owner' || c.accessRole === 'writer',
  );
}

export async function fetchEvents(
  trainerId:  string,
  timeMin:    string,
  timeMax:    string,
  calendarId = 'primary',
): Promise<GCalEvent[]> {
  const token = await getValidToken(trainerId);
  if (!token) return [];

  const params = new URLSearchParams({
    timeMin, timeMax,
    singleEvents: 'true',
    orderBy:      'startTime',
    maxResults:   '500',
  });
  const res = await fetch(calUrl(calendarId, `/events?${params}`), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const json = await res.json() as { items?: GCalEvent[] };
  return json.items ?? [];
}

export async function createEvent(
  trainerId:  string,
  ev: { summary: string; description?: string; start: string; end: string; timeZone?: string },
  calendarId = 'primary',
): Promise<GCalEvent | null> {
  const token = await getValidToken(trainerId);
  if (!token) return null;

  const tz = ev.timeZone ?? 'Europe/Zurich';
  const res = await fetch(calUrl(calendarId, '/events'), {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      summary:     ev.summary,
      description: ev.description,
      start: { dateTime: ev.start, timeZone: tz },
      end:   { dateTime: ev.end,   timeZone: tz },
    }),
  });
  if (!res.ok) return null;
  return res.json() as Promise<GCalEvent>;
}

export async function deleteEvent(
  trainerId:  string,
  eventId:    string,
  calendarId = 'primary',
): Promise<boolean> {
  const token = await getValidToken(trainerId);
  if (!token) return false;
  const res = await fetch(calUrl(calendarId, `/events/${encodeURIComponent(eventId)}`), {
    method:  'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok || res.status === 204;
}
