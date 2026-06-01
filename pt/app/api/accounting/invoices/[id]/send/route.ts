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

async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  pdfBase64?: string;
  pdfFilename?: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const from = process.env.RESEND_FROM_EMAIL ?? 'invoices@ptone.app';
  const payload: Record<string, unknown> = {
    from,
    to:      [opts.to],
    subject: opts.subject,
    html:    opts.html,
  };

  if (opts.pdfBase64 && opts.pdfFilename) {
    payload.attachments = [{
      filename: opts.pdfFilename,
      content:  opts.pdfBase64,
    }];
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.ok;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json() as {
    type: 'invoice' | 'reminder1' | 'reminder2';
    pdfBase64?: string;
    recipientEmail?: string;
  };

  const admin = getAdmin();

  // Load invoice + client email + settings
  const [{ data: invoice }, { data: settings }] = await Promise.all([
    admin.from('invoices').select('*, invoice_items(*)').eq('id', id).eq('pt_id', user.id).single(),
    admin.from('accounting_settings').select('*').eq('pt_id', user.id).maybeSingle(),
  ]);

  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Resolve recipient email from profiles.email
  let toEmail = body.recipientEmail ?? null;
  if (!toEmail && invoice.client_id) {
    const { data: clientProfile } = await admin
      .from('profiles')
      .select('email')
      .eq('id', invoice.client_id)
      .single();
    toEmail = clientProfile?.email ?? null;
  }

  if (!toEmail) {
    // Mark sent without email (manual mode)
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.type === 'invoice')   { updates.status = 'sent';      updates.sent_at = new Date().toISOString(); }
    if (body.type === 'reminder1') { updates.status = 'reminder1'; updates.reminder1_sent_at = new Date().toISOString(); }
    if (body.type === 'reminder2') { updates.status = 'reminder2'; updates.reminder2_sent_at = new Date().toISOString(); }
    await admin.from('invoices').update(updates).eq('id', id);
    return NextResponse.json({ ok: true, emailed: false });
  }

  // Build email content
  const currency = settings?.currency ?? 'CHF';
  const fmt = (n: number) => `${currency} ${n.toFixed(2)}`;
  const dueDate = new Date(invoice.due_date).toLocaleDateString('de-CH');
  const issueDate = new Date(invoice.issue_date).toLocaleDateString('de-CH');

  let subject: string;
  let html: string;

  if (body.type === 'invoice') {
    subject = `Rechnung ${invoice.invoice_number} – ${fmt(invoice.total)}`;
    html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#333">Rechnung ${invoice.invoice_number}</h2>
        <p>Guten Tag,</p>
        <p>anbei erhalten Sie die Rechnung <strong>${invoice.invoice_number}</strong> vom ${issueDate}.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr style="border-bottom:1px solid #eee"><td style="padding:8px 0;color:#666">Betrag</td><td style="padding:8px 0;text-align:right"><strong>${fmt(invoice.total)}</strong></td></tr>
          <tr style="border-bottom:1px solid #eee"><td style="padding:8px 0;color:#666">Fällig am</td><td style="padding:8px 0;text-align:right">${dueDate}</td></tr>
          ${settings?.payment_due_days ? `<tr><td style="padding:8px 0;color:#666">Zahlungsziel</td><td style="padding:8px 0;text-align:right">${settings.payment_due_days} Tage</td></tr>` : ''}
        </table>
        ${settings?.invoice_footer_text ? `<p style="color:#888;font-size:13px">${settings.invoice_footer_text}</p>` : ''}
      </div>`;
  } else {
    const reminderNum = body.type === 'reminder1' ? 1 : 2;
    const template = body.type === 'reminder1'
      ? (settings?.reminder1_email_text ?? null)
      : (settings?.reminder2_email_text ?? null);

    const defaultText = `Dies ist unsere ${reminderNum}. Zahlungserinnerung für die Rechnung <strong>${invoice.invoice_number}</strong> über <strong>${fmt(invoice.total)}</strong>, fällig am ${dueDate}. Bitte begleichen Sie den offenen Betrag zeitnah.`;

    const rendered = template
      ? template
          .replace(/\{\{client_name\}\}/g, '')
          .replace(/\{\{betrag\}\}/g, fmt(invoice.total))
          .replace(/\{\{faelligkeitsdatum\}\}/g, dueDate)
          .replace(/\{\{rechnungsnummer\}\}/g, invoice.invoice_number)
      : defaultText;

    subject = `${reminderNum}. Zahlungserinnerung – Rechnung ${invoice.invoice_number}`;
    html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><h2 style="color:#333">${reminderNum}. Zahlungserinnerung</h2><p>${rendered}</p></div>`;
  }

  const emailed = await sendEmail({
    to:          toEmail,
    subject,
    html,
    pdfBase64:   body.pdfBase64,
    pdfFilename: body.pdfBase64 ? `${invoice.invoice_number}.pdf` : undefined,
  });

  // Update invoice status
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.type === 'invoice')   { updates.status = 'sent';      updates.sent_at = new Date().toISOString(); }
  if (body.type === 'reminder1') { updates.status = 'reminder1'; updates.reminder1_sent_at = new Date().toISOString(); }
  if (body.type === 'reminder2') { updates.status = 'reminder2'; updates.reminder2_sent_at = new Date().toISOString(); }

  // ── Auto-store PDF in Drive when sending an invoice for the first time ──────
  if (body.type === 'invoice' && body.pdfBase64 && !invoice.pdf_url) {
    try {
      const pdfBytes   = Buffer.from(body.pdfBase64, 'base64');
      const filename   = `${invoice.invoice_number}.pdf`;
      const ts         = Date.now();
      const safeClient = invoice.client_id ?? 'no-client';

      // Paths: [client-specific, pt-general]
      const paths: { storage: string; section: string }[] = [
        { storage: `${user.id}/invoices/${ts}_${filename}`,                          section: 'pt_invoices'     },
      ];
      if (invoice.client_id) {
        paths.unshift({ storage: `${user.id}/clients/${invoice.client_id}/invoices/${ts}_${filename}`, section: 'client_invoices' });
      }

      let pdfUrl: string | null = null;

      for (const { storage: path, section } of paths) {
        const { error: upErr } = await admin.storage.from('ptone_drive').upload(
          path, pdfBytes, { contentType: 'application/pdf', upsert: false }
        );
        if (!upErr) {
          // Create pt_files record so it shows in Drive
          await admin.from('pt_files').insert({
            trainer_id:   user.id,
            client_id:    invoice.client_id ?? null,
            name:         filename,
            storage_path: path,
            size_bytes:   pdfBytes.length,
            mime_type:    'application/pdf',
            section,
            subfolder:    null,
          });

          // Generate a long-lived signed URL from the first upload path as pdf_url
          if (!pdfUrl) {
            const { data: signed } = await admin.storage.from('ptone_drive').createSignedUrl(path, 60 * 60 * 24 * 365);
            pdfUrl = signed?.signedUrl ?? null;
          }
        }
      }

      if (pdfUrl) updates.pdf_url = pdfUrl;
    } catch (err) {
      console.error('[send] PDF Drive upload failed:', err);
    }
  }

  await admin.from('invoices').update(updates).eq('id', id);

  return NextResponse.json({ ok: true, emailed });
}
