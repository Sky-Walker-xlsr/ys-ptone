import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createEvent, deleteEvent } from '@/lib/google/calendar';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function getUser(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user } } = await admin.auth.getUser(token);
  return user ?? null;
}

export async function POST(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as {
    summary: string; description?: string; start: string; end: string; timeZone?: string;
  };
  if (!body.summary || !body.start || !body.end) {
    return NextResponse.json({ error: 'summary, start and end are required' }, { status: 400 });
  }

  const event = await createEvent(user.id, body);
  if (!event) return NextResponse.json({ error: 'Google API error' }, { status: 502 });
  return NextResponse.json({ event });
}

export async function DELETE(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const eventId = request.nextUrl.searchParams.get('eventId');
  if (!eventId) return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });

  const ok = await deleteEvent(user.id, eventId);
  if (!ok) return NextResponse.json({ error: 'Google API error' }, { status: 502 });
  return NextResponse.json({ ok: true });
}
