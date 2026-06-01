/**
 * Called on accounting page load to:
 * 1. Update invoice statuses (sent → overdue, overdue → reminder1/2)
 * 2. Send auto-reminder emails if enabled
 * 3. Generate new recurring expense entries
 */
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

async function sendReminderEmail(opts: {
  to: string; subject: string; html: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? 'invoices@ptone.app',
      to:   [opts.to],
      subject: opts.subject,
      html:    opts.html,
    }),
  });
  return res.ok;
}

function addDays(dateStr: string, days: number): Date {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d;
}

function nextOccurrence(current: string, interval: string): string {
  const d = new Date(current);
  switch (interval) {
    case 'weekly':    d.setDate(d.getDate() + 7); break;
    case 'monthly':   d.setMonth(d.getMonth() + 1); break;
    case 'quarterly': d.setMonth(d.getMonth() + 3); break;
    case 'yearly':    d.setFullYear(d.getFullYear() + 1); break;
  }
  return d.toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = getAdmin();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: settings }, { data: invoices }, { data: recurringExpenses }] = await Promise.all([
    admin.from('accounting_settings').select('*').eq('pt_id', user.id).maybeSingle(),
    admin.from('invoices').select('*, invoice_items(*)').eq('pt_id', user.id)
      .in('status', ['sent', 'overdue', 'reminder1']),
    admin.from('expense_entries').select('*').eq('pt_id', user.id)
      .eq('is_recurring', true).not('next_occurrence', 'is', null)
      .lte('next_occurrence', today),
  ]);

  const r1Days  = settings?.reminder1_days_after_due ?? 7;
  const r2Days  = settings?.reminder2_days_after_r1  ?? 14;
  const autoSend = settings?.email_auto_send ?? false;
  const currency = settings?.currency ?? 'CHF';
  const fmt = (n: number) => `${currency} ${n.toFixed(2)}`;

  // ── Status updates & auto-reminders ──────────────────────────────────────────
  for (const inv of invoices ?? []) {
    const dueDate = new Date(inv.due_date);
    const now = new Date();

    if (inv.status === 'sent' && now > dueDate) {
      await admin.from('invoices').update({ status: 'overdue', updated_at: now.toISOString() }).eq('id', inv.id);
    }

    if (inv.status === 'overdue' && settings?.reminder1_enabled !== false) {
      const r1Threshold = addDays(inv.due_date, r1Days);
      if (now >= r1Threshold && !inv.reminder1_sent_at) {
        const updates: Record<string, string> = {
          status: 'reminder1', reminder1_sent_at: now.toISOString(), updated_at: now.toISOString(),
        };
        await admin.from('invoices').update(updates).eq('id', inv.id);

        if (autoSend && inv.client_id) {
          const { data: profile1 } = await admin.from('profiles').select('email').eq('id', inv.client_id).single();
          const r1Email = profile1?.email ?? null;
          if (r1Email) {
            const profile = { email: r1Email };
            const template = settings?.reminder1_email_text ?? null;
            const dueStr = dueDate.toLocaleDateString('de-CH');
            const body = template
              ? template
                  .replace(/\{\{betrag\}\}/g, fmt(inv.total))
                  .replace(/\{\{faelligkeitsdatum\}\}/g, dueStr)
                  .replace(/\{\{rechnungsnummer\}\}/g, inv.invoice_number)
                  .replace(/\{\{client_name\}\}/g, '')
              : `Dies ist unsere 1. Zahlungserinnerung für Rechnung <strong>${inv.invoice_number}</strong> über <strong>${fmt(inv.total)}</strong>, fällig am ${dueStr}.`;
            await sendReminderEmail({
              to:      profile.email,
              subject: `1. Zahlungserinnerung – Rechnung ${inv.invoice_number}`,
              html:    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><h2>1. Zahlungserinnerung</h2><p>${body}</p></div>`,
            });
          }
        }
      }
    }

    if (inv.status === 'reminder1' && settings?.reminder2_enabled) {
      const r2Threshold = addDays(inv.reminder1_sent_at ?? inv.due_date, r2Days);
      if (now >= r2Threshold && !inv.reminder2_sent_at) {
        const updates: Record<string, string> = {
          status: 'reminder2', reminder2_sent_at: now.toISOString(), updated_at: now.toISOString(),
        };
        await admin.from('invoices').update(updates).eq('id', inv.id);

        if (autoSend && inv.client_id) {
          const { data: profile2 } = await admin.from('profiles').select('email').eq('id', inv.client_id).single();
          const r2Email = profile2?.email ?? null;
          if (r2Email) {
            const profile = { email: r2Email };
            const template = settings?.reminder2_email_text ?? null;
            const dueStr = dueDate.toLocaleDateString('de-CH');
            const body = template
              ? template
                  .replace(/\{\{betrag\}\}/g, fmt(inv.total))
                  .replace(/\{\{faelligkeitsdatum\}\}/g, dueStr)
                  .replace(/\{\{rechnungsnummer\}\}/g, inv.invoice_number)
                  .replace(/\{\{client_name\}\}/g, '')
              : `Dies ist unsere 2. und letzte Zahlungserinnerung für Rechnung <strong>${inv.invoice_number}</strong> über <strong>${fmt(inv.total)}</strong>.`;
            await sendReminderEmail({
              to:      profile.email,
              subject: `2. Zahlungserinnerung – Rechnung ${inv.invoice_number}`,
              html:    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><h2>2. Zahlungserinnerung</h2><p>${body}</p></div>`,
            });
          }
        }
      }
    }
  }

  // ── Auto-generate recurring expenses ─────────────────────────────────────────
  for (const exp of recurringExpenses ?? []) {
    if (!exp.next_occurrence || !exp.recurring_interval) continue;

    // Generate all missed occurrences
    let occurrence = exp.next_occurrence;
    const inserts: Record<string, unknown>[] = [];

    while (occurrence <= today) {
      inserts.push({
        pt_id:              user.id,
        title:              exp.title,
        amount:             exp.amount,
        category:           exp.category,
        date:               occurrence,
        notes:              exp.notes,
        is_recurring:       false, // generated copies are not themselves recurring
        receipt_url:        null,
      });
      occurrence = nextOccurrence(occurrence, exp.recurring_interval);
    }

    if (inserts.length > 0) {
      await admin.from('expense_entries').insert(inserts);
    }

    // Update next_occurrence on the template entry
    await admin.from('expense_entries').update({ next_occurrence: occurrence }).eq('id', exp.id);
  }

  return NextResponse.json({ ok: true });
}
