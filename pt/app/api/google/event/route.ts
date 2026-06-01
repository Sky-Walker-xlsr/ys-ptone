import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createEvent, deleteEvent } from '@/lib/google/calendar';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function getUser(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user } } = await getAdmin().auth.getUser(token);
  return user ?? null;
}

export async function POST(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as {
    summary: string; description?: string; start: string; end: string;
    timeZone?: string; calendarId?: string; clientId?: string;
  };
  if (!body.summary || !body.start || !body.end) {
    return NextResponse.json({ error: 'summary, start and end are required' }, { status: 400 });
  }

  const calendarId = body.calendarId ?? 'primary';
  const event = await createEvent(user.id, body, calendarId);
  if (!event) return NextResponse.json({ error: 'Google API error' }, { status: 502 });

  // Mirror to appointments table so clients can see the event
  await getAdmin().from('appointments').insert({
    pt_id:           user.id,
    client_id:       body.clientId ?? null,
    title:           body.summary,
    start_at:        body.start,
    end_at:          body.end,
    notes:           body.description ?? null,
    google_event_id: event.id,
  });

  return NextResponse.json({ event });
}

export async function DELETE(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const eventId    = searchParams.get('eventId');
  const calendarId = searchParams.get('calendarId') ?? 'primary';
  if (!eventId) return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });

  const ok = await deleteEvent(user.id, eventId, calendarId);
  if (!ok) return NextResponse.json({ error: 'Google API error' }, { status: 502 });

  // Remove mirrored appointment row
  await getAdmin()
    .from('appointments')
    .delete()
    .eq('google_event_id', eventId)
    .eq('pt_id', user.id);

  return NextResponse.json({ ok: true });
}
