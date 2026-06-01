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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { data, error } = await getAdmin()
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('id', id)
    .eq('pt_id', user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ invoice: data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json() as Record<string, unknown>;
  const admin = getAdmin();

  // Verify ownership
  const { data: existing } = await admin
    .from('invoices')
    .select('id, status')
    .eq('id', id)
    .eq('pt_id', user.id)
    .single();
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Set timestamps for status transitions
  const updates: Record<string, unknown> = { ...body, updated_at: new Date().toISOString() };
  if (body.status === 'sent'      && !body.sent_at)           updates.sent_at = new Date().toISOString();
  if (body.status === 'paid'      && !body.paid_at)           { updates.paid_at = new Date().toISOString(); updates.payment_status = 'bezahlt'; }
  if (body.status === 'reminder1' && !body.reminder1_sent_at) updates.reminder1_sent_at = new Date().toISOString();
  if (body.status === 'reminder2' && !body.reminder2_sent_at) updates.reminder2_sent_at = new Date().toISOString();
  // Keep original amount column in sync with subtotal
  if (body.subtotal !== undefined) updates.amount = body.subtotal;

  // Handle items update if provided
  if (Array.isArray(body.items)) {
    await admin.from('invoice_items').delete().eq('invoice_id', id);
    if ((body.items as unknown[]).length > 0) {
      await admin.from('invoice_items').insert(
        (body.items as { description: string; quantity: number; unit_price: number; total: number; position: number }[])
          .map(item => ({ ...item, invoice_id: id }))
      );
    }
    delete updates.items;
  }

  const { data, error } = await admin
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .select('*, invoice_items(*)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ invoice: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const admin = getAdmin();

  const { error } = await admin
    .from('invoices')
    .delete()
    .eq('id', id)
    .eq('pt_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
