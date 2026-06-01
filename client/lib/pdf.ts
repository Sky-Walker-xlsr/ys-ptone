'use client';

export interface PdfInvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface PdfInvoiceData {
  invoice_number: string;
  title: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes?: string | null;
  items: PdfInvoiceItem[];
}

export interface PdfSettings {
  currency: string;
  invoice_footer_text?: string | null;
  invoice_color?: string | null;
  tax_number?: string | null;
  iban?: string | null;
  creditor_name?: string | null;
  creditor_street?: string | null;
  creditor_postal_code?: string | null;
  creditor_city?: string | null;
  creditor_country?: string | null;
}

export interface PdfPtProfile    { name?: string | null; email?: string | null; }
export interface PdfClientProfile { name?: string | null; email?: string | null; }

// ─── Swiss QR Code data builder (SPS 2022, exactly 31 elements) ───────────────
//
// Element count matters: one missing element shifts every subsequent field and
// causes every bank app to reject the code immediately.
//
//  1- 4  Header  (SPC / 0200 / 1 / IBAN)
//  5-11  Creditor — 7 fields (type K = combined address)
// 12-18  Ultimate Creditor — 7 empty fields (not used)
// 19-20  Amount + Currency
// 21-27  Ultimate Debtor — 7 empty fields (not used)
// 28-30  Reference type / reference value / unstructured message
//    31  EPD trailer
//
function buildSwissQrData(opts: {
  iban: string;
  creditorName: string;
  creditorStreet: string;
  creditorPostalCode: string;
  creditorCity: string;
  creditorCountry: string;
  amount: number;
  currency: string;
  message: string;
}): string {
  const iban = opts.iban.replace(/\s/g, '').toUpperCase();
  const amt  = opts.amount > 0 ? opts.amount.toFixed(2) : '';
  const cur  = opts.currency === 'EUR' ? 'EUR' : 'CHF';
  const tr   = (s: string | null | undefined, max = 70) => (s ?? '').trim().slice(0, max);

  const elements = [
    // Header (1-4)
    'SPC', '0200', '1', iban,
    // Creditor K-type (5-11)
    'K',
    tr(opts.creditorName),
    tr(opts.creditorStreet),
    tr(`${opts.creditorPostalCode} ${opts.creditorCity}`),
    '', '',                                              // unused for K-type
    tr(opts.creditorCountry || 'CH', 2).toUpperCase(),
    // Ultimate Creditor — 7 empty (12-18)
    '', '', '', '', '', '', '',
    // Amount + Currency (19-20)
    amt, cur,
    // Ultimate Debtor — 7 empty (21-27)
    '', '', '', '', '', '', '',
    // Reference (28-30)
    'NON', '', tr(opts.message, 140),
    // Trailer (31)
    'EPD',
  ];

  return elements.join('\n'); // LF line endings, accepted by all Swiss banks
}

// ─── PDF generator ────────────────────────────────────────────────────────────

export async function generateInvoicePDF(
  invoice: PdfInvoiceData,
  settings: PdfSettings,
  pt: PdfPtProfile,
  client: PdfClientProfile | null,
): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const autoTable  = (await import('jspdf-autotable')).default;

  const hasQr = !!(
    settings.iban && settings.creditor_name &&
    settings.creditor_postal_code && settings.creditor_city
  );

  // Always standard A4 — QR slip sits in the bottom 105mm of the same page
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  // Reserve bottom 105mm for QR slip; content must stay above this line
  const SLIP_TOP    = 192; // mm — perforation line, QR slip starts here
  const CONTENT_MAX = hasQr ? 183 : 275; // max Y for invoice content

  const currency    = settings.currency ?? 'CHF';
  const cur         = currency === 'EUR' ? 'EUR' : 'CHF';
  const fmt         = (n: number) => `${currency} ${n.toFixed(2)}`;
  const accentColor = settings.invoice_color ?? '#6366f1';
  const accentRgb   = hexToRgb(accentColor);

  // ── Header bar ─────────────────────────────────────────────────────────────
  doc.setFillColor(accentRgb[0], accentRgb[1], accentRgb[2]);
  doc.rect(0, 0, 210, 18, 'F');
  doc.setFont('helvetica', 'bold');   doc.setFontSize(14); doc.setTextColor(255, 255, 255);
  doc.text('RECHNUNG', 14, 12);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text(invoice.invoice_number, 196, 12, { align: 'right' });

  // ── PT info ────────────────────────────────────────────────────────────────
  doc.setTextColor(60, 60, 60); doc.setFontSize(10);
  let yPt = 26;
  if (pt.name)  { doc.setFont('helvetica', 'bold');   doc.text(pt.name,  14, yPt); yPt += 5; }
  if (pt.email) { doc.setFont('helvetica', 'normal'); doc.text(pt.email, 14, yPt); yPt += 5; }
  if (settings.tax_number) {
    doc.setFont('helvetica', 'normal'); doc.text(`MwSt-Nr: ${settings.tax_number}`, 14, yPt);
  }

  // ── Client / recipient info ────────────────────────────────────────────────
  if (client) {
    doc.setFont('helvetica', 'bold');   doc.setFontSize(10); doc.text('Rechnungsempfänger', 120, 26);
    doc.setFont('helvetica', 'normal');
    let yCli = 31;
    if (client.name)  { doc.text(client.name,  120, yCli); yCli += 5; }
    if (client.email) { doc.text(client.email, 120, yCli); }
  }

  // ── Invoice meta ───────────────────────────────────────────────────────────
  doc.setFontSize(9);  doc.setTextColor(120, 120, 120);
  doc.text('Rechnungsdatum', 14, 52); doc.text('Fälligkeitsdatum', 80, 52);
  doc.setFontSize(10); doc.setTextColor(40, 40, 40); doc.setFont('helvetica', 'bold');
  doc.text(formatDate(invoice.issue_date), 14, 57);
  doc.text(formatDate(invoice.due_date),   80, 57);
  doc.setFont('helvetica', 'normal');

  // ── Invoice title ──────────────────────────────────────────────────────────
  doc.setFontSize(12); doc.setTextColor(40, 40, 40); doc.setFont('helvetica', 'bold');
  doc.text(invoice.title, 14, 68);
  doc.setFont('helvetica', 'normal');

  // ── Line items table ───────────────────────────────────────────────────────
  autoTable(doc, {
    startY: 74,
    head:   [['Beschreibung', 'Menge', 'Einzelpreis', 'Betrag']],
    body:   invoice.items.map(item => [
      item.description, item.quantity.toString(), fmt(item.unit_price), fmt(item.total),
    ]),
    headStyles:         { fillColor: accentRgb, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
    bodyStyles:         { fontSize: 10, textColor: [50, 50, 50] },
    alternateRowStyles: { fillColor: [248, 248, 252] },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 22, halign: 'right' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
    theme:  'striped',
  });

  let ty = (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  ty = Math.min(ty, CONTENT_MAX - 35); // clamp if too long

  // ── Totals ─────────────────────────────────────────────────────────────────
  doc.setFontSize(10); doc.setTextColor(80, 80, 80);
  doc.text('Zwischensumme', 125, ty); doc.text(fmt(invoice.subtotal), 196, ty, { align: 'right' });
  if (invoice.tax_rate > 0) {
    ty += 6;
    doc.text(`MwSt. (${invoice.tax_rate}%)`, 125, ty);
    doc.text(fmt(invoice.tax_amount), 196, ty, { align: 'right' });
  }
  ty += 2;
  doc.setDrawColor(accentRgb[0], accentRgb[1], accentRgb[2]); doc.setLineWidth(0.5);
  doc.line(125, ty + 2, 196, ty + 2);
  ty += 8;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(30, 30, 30);
  doc.text('Gesamt', 125, ty); doc.text(fmt(invoice.total), 196, ty, { align: 'right' });
  doc.setFont('helvetica', 'normal');

  // ── Notes ──────────────────────────────────────────────────────────────────
  if (invoice.notes) {
    ty += 12;
    doc.setFontSize(9); doc.setTextColor(100, 100, 100); doc.text('Bemerkungen:', 14, ty);
    ty += 5; doc.setTextColor(60, 60, 60);
    const noteLines = doc.splitTextToSize(invoice.notes, 180);
    doc.text(noteLines, 14, ty);
  }

  // ── Footer (sits just above the perforation line when QR is present) ───────
  const footerY = hasQr ? SLIP_TOP - 7 : 282;
  doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.3);
  doc.line(14, footerY - 3, 196, footerY - 3);
  doc.setFontSize(8); doc.setTextColor(150, 150, 150);
  doc.text(settings.invoice_footer_text ?? '', 105, footerY, { align: 'center' });

  // ── Swiss QR Payment Slip ─────────────────────────────────────────────────
  if (!hasQr) return doc.output('blob');

  const qrcode = await import('qrcode');
  const S = SLIP_TOP; // alias for readability

  // ── Scissors / perforation line ────────────────────────────────────────────
  doc.setDrawColor(100, 100, 100); doc.setLineWidth(0.2);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(5, S, 210, S);
  doc.setLineDashPattern([], 0);
  doc.setFontSize(8); doc.setTextColor(100, 100, 100);
  doc.text('✂', 1, S + 1);

  // ── Vertical separator (Empfangsschein | Zahlteil) ──────────────────────
  const SEP = 62;
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(SEP, S, SEP, S + 105);
  doc.setLineDashPattern([], 0);

  const ibanFmt   = formatIBAN(settings.iban!);
  const addrCity  = `${settings.creditor_postal_code} ${settings.creditor_city}`;

  // ════════════════════════════════════════════════════════════════════════════
  // EMPFANGSSCHEIN  (x: 5–62mm)
  // ════════════════════════════════════════════════════════════════════════════
  const lbl = (text: string, x: number, y: number) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(6); doc.setTextColor(0);
    doc.text(text, x, y);
  };
  const val = (text: string, x: number, y: number, size = 8) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(size); doc.setTextColor(0);
    doc.text(text, x, y);
  };

  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(0);
  doc.text('Empfangsschein', 5, S + 7);

  lbl('Konto / Zahlbar an', 5, S + 16);
  val(ibanFmt,                  5, S + 20);
  val(settings.creditor_name!,  5, S + 24);
  let esY = S + 28;
  if (settings.creditor_street) { val(settings.creditor_street, 5, esY); esY += 4; }
  val(addrCity, 5, esY);

  lbl('Währung', 5, S + 65);
  lbl('Betrag',  22, S + 65);
  val(cur,                       5, S + 70, 9);
  val(invoice.total.toFixed(2), 22, S + 70, 9);

  lbl('Annahmestelle', 30, S + 100);

  // ════════════════════════════════════════════════════════════════════════════
  // ZAHLTEIL  (x: 67–210mm)
  // ════════════════════════════════════════════════════════════════════════════
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(0);
  doc.text('Zahlteil', 67, S + 7);

  // ── QR code (46×46mm, below title) ────────────────────────────────────────
  const QR_X = 67;
  const QR_Y = S + 12;
  const QR_S = 46;

  const qrData = buildSwissQrData({
    iban:               settings.iban!,
    creditorName:       settings.creditor_name!,
    creditorStreet:     settings.creditor_street ?? '',
    creditorPostalCode: settings.creditor_postal_code!,
    creditorCity:       settings.creditor_city!,
    creditorCountry:    settings.creditor_country ?? 'CH',
    amount:             invoice.total,
    currency:           settings.currency ?? 'CHF',
    message:            invoice.invoice_number,
  });

  const qrDataUrl = await qrcode.toDataURL(qrData, {
    errorCorrectionLevel: 'M',
    margin: 0,
    width:  512,
    color:  { dark: '#000000', light: '#ffffff' },
  });

  doc.addImage(qrDataUrl, 'PNG', QR_X, QR_Y, QR_S, QR_S);

  // ── Swiss cross (red background + white cross, Swiss-flag proportions) ─────
  // Position: centered on the QR code
  const CX = QR_X + QR_S / 2 - 3.5; // top-left of the 7×7mm cross box
  const CY = QR_Y + QR_S / 2 - 3.5;
  doc.setFillColor(220, 0, 0);                       // red background
  doc.rect(CX, CY, 7, 7, 'F');
  doc.setFillColor(255, 255, 255);                   // white cross
  doc.rect(CX + 2.8, CY + 1,   1.4, 5,   'F');     // vertical bar
  doc.rect(CX + 1,   CY + 2.8, 5,   1.4, 'F');     // horizontal bar

  // ── Currency + Amount (below QR code) ─────────────────────────────────────
  const AMT_Y = QR_Y + QR_S + 5; // just below QR
  lbl('Währung', QR_X,      AMT_Y);
  lbl('Betrag',  QR_X + 20, AMT_Y);
  val(cur,                        QR_X,      AMT_Y + 5, 10);
  val(invoice.total.toFixed(2),   QR_X + 20, AMT_Y + 5, 10);

  // ── Info column (right of QR code) ────────────────────────────────────────
  const INFO_X = QR_X + QR_S + 7; // 7mm gap after QR code

  lbl('Zahlbar an', INFO_X, QR_Y + 1);
  val(ibanFmt,                 INFO_X, QR_Y + 5);
  val(settings.creditor_name!, INFO_X, QR_Y + 9);
  let infoY = QR_Y + 13;
  if (settings.creditor_street) { val(settings.creditor_street, INFO_X, infoY); infoY += 4; }
  val(addrCity, INFO_X, infoY); infoY += 8;

  lbl('Zahlungszweck', INFO_X, infoY); infoY += 4;
  val(invoice.invoice_number, INFO_X, infoY); infoY += 4;
  if (invoice.title) {
    const tLines = doc.splitTextToSize(invoice.title, 80);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(0);
    doc.text(tLines, INFO_X, infoY);
  }

  return doc.output('blob');
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const v     = parseInt(clean, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatIBAN(iban: string): string {
  const clean = iban.replace(/\s/g, '').toUpperCase();
  return clean.match(/.{1,4}/g)?.join(' ') ?? clean;
}
