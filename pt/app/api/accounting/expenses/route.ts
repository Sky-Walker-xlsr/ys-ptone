import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

export async function GET(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await getAdmin()
    .from('expense_entries')
    .select('*')
    .eq('pt_id', user.id)
    .order('date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ expenses: data });
}

export async function POST(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as {
    title: string;
    amount: number;
    category: string;
    date: string;
    notes?: string;
    receipt_url?: string;
    is_recurring?: boolean;
    recurring_interval?: string;
    next_occurrence?: string;
  };

  if (!body.title || body.amount == null) {
    return NextResponse.json({ error: 'title and amount required' }, { status: 400 });
  }

  const { data, error } = await getAdmin()
    .from('expense_entries')
    .insert({
      pt_id:              user.id,
      title:              body.title,
      amount:             body.amount,
      category:           body.category ?? 'other',
      date:               body.date,
      notes:              body.notes ?? null,
      receipt_url:        body.receipt_url ?? null,
      is_recurring:       body.is_recurring ?? false,
      recurring_interval: body.recurring_interval ?? null,
      next_occurrence:    body.next_occurrence ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ expense: data });
}
