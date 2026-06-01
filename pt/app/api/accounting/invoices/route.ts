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

  const admin = getAdmin();
  const { data: invoices, error } = await admin
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('pt_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ invoices });
}

export async function POST(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as {
    title: string;
    client_id?: string;
    issue_date: string;
    due_date: string;
    subtotal: number;
    tax_rate: number;
    tax_amount: number;
    total: number;
    notes?: string;
    items: { description: string; quantity: number; unit_price: number; total: number; position: number }[];
  };

  if (!body.title || !body.due_date) {
    return NextResponse.json({ error: 'title and due_date required' }, { status: 400 });
  }

  const admin = getAdmin();

  // Generate invoice number: PREFIX-YEAR-SEQ
  const { data: settings } = await admin
    .from('accounting_settings')
    .select('invoice_prefix')
    .eq('pt_id', user.id)
    .maybeSingle();
  const prefix = settings?.invoice_prefix ?? 'RE';
  const year   = new Date().getFullYear();

  // Count only invoices from the current year so the sequence resets each January
  const yearStart = `${year}-01-01`;
  const yearEnd   = `${year + 1}-01-01`;
  const { count, error: countError } = await admin
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('pt_id', user.id)
    .gte('created_at', yearStart)
    .lt('created_at',  yearEnd);
  if (countError) console.error('[invoices POST] count error:', countError);
  const seq = String((count ?? 0) + 1).padStart(7, '0');
  const invoiceNumber = `${prefix}-${year}-${seq}`;

  const { data: invoice, error } = await admin
    .from('invoices')
    .insert({
      pt_id:          user.id,
      client_id:      body.client_id ?? null,
      invoice_number: invoiceNumber,
      title:          body.title,
      status:         'draft',
      issue_date:     body.issue_date,
      due_date:       body.due_date,
      // amount is NOT NULL in the original schema — keep it in sync with subtotal
      amount:         body.subtotal,
      tax_rate:       body.tax_rate,
      subtotal:       body.subtotal,
      tax_amount:     body.tax_amount,
      total:          body.total,
      notes:          body.notes ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('[invoices POST] insert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (body.items?.length) {
    const { error: itemsError } = await admin.from('invoice_items').insert(
      body.items.map(item => ({ ...item, invoice_id: invoice.id }))
    );
    if (itemsError) console.error('[invoices POST] items insert error:', itemsError);
  }

  const { data: full } = await admin
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('id', invoice.id)
    .single();

  return NextResponse.json({ invoice: full });
}
