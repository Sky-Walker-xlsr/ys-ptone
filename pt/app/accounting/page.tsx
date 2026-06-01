'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { PageShell } from '@/components/PageShell';
import { useTranslation } from '@/locales';
import { createClient } from '@/lib/supabase/client';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  position: number;
}

interface Invoice {
  id: string;
  pt_id: string;
  client_id: string | null;
  invoice_number: string;
  title: string;
  status: 'draft' | 'sent' | 'overdue' | 'reminder1' | 'reminder2' | 'paid' | 'cancelled';
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  pdf_url: string | null;
  sent_at: string | null;
  paid_at: string | null;
  reminder1_sent_at: string | null;
  reminder2_sent_at: string | null;
  invoice_items: InvoiceItem[];
  created_at: string;
  updated_at: string;
}

interface ExpenseEntry {
  id: string;
  pt_id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  notes: string | null;
  receipt_url: string | null;
  is_recurring: boolean;
  recurring_interval: string | null;
  next_occurrence: string | null;
  created_at: string;
}

interface AccountingSettings {
  pt_id?: string;
  currency: string;
  tax_rate_default: number;
  tax_number: string | null;
  invoice_prefix: string;
  invoice_logo_url: string | null;
  invoice_footer_text: string | null;
  invoice_color: string | null;
  payment_due_days: number;
  skonto_percent: number | null;
  skonto_days: number | null;
  reminder1_enabled: boolean;
  reminder1_days_after_due: number;
  reminder1_email_text: string | null;
  reminder2_enabled: boolean;
  reminder2_days_after_r1: number;
  reminder2_email_text: string | null;
  email_auto_send: boolean;
  notification_email: string | null;
  item_templates: ItemTemplate[] | null;
  iban: string | null;
  creditor_name: string | null;
  creditor_street: string | null;
  creditor_postal_code: string | null;
  creditor_city: string | null;
  creditor_country: string | null;
}

interface ItemTemplate {
  name: string;
  items: { description: string; quantity: number; unit_price: number }[];
}

interface ClientShape { id: string; name: string; email: string | null; }

// ─── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; label: string; labelDe: string }> = {
  draft:     { color: 'var(--text-subtle)',  label: 'Draft',      labelDe: 'Entwurf'       },
  sent:      { color: '#3b82f6',             label: 'Sent',       labelDe: 'Versendet'     },
  overdue:   { color: 'var(--danger)',       label: 'Overdue',    labelDe: 'Überfällig'    },
  reminder1: { color: '#9333ea',             label: '1st Reminder', labelDe: '1. Mahnung'  },
  reminder2: { color: '#92400e',             label: '2nd Reminder', labelDe: '2. Mahnung'  },
  paid:      { color: 'var(--success)',      label: 'Paid',       labelDe: 'Bezahlt'       },
  cancelled: { color: 'var(--text-muted)',   label: 'Cancelled',  labelDe: 'Storniert'     },
  due_soon:  { color: '#f59e0b',             label: 'Due soon',   labelDe: 'Fällig bald'   },
};

function computedStatus(inv: Invoice): string {
  if (inv.status !== 'sent') return inv.status;
  const dueDate = new Date(inv.due_date);
  const now     = new Date();
  const diffMs  = dueDate.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return 'overdue';
  if (diffDays < 3) return 'due_soon';
  return 'sent';
}

function StatusBadge({ status, de }: { status: string; de: boolean }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 600,
      background: `${cfg.color}22`, color: cfg.color,
      border: `1px solid ${cfg.color}44`,
    }}>
      {de ? cfg.labelDe : cfg.label}
    </span>
  );
}

function fmt(n: number | null | undefined, currency = 'CHF') {
  return `${currency} ${(n ?? 0).toFixed(2)}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-CH');
}

const EXPENSE_CATEGORIES = [
  { key: 'rent',       labelDe: 'Miete',         labelEn: 'Rent'          },
  { key: 'material',   labelDe: 'Material',       labelEn: 'Material'      },
  { key: 'software',   labelDe: 'Software',       labelEn: 'Software'      },
  { key: 'marketing',  labelDe: 'Marketing',      labelEn: 'Marketing'     },
  { key: 'transport',  labelDe: 'Transport',      labelEn: 'Transport'     },
  { key: 'insurance',  labelDe: 'Versicherung',   labelEn: 'Insurance'     },
  { key: 'education',  labelDe: 'Weiterbildung',  labelEn: 'Education'     },
  { key: 'other',      labelDe: 'Sonstiges',      labelEn: 'Other'         },
];

function catLabel(key: string, de: boolean) {
  return EXPENSE_CATEGORIES.find(c => c.key === key)?.[de ? 'labelDe' : 'labelEn'] ?? key;
}

// ─── Shared UI ─────────────────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, ...style }}>
      {children}
    </div>
  );
}

function Btn({
  children, onClick, variant = 'default', disabled, style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  const base: React.CSSProperties = {
    padding: '7px 14px', borderRadius: 7, fontSize: 13, fontWeight: 500,
    fontFamily: 'inherit', cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1, border: '1px solid var(--border)',
    display: 'inline-flex', alignItems: 'center', gap: 6,
  };
  const variants: Record<string, React.CSSProperties> = {
    default: { background: 'var(--bg-tertiary)', color: 'var(--text-muted)' },
    primary: { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' },
    danger:  { background: 'rgba(240,68,68,0.1)', color: 'var(--danger)', borderColor: 'rgba(240,68,68,0.25)' },
    ghost:   { background: 'transparent', color: 'var(--text-muted)', borderColor: 'transparent' },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

function Input({
  label, value, onChange, type = 'text', placeholder, style, required,
}: {
  label?: string; value: string | number; onChange: (v: string) => void;
  type?: string; placeholder?: string; style?: React.CSSProperties; required?: boolean;
}) {
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 11px', borderRadius: 7, fontSize: 13,
    background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
    color: 'var(--text-primary)', fontFamily: 'inherit', boxSizing: 'border-box',
  };
  return (
    <div style={style}>
      {label && <label style={{ fontSize: 12, color: 'var(--text-subtle)', display: 'block', marginBottom: 4 }}>{label}{required && ' *'}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} style={inputStyle} required={required} />
    </div>
  );
}

function Select({
  label, value, onChange, options, style,
}: {
  label?: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; style?: React.CSSProperties;
}) {
  return (
    <div style={style}>
      {label && <label style={{ fontSize: 12, color: 'var(--text-subtle)', display: 'block', marginBottom: 4 }}>{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        width: '100%', padding: '8px 11px', borderRadius: 7, fontSize: 13,
        background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
        color: 'var(--text-primary)', fontFamily: 'inherit', cursor: 'pointer',
      }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Textarea({
  label, value, onChange, rows = 3,
}: {
  label?: string; value: string; onChange: (v: string) => void; rows?: number;
}) {
  return (
    <div>
      {label && <label style={{ fontSize: 12, color: 'var(--text-subtle)', display: 'block', marginBottom: 4 }}>{label}</label>}
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} style={{
        width: '100%', padding: '8px 11px', borderRadius: 7, fontSize: 13,
        background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
        color: 'var(--text-primary)', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
      }} />
    </div>
  );
}

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button onClick={onToggle} style={{
        width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
        background: on ? 'var(--accent)' : 'var(--bg-tertiary)', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}>
        <span style={{
          display: 'block', width: 16, height: 16, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 3, left: on ? 21 : 3, transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
        }} />
      </button>
      {label && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>}
    </div>
  );
}

// ─── Overlay Modal ─────────────────────────────────────────────────────────────

function Modal({ title, onClose, children, wide }: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '40px 20px', overflowY: 'auto',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16,
        width: '100%', maxWidth: wide ? 760 : 520, padding: 28,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 7, border: 'none', background: 'var(--bg-tertiary)',
            color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── New Invoice Modal ─────────────────────────────────────────────────────────

interface NewInvoiceModalProps {
  de: boolean;
  clients: ClientShape[];
  settings: AccountingSettings | null;
  accessToken: string;
  onCreated: (inv: Invoice) => void;
  onClose: () => void;
  editInvoice?: Invoice | null;
  onTemplatesSaved?: (templates: ItemTemplate[]) => void;
}

function NewInvoiceModal({ de, clients, settings, accessToken, onCreated, onClose, editInvoice, onTemplatesSaved }: NewInvoiceModalProps) {
  const isEdit = !!editInvoice;
  const today = new Date().toISOString().slice(0, 10);
  const defaultDue = new Date(Date.now() + (settings?.payment_due_days ?? 30) * 86400000).toISOString().slice(0, 10);

  const [title,      setTitle]      = useState(editInvoice?.title ?? '');
  const [clientId,   setClientId]   = useState(editInvoice?.client_id ?? '');
  const [issueDate,  setIssueDate]  = useState(editInvoice?.issue_date ?? today);
  const [dueDate,    setDueDate]    = useState(editInvoice?.due_date ?? defaultDue);
  const [taxRate,    setTaxRate]    = useState(String(editInvoice?.tax_rate ?? settings?.tax_rate_default ?? 0));
  const [notes,      setNotes]      = useState(editInvoice?.notes ?? '');
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState<string | null>(null);

  // Templates
  const [showTemplates,   setShowTemplates]   = useState(false);
  const [templateName,    setTemplateName]    = useState('');
  const [savingTemplate,  setSavingTemplate]  = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const templates = settings?.item_templates ?? [];

  const [items, setItems] = useState<{ description: string; quantity: string; unit_price: string }[]>(
    editInvoice?.invoice_items?.length
      ? editInvoice.invoice_items.map(i => ({
          description: i.description,
          quantity:    String(i.quantity),
          unit_price:  String(i.unit_price),
        }))
      : [{ description: '', quantity: '1', unit_price: '' }]
  );

  const currency = settings?.currency ?? 'CHF';
  const taxRateNum = parseFloat(taxRate) || 0;
  const subtotal = items.reduce((acc, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    return acc + qty * price;
  }, 0);
  const taxAmount = subtotal * (taxRateNum / 100);
  const total = subtotal + taxAmount;

  function addItem() { setItems(prev => [...prev, { description: '', quantity: '1', unit_price: '' }]); }
  function removeItem(i: number) { setItems(prev => prev.filter((_, idx) => idx !== i)); }
  function updateItem(i: number, field: keyof typeof items[0], val: string) {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: val } : it));
  }

  function applyTemplate(tpl: ItemTemplate) {
    setItems(tpl.items.map(it => ({
      description: it.description,
      quantity:    String(it.quantity),
      unit_price:  String(it.unit_price),
    })));
    setShowTemplates(false);
  }

  async function saveAsTemplate() {
    if (!templateName.trim()) return;
    setSavingTemplate(true);
    const newTemplates: ItemTemplate[] = [
      ...(settings?.item_templates ?? []),
      {
        name: templateName.trim(),
        items: items.filter(it => it.description).map(it => ({
          description: it.description,
          quantity:    parseFloat(it.quantity) || 1,
          unit_price:  parseFloat(it.unit_price) || 0,
        })),
      },
    ];
    const res = await fetch('/api/accounting/settings', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_templates: newTemplates }),
    });
    if (res.ok) { onTemplatesSaved?.(newTemplates); }
    setTemplateName('');
    setShowSaveTemplate(false);
    setSavingTemplate(false);
  }

  async function deleteTemplate(name: string) {
    const newTemplates = (settings?.item_templates ?? []).filter(t => t.name !== name);
    const res = await fetch('/api/accounting/settings', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_templates: newTemplates }),
    });
    if (res.ok) { onTemplatesSaved?.(newTemplates); }
  }

  async function save() {
    if (!title || items.every(it => !it.description)) return;
    setSaving(true);
    setSaveError(null);
    const payload = {
      title, client_id: clientId || null, issue_date: issueDate, due_date: dueDate,
      subtotal, tax_rate: taxRateNum, tax_amount: taxAmount, total,
      notes: notes || null,
      items: items.filter(it => it.description).map((it, idx) => ({
        description: it.description,
        quantity:    parseFloat(it.quantity) || 1,
        unit_price:  parseFloat(it.unit_price) || 0,
        total:       (parseFloat(it.quantity) || 1) * (parseFloat(it.unit_price) || 0),
        position:    idx,
      })),
    };
    const url = isEdit ? `/api/accounting/invoices/${editInvoice!.id}` : '/api/accounting/invoices';
    const method = isEdit ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method, headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const { invoice } = await res.json();
      onCreated(invoice);
      onClose();
    } else {
      const errJson = await res.json().catch(() => ({}));
      setSaveError(errJson.error ?? `HTTP ${res.status}`);
    }
    setSaving(false);
  }

  return (
    <Modal title={de ? (isEdit ? 'Rechnung bearbeiten' : 'Neue Rechnung') : (isEdit ? 'Edit invoice' : 'New invoice')} onClose={onClose} wide>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label={de ? 'Titel / Betreff *' : 'Title / Subject *'} value={title} onChange={setTitle} required style={{ gridColumn: '1 / -1' }} />
          <Select
            label={de ? 'Client' : 'Client'}
            value={clientId}
            onChange={setClientId}
            options={[{ value: '', label: de ? '— Kein Client —' : '— No client —' }, ...clients.map(c => ({ value: c.id, label: c.name }))]}
          />
          <Input label={de ? 'MwSt. (%)' : 'Tax rate (%)'} type="number" value={taxRate} onChange={setTaxRate} />
          <Input label={de ? 'Rechnungsdatum' : 'Issue date'} type="date" value={issueDate} onChange={setIssueDate} />
          <Input label={de ? 'Fälligkeitsdatum' : 'Due date'} type="date" value={dueDate} onChange={setDueDate} />
        </div>

        {/* Line items */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{de ? 'Positionen' : 'Line items'}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {templates.length > 0 && (
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setShowTemplates(s => !s)} style={{
                    fontSize: 12, color: 'var(--accent)', background: 'var(--accent-muted)', border: '1px solid var(--accent)44',
                    borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    ▼ {de ? 'Vorlage einfügen' : 'Insert template'}
                  </button>
                  {showTemplates && (
                    <div style={{
                      position: 'absolute', right: 0, top: '110%', zIndex: 50,
                      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)', minWidth: 200, overflow: 'hidden',
                    }}>
                      {templates.map(tpl => (
                        <div key={tpl.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <button onMouseDown={() => applyTemplate(tpl)} style={{
                            flex: 1, padding: '10px 14px', textAlign: 'left', background: 'none', border: 'none',
                            cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)', fontFamily: 'inherit',
                          }}>{tpl.name}</button>
                          <button onMouseDown={() => deleteTemplate(tpl.name)} style={{
                            padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: 13, color: 'var(--danger)',
                          }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button onClick={() => setShowSaveTemplate(s => !s)} style={{
                fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {de ? 'Als Vorlage speichern' : 'Save as template'}
              </button>
            </div>
          </div>
          {showSaveTemplate && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input
                value={templateName} onChange={e => setTemplateName(e.target.value)}
                placeholder={de ? 'Vorlagenname...' : 'Template name...'}
                onKeyDown={e => e.key === 'Enter' && saveAsTemplate()}
                style={{ flex: 1, padding: '6px 10px', borderRadius: 6, fontSize: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'inherit' }}
              />
              <button onClick={saveAsTemplate} disabled={savingTemplate || !templateName.trim()} style={{
                padding: '6px 12px', borderRadius: 6, fontSize: 12, background: 'var(--accent)', color: '#fff',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit', opacity: !templateName.trim() ? 0.5 : 1,
              }}>
                {savingTemplate ? '...' : (de ? 'Speichern' : 'Save')}
              </button>
            </div>
          )}
          <Card style={{ overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 90px 90px 28px', gap: 0 }}>
              {['Beschreibung', 'Menge', 'Preis', currency, ''].map((h, i) => (
                <div key={i} style={{ padding: '8px 10px', fontSize: 11, color: 'var(--text-subtle)', background: 'var(--bg-tertiary)', fontWeight: 600 }}>{h}</div>
              ))}
            </div>
            {items.map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 90px 90px 28px', borderTop: '1px solid var(--border)' }}>
                <input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)}
                  placeholder={de ? 'Leistung...' : 'Service...'} style={{ padding: '8px 10px', fontSize: 13, background: 'none', border: 'none', color: 'var(--text-primary)', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }} />
                <input value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)}
                  type="number" min="0" step="0.5" style={{ padding: '8px 10px', fontSize: 13, background: 'none', border: 'none', borderLeft: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }} />
                <input value={item.unit_price} onChange={e => updateItem(i, 'unit_price', e.target.value)}
                  type="number" min="0" step="0.05" placeholder="0.00" style={{ padding: '8px 10px', fontSize: 13, background: 'none', border: 'none', borderLeft: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }} />
                <div style={{ padding: '8px 10px', fontSize: 13, color: 'var(--text-muted)', borderLeft: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
                  {fmt((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0), currency)}
                </div>
                <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', borderLeft: '1px solid var(--border)', color: 'var(--danger)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
            ))}
          </Card>
          <button onClick={addItem} style={{ marginTop: 8, fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
            + {de ? 'Position hinzufügen' : 'Add line item'}
          </button>
        </div>

        {/* Totals */}
        <Card style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
            <span>{de ? 'Zwischensumme' : 'Subtotal'}</span><span>{fmt(subtotal, currency)}</span>
          </div>
          {taxRateNum > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
              <span>MwSt. {taxRateNum}%</span><span>{fmt(taxAmount, currency)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <span>{de ? 'Gesamt' : 'Total'}</span><span>{fmt(total, currency)}</span>
          </div>
        </Card>

        <Textarea label={de ? 'Bemerkungen' : 'Notes'} value={notes} onChange={setNotes} />

        {saveError && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(240,68,68,0.1)', border: '1px solid rgba(240,68,68,0.25)', fontSize: 13, color: 'var(--danger)' }}>
            ⚠ {saveError}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
          <Btn onClick={onClose}>{de ? 'Abbrechen' : 'Cancel'}</Btn>
          <Btn variant="primary" onClick={save} disabled={saving}>
            {saving ? '...' : (isEdit ? (de ? 'Speichern' : 'Save') : (de ? 'Erstellen' : 'Create'))}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ─── Invoice Detail / Actions Modal ───────────────────────────────────────────

interface InvoiceDetailProps {
  invoice: Invoice;
  de: boolean;
  settings: AccountingSettings | null;
  clients: ClientShape[];
  accessToken: string;
  ptProfile: { name: string | null; email: string | null } | null;
  onUpdated: (inv: Invoice) => void;
  onDeleted: (id: string) => void;
  onClose: () => void;
  onEdit: () => void;
}

function InvoiceDetailModal({ invoice, de, settings, clients, accessToken, ptProfile, onUpdated, onDeleted, onClose, onEdit }: InvoiceDetailProps) {
  const [loading,    setLoading]    = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [showEmail,  setShowEmail]  = useState(false);
  const currency = settings?.currency ?? 'CHF';
  const client = clients.find(c => c.id === invoice.client_id) ?? null;
  const status = computedStatus(invoice);

  async function downloadPDF() {
    setLoading(true);
    const { generateInvoicePDF } = await import('@/lib/pdf');
    const blob = await generateInvoicePDF(
      { ...invoice, items: invoice.invoice_items },
      { currency, invoice_footer_text: settings?.invoice_footer_text, invoice_color: settings?.invoice_color, tax_number: settings?.tax_number, iban: settings?.iban, creditor_name: settings?.creditor_name, creditor_street: settings?.creditor_street, creditor_postal_code: settings?.creditor_postal_code, creditor_city: settings?.creditor_city, creditor_country: settings?.creditor_country },
      { name: ptProfile?.name, email: ptProfile?.email },
      client ? { name: client.name, email: client.email } : null,
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${invoice.invoice_number}.pdf`; a.click();
    URL.revokeObjectURL(url);
    setLoading(false);
  }

  async function sendInvoice(type: 'invoice' | 'reminder1' | 'reminder2') {
    setLoading(true);
    let pdfBase64: string | undefined;

    try {
      const { generateInvoicePDF } = await import('@/lib/pdf');
      const blob = await generateInvoicePDF(
        { ...invoice, items: invoice.invoice_items },
        { currency, invoice_footer_text: settings?.invoice_footer_text, invoice_color: settings?.invoice_color, tax_number: settings?.tax_number, iban: settings?.iban, creditor_name: settings?.creditor_name, creditor_street: settings?.creditor_street, creditor_postal_code: settings?.creditor_postal_code, creditor_city: settings?.creditor_city, creditor_country: settings?.creditor_country },
        { name: ptProfile?.name, email: ptProfile?.email },
        client ? { name: client.name, email: client.email } : null,
      );
      const buffer = await blob.arrayBuffer();
      pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    } catch (_) {
      // continue without PDF if generation fails
    }

    const res = await fetch(`/api/accounting/invoices/${invoice.id}/send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, pdfBase64, recipientEmail: emailInput || undefined }),
    });
    if (res.ok) {
      const { invoice: updated } = await fetch(`/api/accounting/invoices/${invoice.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then(r => r.json());
      onUpdated(updated);
    }
    setLoading(false);
    setShowEmail(false);
  }

  async function markPaid() {
    setLoading(true);
    const res = await fetch(`/api/accounting/invoices/${invoice.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid' }),
    });
    if (res.ok) { const { invoice: upd } = await res.json(); onUpdated(upd); }
    setLoading(false);
  }

  async function deleteInvoice() {
    if (!confirm(de ? 'Rechnung wirklich löschen?' : 'Really delete this invoice?')) return;
    setLoading(true);
    await fetch(`/api/accounting/invoices/${invoice.id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` },
    });
    onDeleted(invoice.id);
    setLoading(false);
    onClose();
  }

  return (
    <Modal title={`${invoice.invoice_number} – ${invoice.title}`} onClose={onClose} wide>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Status + meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <StatusBadge status={status} de={de} />
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{de ? 'Ausgestellt:' : 'Issued:'} {fmtDate(invoice.issue_date)}</span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{de ? 'Fällig:' : 'Due:'} {fmtDate(invoice.due_date)}</span>
          {client && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{de ? 'Client:' : 'Client:'} {client.name}</span>}
        </div>

        {/* Items */}
        <Card style={{ overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 90px 90px', borderBottom: '1px solid var(--border)' }}>
            {[de ? 'Beschreibung' : 'Description', de ? 'Menge' : 'Qty', de ? 'Preis' : 'Price', de ? 'Betrag' : 'Amount'].map((h, i) => (
              <div key={i} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-subtle)', background: 'var(--bg-tertiary)' }}>{h}</div>
            ))}
          </div>
          {invoice.invoice_items.map((item, i) => (
            <div key={item.id ?? i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 90px 90px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)' }}>{item.description}</div>
              <div style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-muted)', borderLeft: '1px solid var(--border)' }}>{item.quantity}</div>
              <div style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-muted)', borderLeft: '1px solid var(--border)' }}>{fmt(item.unit_price, currency)}</div>
              <div style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, borderLeft: '1px solid var(--border)' }}>{fmt(item.total, currency)}</div>
            </div>
          ))}
        </Card>

        {/* Totals */}
        <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--text-muted)' }}>
          <div style={{ marginBottom: 4 }}>{de ? 'Zwischensumme' : 'Subtotal'}: {fmt(invoice.subtotal, currency)}</div>
          {invoice.tax_rate > 0 && <div style={{ marginBottom: 4 }}>MwSt. {invoice.tax_rate}%: {fmt(invoice.tax_amount, currency)}</div>}
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{de ? 'Gesamt' : 'Total'}: {fmt(invoice.total, currency)}</div>
        </div>

        {invoice.notes && <p style={{ fontSize: 13, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', borderRadius: 8, padding: '10px 14px', margin: 0 }}>{invoice.notes}</p>}

        {/* Email override input */}
        {showEmail && (
          <Input label={de ? 'Empfänger E-Mail (optional)' : 'Recipient email (optional)'} value={emailInput} onChange={setEmailInput} type="email" placeholder={client?.email ?? 'email@example.com'} />
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 4, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Btn onClick={downloadPDF} disabled={loading}>⬇ PDF</Btn>
            <Btn onClick={() => setShowEmail(s => !s)} variant="ghost" style={{ fontSize: 12 }}>
              {showEmail ? (de ? 'E-Mail ausblenden' : 'Hide email') : (de ? 'E-Mail überschreiben' : 'Override email')}
            </Btn>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {invoice.status === 'draft' && <Btn variant="primary" onClick={() => sendInvoice('invoice')} disabled={loading}>{de ? 'Rechnung senden' : 'Send invoice'}</Btn>}
            {(invoice.status === 'sent' || status === 'due_soon' || status === 'overdue') && <Btn variant="primary" onClick={() => sendInvoice('reminder1')} disabled={loading}>{de ? '1. Mahnung' : '1st reminder'}</Btn>}
            {invoice.status === 'overdue' || invoice.status === 'reminder1' ? <Btn variant="primary" onClick={() => sendInvoice('reminder2')} disabled={loading}>{de ? '2. Mahnung' : '2nd reminder'}</Btn> : null}
            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && <Btn variant="primary" onClick={markPaid} disabled={loading}>{de ? 'Als bezahlt markieren' : 'Mark paid'}</Btn>}
            <Btn onClick={onEdit}>{de ? 'Bearbeiten' : 'Edit'}</Btn>
            <Btn variant="danger" onClick={deleteInvoice} disabled={loading}>{de ? 'Löschen' : 'Delete'}</Btn>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── New Expense Modal ─────────────────────────────────────────────────────────

function NewExpenseModal({ de, accessToken, onCreated, onClose, editExpense, ptId }: {
  de: boolean; accessToken: string;
  onCreated: (exp: ExpenseEntry) => void;
  onClose: () => void;
  editExpense?: ExpenseEntry | null;
  ptId: string;
}) {
  const isEdit = !!editExpense;
  const today = new Date().toISOString().slice(0, 10);

  const [title,      setTitle]      = useState(editExpense?.title ?? '');
  const [amount,     setAmount]     = useState(String(editExpense?.amount ?? ''));
  const [category,   setCategory]   = useState(editExpense?.category ?? 'other');
  const [date,       setDate]       = useState(editExpense?.date ?? today);
  const [notes,      setNotes]      = useState(editExpense?.notes ?? '');
  const [recurring,  setRecurring]  = useState(editExpense?.is_recurring ?? false);
  const [interval,   setInterval]   = useState(editExpense?.recurring_interval ?? 'monthly');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [saving,     setSaving]     = useState(false);

  async function save() {
    if (!title || !amount) return;
    setSaving(true);

    let receipt_url: string | null = editExpense?.receipt_url ?? null;
    if (receiptFile) {
      const supabase = createClient();
      const path = `${ptId}/receipts/${Date.now()}_${receiptFile.name}`;
      const { data: uploaded } = await supabase.storage.from('accounting').upload(path, receiptFile, { upsert: true });
      if (uploaded) {
        const { data: urlData } = supabase.storage.from('accounting').getPublicUrl(path);
        receipt_url = urlData?.publicUrl ?? null;
      }
    }

    const nextOcc = recurring ? (() => {
      const d = new Date(date);
      if (interval === 'weekly')    d.setDate(d.getDate() + 7);
      if (interval === 'monthly')   d.setMonth(d.getMonth() + 1);
      if (interval === 'quarterly') d.setMonth(d.getMonth() + 3);
      if (interval === 'yearly')    d.setFullYear(d.getFullYear() + 1);
      return d.toISOString().slice(0, 10);
    })() : null;

    const payload = {
      title, amount: parseFloat(amount), category, date,
      notes: notes || null, receipt_url,
      is_recurring: recurring,
      recurring_interval: recurring ? interval : null,
      next_occurrence: nextOcc,
    };

    const url = isEdit ? `/api/accounting/expenses/${editExpense!.id}` : '/api/accounting/expenses';
    const method = isEdit ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method, headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const json = await res.json();
      onCreated(isEdit ? json.expense : json.expense);
      onClose();
    }
    setSaving(false);
  }

  const catOpts = EXPENSE_CATEGORIES.map(c => ({ value: c.key, label: de ? c.labelDe : c.labelEn }));
  const intervalOpts = [
    { value: 'weekly',    label: de ? 'Wöchentlich' : 'Weekly'    },
    { value: 'monthly',   label: de ? 'Monatlich'   : 'Monthly'   },
    { value: 'quarterly', label: de ? 'Quartalsweise': 'Quarterly' },
    { value: 'yearly',    label: de ? 'Jährlich'    : 'Yearly'    },
  ];

  return (
    <Modal title={de ? (isEdit ? 'Ausgabe bearbeiten' : 'Neue Ausgabe') : (isEdit ? 'Edit expense' : 'New expense')} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input label={de ? 'Bezeichnung *' : 'Title *'} value={title} onChange={setTitle} required />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label={de ? 'Betrag *' : 'Amount *'} type="number" value={amount} onChange={setAmount} required />
          <Select label={de ? 'Kategorie' : 'Category'} value={category} onChange={setCategory} options={catOpts} />
          <Input label={de ? 'Datum' : 'Date'} type="date" value={date} onChange={setDate} />
        </div>
        <Textarea label={de ? 'Bemerkungen' : 'Notes'} value={notes} onChange={setNotes} rows={2} />

        {/* Receipt upload */}
        <div>
          <label style={{ fontSize: 12, color: 'var(--text-subtle)', display: 'block', marginBottom: 4 }}>{de ? 'Beleg (optional)' : 'Receipt (optional)'}</label>
          <input type="file" accept="image/*,application/pdf" onChange={e => setReceiptFile(e.target.files?.[0] ?? null)}
            style={{ fontSize: 13, color: 'var(--text-muted)' }} />
          {editExpense?.receipt_url && !receiptFile && (
            <a href={editExpense.receipt_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--accent)', display: 'block', marginTop: 4 }}>
              {de ? 'Vorhandener Beleg ansehen' : 'View existing receipt'}
            </a>
          )}
        </div>

        {/* Recurring */}
        <div style={{ background: 'var(--bg-tertiary)', borderRadius: 9, padding: '12px 14px' }}>
          <Toggle on={recurring} onToggle={() => setRecurring(r => !r)} label={de ? 'Wiederkehrend' : 'Recurring'} />
          {recurring && (
            <Select label={de ? 'Intervall' : 'Interval'} value={interval} onChange={setInterval} options={intervalOpts} style={{ marginTop: 10 }} />
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Btn onClick={onClose}>{de ? 'Abbrechen' : 'Cancel'}</Btn>
          <Btn variant="primary" onClick={save} disabled={saving}>{saving ? '...' : (de ? 'Speichern' : 'Save')}</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ─── Tab: Invoices ─────────────────────────────────────────────────────────────

function InvoicesTab({ invoices, de, settings, clients, accessToken, ptProfile, onUpdated, onDeleted, onAdd }: {
  invoices: Invoice[]; de: boolean; settings: AccountingSettings | null;
  clients: ClientShape[]; accessToken: string;
  ptProfile: { name: string | null; email: string | null } | null;
  onUpdated: (inv: Invoice) => void; onDeleted: (id: string) => void;
  onAdd: () => void;
}) {
  const [filter, setFilter] = useState<string>('all');
  const [detail, setDetail] = useState<Invoice | null>(null);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const currency = settings?.currency ?? 'CHF';

  const filters = ['all', 'draft', 'sent', 'overdue', 'reminder1', 'reminder2', 'paid', 'cancelled'];
  const filtered = filter === 'all' ? invoices : invoices.filter(inv => {
    const cs = computedStatus(inv);
    return inv.status === filter || cs === filter;
  });

  return (
    <div>
      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: filter === f ? 700 : 400,
            background: filter === f ? 'var(--accent)' : 'var(--bg-card)',
            color: filter === f ? '#fff' : 'var(--text-muted)',
            border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--border)'}`,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {f === 'all' ? (de ? 'Alle' : 'All') : (STATUS_CONFIG[f]?.[de ? 'labelDe' : 'label'] ?? f)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-subtle)', fontSize: 14 }}>
          {de ? 'Keine Rechnungen' : 'No invoices'} · <button onClick={onAdd} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>{de ? 'Erste erstellen' : 'Create first'}</button>
        </div>
      ) : (
        <Card>
          {filtered.map((inv, i) => {
            const cs = computedStatus(inv);
            const client = clients.find(c => c.id === inv.client_id);
            return (
              <div
                key={inv.id}
                onClick={() => setDetail(inv)}
                style={{
                  display: 'grid', gridTemplateColumns: '130px 1fr 100px 120px 100px',
                  alignItems: 'center', padding: '14px 18px', cursor: 'pointer',
                  borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{inv.invoice_number}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{inv.title}</div>
                  {client && <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 2 }}>{client.name}</div>}
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{fmtDate(inv.due_date)}</span>
                <StatusBadge status={cs} de={de} />
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>{fmt(inv.total, currency)}</span>
              </div>
            );
          })}
        </Card>
      )}

      {detail && !editing && (
        <InvoiceDetailModal
          invoice={detail} de={de} settings={settings} clients={clients}
          accessToken={accessToken} ptProfile={ptProfile}
          onUpdated={inv => { onUpdated(inv); setDetail(inv); }}
          onDeleted={onDeleted}
          onClose={() => setDetail(null)}
          onEdit={() => { setEditing(detail); setDetail(null); }}
        />
      )}

      {editing && (
        <NewInvoiceModal
          de={de} clients={clients} settings={settings} accessToken={accessToken}
          editInvoice={editing}
          onCreated={inv => { onUpdated(inv); setDetail(inv); setEditing(null); }}
          onClose={() => setEditing(null)}
          onTemplatesSaved={() => {}}
        />
      )}
    </div>
  );
}

// ─── Tab: Income ───────────────────────────────────────────────────────────────

function IncomeTab({ invoices, de, settings }: { invoices: Invoice[]; de: boolean; settings: AccountingSettings | null }) {
  const currency = settings?.currency ?? 'CHF';
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear  = now.getFullYear();

  const paid = invoices.filter(inv => inv.status === 'paid');
  const totalAll   = paid.reduce((s, inv) => s + inv.total, 0);
  const totalMonth = paid.filter(inv => {
    const d = new Date(inv.paid_at ?? inv.updated_at ?? inv.issue_date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).reduce((s, inv) => s + inv.total, 0);
  const totalYear = paid.filter(inv => {
    const d = new Date(inv.paid_at ?? inv.updated_at ?? inv.issue_date);
    return d.getFullYear() === currentYear;
  }).reduce((s, inv) => s + inv.total, 0);

  // Group by month (last 12 months)
  const monthly: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthly[key] = 0;
  }
  paid.forEach(inv => {
    const d = new Date(inv.paid_at ?? inv.updated_at ?? inv.issue_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (key in monthly) monthly[key] += inv.total;
  });

  const maxVal = Math.max(...Object.values(monthly), 1);
  const months = Object.entries(monthly);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {[
          { label: de ? 'Diesen Monat' : 'This month', value: totalMonth },
          { label: de ? 'Dieses Jahr'  : 'This year',  value: totalYear  },
          { label: de ? 'Gesamt'       : 'Total',       value: totalAll   },
        ].map(card => (
          <Card key={card.label} style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{card.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--success)' }}>{fmt(card.value, currency)}</div>
          </Card>
        ))}
      </div>

      {/* Bar chart */}
      <Card style={{ padding: '20px 24px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>{de ? 'Einnahmen (letzte 12 Monate)' : 'Income (last 12 months)'}</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
          {months.map(([key, val]) => {
            const height = Math.max((val / maxVal) * 100, val > 0 ? 4 : 0);
            const [y, m] = key.split('-');
            const label = new Date(+y, +m - 1, 1).toLocaleDateString('de-CH', { month: 'short' });
            return (
              <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div title={`${fmt(val, currency)}`} style={{ width: '100%', height: `${height}%`, background: val > 0 ? 'var(--success)' : 'var(--bg-tertiary)', borderRadius: '3px 3px 0 0', transition: 'height 0.3s' }} />
                <span style={{ fontSize: 9, color: 'var(--text-subtle)', whiteSpace: 'nowrap' }}>{label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Paid invoices list */}
      {paid.length > 0 && (
        <Card>
          {paid.map((inv, i) => (
            <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 18px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{inv.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{inv.invoice_number} · {fmtDate(inv.paid_at ?? inv.issue_date)}</div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--success)' }}>{fmt(inv.total, currency)}</span>
            </div>
          ))}
        </Card>
      )}

      {paid.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-subtle)', fontSize: 14 }}>
          {de ? 'Noch keine bezahlten Rechnungen.' : 'No paid invoices yet.'}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Expenses ─────────────────────────────────────────────────────────────

function ExpensesTab({ expenses, de, settings, accessToken, ptId, onCreated, onUpdated, onDeleted }: {
  expenses: ExpenseEntry[]; de: boolean; settings: AccountingSettings | null;
  accessToken: string; ptId: string;
  onCreated: (exp: ExpenseEntry) => void;
  onUpdated: (exp: ExpenseEntry) => void;
  onDeleted: (id: string) => void;
}) {
  const [showNew,    setShowNew]    = useState(false);
  const [editExp,    setEditExp]    = useState<ExpenseEntry | null>(null);
  const [catFilter,  setCatFilter]  = useState('all');
  const currency = settings?.currency ?? 'CHF';

  const categories = ['all', ...Array.from(new Set(expenses.map(e => e.category)))];
  const filtered = catFilter === 'all' ? expenses : expenses.filter(e => e.category === catFilter);

  async function deleteExpense(id: string) {
    if (!confirm(de ? 'Ausgabe wirklich löschen?' : 'Really delete?')) return;
    await fetch(`/api/accounting/expenses/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
    onDeleted(id);
  }

  const totalMonth = expenses.filter(e => {
    const d = new Date(e.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, e) => s + e.amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setCatFilter(cat)} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: catFilter === cat ? 700 : 400,
              background: catFilter === cat ? 'var(--accent)' : 'var(--bg-card)',
              color: catFilter === cat ? '#fff' : 'var(--text-muted)',
              border: `1px solid ${catFilter === cat ? 'var(--accent)' : 'var(--border)'}`,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {cat === 'all' ? (de ? 'Alle' : 'All') : catLabel(cat, de)}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {de ? 'Dieser Monat:' : 'This month:'} <strong style={{ color: 'var(--danger)' }}>{fmt(totalMonth, currency)}</strong>
          </span>
          <Btn variant="primary" onClick={() => setShowNew(true)}>+ {de ? 'Ausgabe' : 'Expense'}</Btn>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-subtle)', fontSize: 14 }}>
          {de ? 'Keine Ausgaben' : 'No expenses'}
        </div>
      ) : (
        <Card>
          {filtered.map((exp, i) => (
            <div key={exp.id} style={{ display: 'flex', alignItems: 'center', padding: '13px 18px', borderTop: i > 0 ? '1px solid var(--border)' : 'none', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{exp.title}</span>
                  {exp.is_recurring && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: 'var(--accent-muted)', color: 'var(--accent)', fontWeight: 600 }}>↻</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 2 }}>
                  {fmtDate(exp.date)} · {catLabel(exp.category, de)}
                  {exp.receipt_url && <> · <a href={exp.receipt_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>{de ? 'Beleg' : 'Receipt'}</a></>}
                </div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--danger)' }}>- {fmt(exp.amount, currency)}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <Btn variant="ghost" onClick={() => setEditExp(exp)} style={{ padding: '4px 8px', fontSize: 12 }}>{de ? 'Bearbeiten' : 'Edit'}</Btn>
                <Btn variant="danger" onClick={() => deleteExpense(exp.id)} style={{ padding: '4px 8px', fontSize: 12 }}>✕</Btn>
              </div>
            </div>
          ))}
        </Card>
      )}

      {(showNew || editExp) && (
        <NewExpenseModal
          de={de} accessToken={accessToken} ptId={ptId}
          editExpense={editExp}
          onCreated={exp => { if (editExp) onUpdated(exp); else onCreated(exp); }}
          onClose={() => { setShowNew(false); setEditExp(null); }}
        />
      )}
    </div>
  );
}

// ─── Tab: Reports ──────────────────────────────────────────────────────────────

function ReportsTab({ invoices, expenses, de, settings }: {
  invoices: Invoice[]; expenses: ExpenseEntry[]; de: boolean; settings: AccountingSettings | null;
}) {
  const currency = settings?.currency ?? 'CHF';
  const now = new Date();
  const year = now.getFullYear();

  const income   = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);
  const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
  const profit   = income - totalExp;

  // Monthly breakdown
  const months: { label: string; income: number; expense: number }[] = [];
  for (let m = 0; m < 12; m++) {
    const label = new Date(year, m, 1).toLocaleDateString('de-CH', { month: 'short' });
    const inc = invoices.filter(i => i.status === 'paid' && new Date(i.paid_at ?? i.issue_date).getMonth() === m && new Date(i.paid_at ?? i.issue_date).getFullYear() === year).reduce((s, i) => s + i.total, 0);
    const exp = expenses.filter(e => new Date(e.date).getMonth() === m && new Date(e.date).getFullYear() === year).reduce((s, e) => s + e.amount, 0);
    months.push({ label, income: inc, expense: exp });
  }

  // Category breakdown
  const catBreakdown: Record<string, number> = {};
  expenses.forEach(e => { catBreakdown[e.category] = (catBreakdown[e.category] ?? 0) + e.amount; });

  function exportCSV() {
    const rows = [
      ['Typ', 'Datum', 'Beschreibung', 'Betrag', 'Kategorie'],
      ...invoices.filter(i => i.status === 'paid').map(i => ['Einnahme', i.paid_at ?? i.issue_date, i.title, i.total.toFixed(2), '']),
      ...expenses.map(e => ['Ausgabe', e.date, e.title, (-e.amount).toFixed(2), catLabel(e.category, de)]),
    ];
    const csv = rows.map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `buchaltung-${year}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const maxBar = Math.max(...months.map(m => Math.max(m.income, m.expense)), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* P&L summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        <Card style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{de ? 'Einnahmen (Jahr)' : 'Income (year)'}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--success)' }}>{fmt(income, currency)}</div>
        </Card>
        <Card style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{de ? 'Ausgaben (Jahr)' : 'Expenses (year)'}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--danger)' }}>{fmt(totalExp, currency)}</div>
        </Card>
        <Card style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Gewinn / Verlust</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{fmt(profit, currency)}</div>
        </Card>
      </div>

      {/* Monthly bar chart */}
      <Card style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{de ? `Einnahmen & Ausgaben ${year}` : `Income & Expenses ${year}`}</div>
          <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-subtle)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--success)', display: 'inline-block' }}/>{de ? 'Einnahmen' : 'Income'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--danger)', display: 'inline-block' }}/>{de ? 'Ausgaben' : 'Expenses'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
          {months.map(m => (
            <div key={m.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: '100%', display: 'flex', gap: 2, alignItems: 'flex-end', height: 120 }}>
                <div title={fmt(m.income, currency)} style={{ flex: 1, height: `${(m.income / maxBar) * 100}%`, background: 'var(--success)', borderRadius: '3px 3px 0 0', minHeight: m.income > 0 ? 3 : 0 }} />
                <div title={fmt(m.expense, currency)} style={{ flex: 1, height: `${(m.expense / maxBar) * 100}%`, background: 'var(--danger)', borderRadius: '3px 3px 0 0', minHeight: m.expense > 0 ? 3 : 0 }} />
              </div>
              <span style={{ fontSize: 9, color: 'var(--text-subtle)' }}>{m.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Category breakdown */}
      {Object.keys(catBreakdown).length > 0 && (
        <Card style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>{de ? 'Ausgaben nach Kategorie' : 'Expenses by category'}</div>
          {Object.entries(catBreakdown).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 110, fontSize: 13, color: 'var(--text-muted)' }}>{catLabel(cat, de)}</div>
              <div style={{ flex: 1, height: 8, background: 'var(--bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(amt / totalExp) * 100}%`, background: 'var(--danger)', borderRadius: 4 }} />
              </div>
              <div style={{ width: 90, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right' }}>{fmt(amt, currency)}</div>
            </div>
          ))}
        </Card>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <Btn onClick={exportCSV}>⬇ {de ? 'CSV Export' : 'Export CSV'}</Btn>
      </div>
    </div>
  );
}

// ─── Tab: Settings ─────────────────────────────────────────────────────────────

// ─── Template item grid ────────────────────────────────────────────────────────
// ALL helper components must live at module level. Defining them inside a parent
// component causes React to unmount+remount them on every render, making every
// input lose focus as you type.

type GridItem = { description: string; quantity: string; unit_price: string };

function TemplateItemGrid({ items, onChange, onAdd, de }: {
  items: GridItem[];
  onChange: (items: GridItem[]) => void;
  onAdd: () => void;
  de: boolean;
}) {
  const rowStyle: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: '1fr 60px 80px 28px',
    borderTop: '1px solid var(--border)',
  };
  const cellStyle: React.CSSProperties = {
    padding: '8px 10px', fontSize: 13, background: 'none', border: 'none',
    color: 'var(--text-primary)', fontFamily: 'inherit', width: '100%',
    boxSizing: 'border-box', outline: 'none',
  };

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginTop: 8 }}>
      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 80px 28px' }}>
        {[de ? 'Beschreibung' : 'Description', de ? 'Menge' : 'Qty', de ? 'Preis' : 'Price', ''].map((h, i) => (
          <div key={i} style={{ padding: '6px 10px', fontSize: 11, color: 'var(--text-subtle)', background: 'var(--bg-tertiary)', fontWeight: 600 }}>{h}</div>
        ))}
      </div>

      {/* Rows */}
      {items.map((item, i) => (
        <div key={i} style={rowStyle}>
          <input
            value={item.description}
            placeholder={de ? 'Leistung...' : 'Service...'}
            onChange={e => onChange(items.map((it, j) => j === i ? { ...it, description: e.target.value } : it))}
            style={cellStyle}
          />
          <input
            value={item.quantity}
            type="number"
            min="0"
            onChange={e => onChange(items.map((it, j) => j === i ? { ...it, quantity: e.target.value } : it))}
            style={{ ...cellStyle, borderLeft: '1px solid var(--border)' }}
          />
          <input
            value={item.unit_price}
            type="number"
            min="0"
            step="0.05"
            placeholder="0.00"
            onChange={e => onChange(items.map((it, j) => j === i ? { ...it, unit_price: e.target.value } : it))}
            style={{ ...cellStyle, borderLeft: '1px solid var(--border)' }}
          />
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            style={{ background: 'none', border: 'none', borderLeft: '1px solid var(--border)', color: 'var(--danger)', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >×</button>
        </div>
      ))}

      {/* Add row */}
      <button
        onClick={onAdd}
        style={{ width: '100%', padding: '8px 10px', fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', borderTop: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
      >
        + {de ? 'Position hinzufügen' : 'Add item'}
      </button>
    </div>
  );
}

// Section must be defined OUTSIDE any component — defining it inside causes React
// to remount all children on every parent render, making inputs lose focus.
function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>{title}</div>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {children}
      </div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 12, color: 'var(--text-subtle)', display: 'block', marginBottom: 5, fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );
}

function SettingsInput({ value, onChange, type = 'text', placeholder }: { value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
        background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
        color: 'var(--text-primary)', fontFamily: 'inherit', boxSizing: 'border-box',
        outline: 'none',
      }}
    />
  );
}

function SettingsTextarea({ value, onChange, rows = 3, placeholder }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
        background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
        color: 'var(--text-primary)', fontFamily: 'inherit', resize: 'vertical',
        boxSizing: 'border-box', outline: 'none',
      }}
    />
  );
}

// ─── Templates Tab ─────────────────────────────────────────────────────────────

function TemplatesTab({ settings, de, accessToken, onSaved }: {
  settings: AccountingSettings | null; de: boolean; accessToken: string;
  onSaved: (templates: ItemTemplate[]) => void;
}) {
  const templates = settings?.item_templates ?? [];
  const [editIdx,   setEditIdx]   = useState<number | null>(null);
  const [editName,  setEditName]  = useState('');
  const [editItems, setEditItems] = useState<{ description: string; quantity: string; unit_price: string }[]>([]);
  const [newName,   setNewName]   = useState('');
  const [saving,    setSaving]    = useState(false);
  const [showNew,   setShowNew]   = useState(false);
  const [newItems,  setNewItems]  = useState([{ description: '', quantity: '1', unit_price: '' }]);

  async function persist(next: ItemTemplate[]) {
    setSaving(true);
    const res = await fetch('/api/accounting/settings', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_templates: next }),
    });
    if (res.ok) onSaved(next);
    setSaving(false);
  }

  function startEdit(idx: number) {
    const tpl = templates[idx];
    setEditIdx(idx);
    setEditName(tpl.name);
    setEditItems(tpl.items.map(it => ({ description: it.description, quantity: String(it.quantity), unit_price: String(it.unit_price) })));
  }

  async function saveEdit() {
    if (editIdx === null) return;
    const next = templates.map((tpl, i) => i === editIdx ? {
      name:  editName,
      items: editItems.filter(it => it.description).map(it => ({
        description: it.description,
        quantity:    parseFloat(it.quantity) || 1,
        unit_price:  parseFloat(it.unit_price) || 0,
      })),
    } : tpl);
    await persist(next);
    setEditIdx(null);
  }

  async function deleteTemplate(idx: number) {
    if (!confirm(de ? 'Vorlage löschen?' : 'Delete template?')) return;
    await persist(templates.filter((_, i) => i !== idx));
  }

  async function createTemplate() {
    if (!newName.trim()) return;
    const next: ItemTemplate[] = [...templates, {
      name:  newName.trim(),
      items: newItems.filter(it => it.description).map(it => ({
        description: it.description,
        quantity:    parseFloat(it.quantity) || 1,
        unit_price:  parseFloat(it.unit_price) || 0,
      })),
    }];
    await persist(next);
    setNewName('');
    setNewItems([{ description: '', quantity: '1', unit_price: '' }]);
    setShowNew(false);
  }

  return (
    <div style={{ maxWidth: 620 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
          {de ? 'Vorlagen werden im Rechnungsformular als Schnellauswahl angeboten.' : 'Templates appear as quick-select options when creating invoices.'}
        </p>
        <Btn variant="primary" onClick={() => setShowNew(s => !s)}>+ {de ? 'Neue Vorlage' : 'New template'}</Btn>
      </div>

      {/* New template form */}
      {showNew && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--accent)44', borderRadius: 12, padding: '16px 18px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>{de ? 'Neue Vorlage erstellen' : 'Create new template'}</div>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder={de ? 'Vorlagenname...' : 'Template name...'}
            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 4, outline: 'none' }} />
          <TemplateItemGrid de={de} items={newItems} onChange={setNewItems} onAdd={() => setNewItems(p => [...p, { description: '', quantity: '1', unit_price: '' }])} />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Btn onClick={() => setShowNew(false)}>{de ? 'Abbrechen' : 'Cancel'}</Btn>
            <Btn variant="primary" onClick={createTemplate} disabled={saving || !newName.trim()}>{saving ? '...' : (de ? 'Speichern' : 'Save')}</Btn>
          </div>
        </div>
      )}

      {templates.length === 0 && !showNew ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-subtle)', fontSize: 14 }}>
          {de ? 'Noch keine Vorlagen.' : 'No templates yet.'} <button onClick={() => setShowNew(true)} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>{de ? 'Erste erstellen' : 'Create first'}</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {templates.map((tpl, idx) => (
            <div key={idx} style={{ background: 'var(--bg-card)', border: `1px solid ${editIdx === idx ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{tpl.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 2 }}>{tpl.items.length} {de ? 'Position(en)' : 'item(s)'}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Btn onClick={() => editIdx === idx ? setEditIdx(null) : startEdit(idx)}>
                    {editIdx === idx ? (de ? 'Schliessen' : 'Close') : (de ? 'Bearbeiten' : 'Edit')}
                  </Btn>
                  <Btn variant="danger" onClick={() => deleteTemplate(idx)}>✕</Btn>
                </div>
              </div>
              {editIdx === idx && (
                <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ paddingTop: 14, marginBottom: 8 }}>
                    <input value={editName} onChange={e => setEditName(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <TemplateItemGrid de={de} items={editItems} onChange={setEditItems} onAdd={() => setEditItems(p => [...p, { description: '', quantity: '1', unit_price: '' }])} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <Btn onClick={() => setEditIdx(null)}>{de ? 'Abbrechen' : 'Cancel'}</Btn>
                    <Btn variant="primary" onClick={saveEdit} disabled={saving}>{saving ? '...' : (de ? 'Speichern' : 'Save')}</Btn>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Settings Tab ──────────────────────────────────────────────────────────────

function SettingsTab({ settings, de, accessToken, onSaved }: {
  settings: AccountingSettings | null; de: boolean; accessToken: string;
  onSaved: (s: AccountingSettings) => void;
}) {
  const def: AccountingSettings = {
    currency: 'CHF', tax_rate_default: 0, tax_number: null,
    invoice_prefix: 'RE', invoice_logo_url: null, invoice_footer_text: null,
    invoice_color: '#6366f1', payment_due_days: 30, skonto_percent: null, skonto_days: null,
    reminder1_enabled: true, reminder1_days_after_due: 7, reminder1_email_text: null,
    reminder2_enabled: false, reminder2_days_after_r1: 14, reminder2_email_text: null,
    email_auto_send: false, notification_email: null,
    item_templates: [],
    iban: null, creditor_name: null, creditor_street: null,
    creditor_postal_code: null, creditor_city: null, creditor_country: 'CH',
  };
  const [s, setS] = useState<AccountingSettings>(settings ?? def);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => { if (settings) setS(settings); }, [settings]);

  const upd = (key: keyof AccountingSettings, val: unknown) => setS(prev => ({ ...prev, [key]: val }));

  async function save() {
    setSaving(true);
    const res = await fetch('/api/accounting/settings', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(s),
    });
    if (res.ok) {
      const { settings: saved } = await res.json();
      onSaved(saved);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  }

  const templateVars = '{{client_name}}, {{betrag}}, {{faelligkeitsdatum}}, {{rechnungsnummer}}';

  return (
    <div style={{ maxWidth: 620 }}>

      <SettingsSection title={de ? 'Allgemein' : 'General'}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FieldRow label={de ? 'Währung' : 'Currency'}>
            <select value={s.currency} onChange={e => upd('currency', e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'inherit', cursor: 'pointer', boxSizing: 'border-box' }}>
              {['CHF', 'EUR', 'USD'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </FieldRow>
          <FieldRow label={de ? 'MwSt. Standard (%)' : 'Default tax rate (%)'}>
            <SettingsInput type="number" value={s.tax_rate_default} onChange={v => upd('tax_rate_default', parseFloat(v) || 0)} placeholder="0" />
          </FieldRow>
          <FieldRow label={de ? 'MwSt.-Nummer' : 'Tax number'}>
            <SettingsInput value={s.tax_number ?? ''} onChange={v => upd('tax_number', v || null)} placeholder="CHE-123.456.789" />
          </FieldRow>
          <FieldRow label={de ? 'Zahlungsziel (Tage)' : 'Payment due (days)'}>
            <SettingsInput type="number" value={s.payment_due_days} onChange={v => upd('payment_due_days', parseInt(v) || 30)} placeholder="30" />
          </FieldRow>
        </div>
      </SettingsSection>

      <SettingsSection title={de ? 'Rechnungsvorlage' : 'Invoice template'}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FieldRow label={de ? 'Rechnungspräfix' : 'Invoice prefix'}>
            <SettingsInput value={s.invoice_prefix} onChange={v => upd('invoice_prefix', v)} placeholder="RE" />
          </FieldRow>
          <FieldRow label={de ? 'Akzentfarbe' : 'Accent color'}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="color" value={s.invoice_color ?? '#6366f1'} onChange={e => upd('invoice_color', e.target.value)}
                style={{ width: 40, height: 38, borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', padding: 2 }} />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.invoice_color ?? '#6366f1'}</span>
            </div>
          </FieldRow>
        </div>
        <FieldRow label={de ? 'Fusszeile (auf Rechnungen)' : 'Footer text (on invoices)'}>
          <SettingsTextarea value={s.invoice_footer_text ?? ''} onChange={v => upd('invoice_footer_text', v || null)} rows={2} placeholder={de ? 'z.B. Bankverbindung, Steuernummer...' : 'e.g. bank details, tax number...'} />
        </FieldRow>
      </SettingsSection>

      <SettingsSection title={de ? 'E-Mail & Mahnwesen' : 'Email & Dunning'}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{de ? 'Automatisch senden' : 'Auto-send emails'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 2 }}>{de ? 'Mahnungen automatisch versenden' : 'Send reminders automatically'}</div>
          </div>
          <Toggle on={s.email_auto_send} onToggle={() => upd('email_auto_send', !s.email_auto_send)} />
        </div>
        <FieldRow label={de ? 'Benachrichtigungs-E-Mail' : 'Notification email'}>
          <SettingsInput type="email" value={s.notification_email ?? ''} onChange={v => upd('notification_email', v || null)} placeholder="you@example.com" />
        </FieldRow>
        <div style={{ fontSize: 11, color: 'var(--text-subtle)', background: 'var(--bg-tertiary)', borderRadius: 7, padding: '8px 12px' }}>
          {de ? 'Platzhalter:' : 'Placeholders:'} <code style={{ fontSize: 11 }}>{templateVars}</code>
        </div>

        {/* 1. Mahnung */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{de ? '1. Mahnung' : '1st reminder'}</div>
            <Toggle on={s.reminder1_enabled} onToggle={() => upd('reminder1_enabled', !s.reminder1_enabled)} />
          </div>
          {s.reminder1_enabled && <>
            <FieldRow label={de ? 'Tage nach Fälligkeit' : 'Days after due date'}>
              <SettingsInput type="number" value={s.reminder1_days_after_due} onChange={v => upd('reminder1_days_after_due', parseInt(v) || 7)} />
            </FieldRow>
            <FieldRow label={de ? 'E-Mail-Text' : 'Email text'}>
              <SettingsTextarea value={s.reminder1_email_text ?? ''} onChange={v => upd('reminder1_email_text', v || null)} rows={3} placeholder={de ? 'Leer lassen für Standardtext' : 'Leave empty for default text'} />
            </FieldRow>
          </>}
        </div>

        {/* 2. Mahnung */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{de ? '2. Mahnung' : '2nd reminder'}</div>
            <Toggle on={s.reminder2_enabled} onToggle={() => upd('reminder2_enabled', !s.reminder2_enabled)} />
          </div>
          {s.reminder2_enabled && <>
            <FieldRow label={de ? 'Tage nach 1. Mahnung' : 'Days after 1st reminder'}>
              <SettingsInput type="number" value={s.reminder2_days_after_r1} onChange={v => upd('reminder2_days_after_r1', parseInt(v) || 14)} />
            </FieldRow>
            <FieldRow label={de ? 'E-Mail-Text' : 'Email text'}>
              <SettingsTextarea value={s.reminder2_email_text ?? ''} onChange={v => upd('reminder2_email_text', v || null)} rows={3} placeholder={de ? 'Leer lassen für Standardtext' : 'Leave empty for default text'} />
            </FieldRow>
          </>}
        </div>
      </SettingsSection>

      <SettingsSection title={de ? 'QR-Rechnung (Swiss QR)' : 'QR Invoice (Swiss QR)'}>
        <p style={{ fontSize: 13, color: 'var(--text-subtle)', margin: 0, lineHeight: 1.6 }}>
          {de ? 'IBAN und Adresse eingeben → QR-Zahlteil wird automatisch auf jede Rechnung gedruckt. Kompatibel mit allen Schweizer Banken.' : 'Enter IBAN and address → QR payment slip is automatically printed on every invoice. Compatible with all Swiss banks.'}
        </p>
        <FieldRow label="IBAN">
          <SettingsInput value={s.iban ?? ''} onChange={v => upd('iban', v || null)} placeholder="CH56 0483 5012 3456 7800 9" />
        </FieldRow>
        <FieldRow label={de ? 'Name / Firma' : 'Name / Company'}>
          <SettingsInput value={s.creditor_name ?? ''} onChange={v => upd('creditor_name', v || null)} placeholder={de ? 'Max Muster Personal Training' : 'Max Muster Personal Training'} />
        </FieldRow>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FieldRow label={de ? 'Strasse & Nr.' : 'Street & No.'}>
            <SettingsInput value={s.creditor_street ?? ''} onChange={v => upd('creditor_street', v || null)} placeholder="Musterstrasse 1" />
          </FieldRow>
          <FieldRow label={de ? 'PLZ' : 'Postal code'}>
            <SettingsInput value={s.creditor_postal_code ?? ''} onChange={v => upd('creditor_postal_code', v || null)} placeholder="3000" />
          </FieldRow>
          <FieldRow label={de ? 'Ort' : 'City'}>
            <SettingsInput value={s.creditor_city ?? ''} onChange={v => upd('creditor_city', v || null)} placeholder="Bern" />
          </FieldRow>
          <FieldRow label={de ? 'Land' : 'Country'}>
            <select value={s.creditor_country ?? 'CH'} onChange={e => upd('creditor_country', e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'inherit', cursor: 'pointer', boxSizing: 'border-box' }}>
              {[['CH','Schweiz (CH)'],['LI','Liechtenstein (LI)'],['DE','Deutschland (DE)'],['AT','Österreich (AT)']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </FieldRow>
        </div>
        {s.iban && s.creditor_name && (
          <div style={{ fontSize: 12, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}>
            ✓ {de ? 'QR-Zahlteil wird auf Rechnungen angehängt' : 'QR payment slip will be appended to invoices'}
          </div>
        )}
      </SettingsSection>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingBottom: 40 }}>
        <Btn variant="primary" onClick={save} disabled={saving}>{saving ? '...' : (de ? 'Einstellungen speichern' : 'Save settings')}</Btn>
        {saved && <span style={{ fontSize: 13, color: 'var(--success)' }}>✓ {de ? 'Gespeichert' : 'Saved'}</span>}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type AccountingTab = 'invoices' | 'income' | 'expenses' | 'reports' | 'settings' | 'templates';

export default function AccountingPage() {
  const { lang } = useTranslation();
  const de = lang === 'de';

  const [tab,        setTab]        = useState<AccountingTab>('invoices');
  const [invoices,   setInvoices]   = useState<Invoice[]>([]);
  const [expenses,   setExpenses]   = useState<ExpenseEntry[]>([]);
  const [settings,   setSettings]   = useState<AccountingSettings | null>(null);
  const [clients,    setClients]    = useState<ClientShape[]>([]);
  const [ptProfile,  setPtProfile]  = useState<{ name: string | null; email: string | null } | null>(null);
  const [accessToken, setAccessToken] = useState<string>('');
  const [ptId,       setPtId]       = useState<string>('');
  const [loading,    setLoading]    = useState(true);
  const [showNew,    setShowNew]    = useState(false);
  const cronRan = useRef(false);

  const currency = settings?.currency ?? 'CHF';

  // Open new-invoice modal when navigated here with ?new=1
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('new=1')) {
      setShowNew(true);
      window.history.replaceState({}, '', '/accounting');
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setLoading(false); return; }
      const token = session.access_token;
      setAccessToken(token);
      setPtId(session.user.id);

      const headers = { Authorization: `Bearer ${token}` };

      const [invRes, expRes, setRes] = await Promise.all([
        fetch('/api/accounting/invoices', { headers }),
        fetch('/api/accounting/expenses', { headers }),
        fetch('/api/accounting/settings', { headers }),
      ]);

      const [invJson, expJson, setJson] = await Promise.all([
        invRes.json(), expRes.json(), setRes.json(),
      ]);

      setInvoices(invJson.invoices ?? []);
      setExpenses(expJson.expenses ?? []);
      setSettings(setJson.settings ?? null);

      // Load clients (two-step, same pattern as calendar page) and PT profile
      const supabaseClient = createClient();
      const [{ data: trainerClients }, { data: ptProfileData }] = await Promise.all([
        supabaseClient
          .from('trainer_clients')
          .select('client_id')
          .eq('trainer_id', session.user.id)
          .eq('status', 'active'),
        supabaseClient
          .from('profiles')
          .select('display_name, first_name, last_name')
          .eq('id', session.user.id)
          .single(),
      ]);

      const clientIds = (trainerClients ?? []).map((r: { client_id: string }) => r.client_id);
      if (clientIds.length > 0) {
        const { data: profiles } = await supabaseClient
          .from('profiles')
          .select('id, display_name, first_name, last_name, email')
          .in('id', clientIds);
        setClients(
          (profiles ?? []).map((p: { id: string; display_name: string | null; first_name: string | null; last_name: string | null; email: string | null }) => ({
            id:    p.id,
            name:  p.display_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || p.id,
            email: p.email,
          }))
        );
      }

      const ptName = ptProfileData
        ? ptProfileData.display_name || [ptProfileData.first_name, ptProfileData.last_name].filter(Boolean).join(' ') || null
        : null;
      setPtProfile({ name: ptName, email: session.user.email ?? null });

      setLoading(false);

      // Run cron once per page load
      if (!cronRan.current) {
        cronRan.current = true;
        fetch('/api/accounting/cron', { method: 'POST', headers });
      }
    });
  }, []);

  const openInvoices = invoices.filter(i => ['sent', 'overdue', 'reminder1', 'reminder2'].includes(i.status));
  const overdueInvoices = invoices.filter(i => ['overdue', 'reminder1', 'reminder2'].includes(i.status));
  const paidThisMonth = invoices.filter(i => {
    if (i.status !== 'paid') return false;
    const d = new Date(i.paid_at ?? i.issue_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const paidThisMonthTotal = paidThisMonth.reduce((s, i) => s + i.total, 0);
  const totalExpensesThisMonth = expenses.filter(e => {
    const d = new Date(e.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, e) => s + e.amount, 0);

  const stats = [
    { label: de ? 'Offen'        : 'Open',         value: fmt(openInvoices.reduce((s, i) => s + i.total, 0), currency), color: '#3b82f6', count: openInvoices.length },
    { label: de ? 'Überfällig'   : 'Overdue',       value: fmt(overdueInvoices.reduce((s, i) => s + i.total, 0), currency), color: 'var(--danger)', count: overdueInvoices.length },
    { label: de ? 'Umsatz (M)'   : 'Revenue (M)',   value: fmt(paidThisMonthTotal, currency), color: 'var(--success)', count: null },
    { label: de ? 'Ausgaben (M)' : 'Expenses (M)',  value: fmt(totalExpensesThisMonth, currency), color: 'var(--warning)', count: null },
  ];

  const tabs: { key: AccountingTab; label: string }[] = [
    { key: 'invoices',   label: de ? 'Rechnungen'    : 'Invoices'   },
    { key: 'income',     label: de ? 'Einnahmen'     : 'Income'     },
    { key: 'expenses',   label: de ? 'Ausgaben'      : 'Expenses'   },
    { key: 'reports',    label: de ? 'Berichte'      : 'Reports'    },
    { key: 'templates',  label: de ? 'Vorlagen'      : 'Templates'  },
    { key: 'settings',   label: de ? 'Einstellungen' : 'Settings'   },
  ];

  return (
    <PageShell
      title={de ? 'Buchhaltung' : 'Accounting'}
      subtitle={de ? 'Rechnungen, Ausgaben und Berichte.' : 'Invoices, expenses and reports.'}
      action={tab === 'invoices'
        ? <Btn variant="primary" onClick={() => setShowNew(true)}>+ {de ? 'Rechnung erstellen' : 'New invoice'}</Btn>
        : tab === 'expenses'
          ? <Btn variant="primary" onClick={() => {}}>+ {de ? 'Ausgabe' : 'Expense'}</Btn>
          : undefined
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-subtle)' }}>…</div>
      ) : (
        <>
          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
            {stats.map(card => (
              <Card key={card.label} style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: card.color, marginBottom: 3 }}>
                  {card.value}
                  {card.count !== null && card.count > 0 && <span style={{ fontSize: 14, marginLeft: 6, opacity: 0.7 }}>({card.count})</span>}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{card.label}</div>
              </Card>
            ))}
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: '9px 18px', fontSize: 14, fontWeight: tab === t.key ? 600 : 400,
                color: tab === t.key ? 'var(--accent)' : 'var(--text-muted)',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: `2px solid ${tab === t.key ? 'var(--accent)' : 'transparent'}`,
                marginBottom: -1, fontFamily: 'inherit',
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === 'invoices'  && <InvoicesTab invoices={invoices} de={de} settings={settings} clients={clients} accessToken={accessToken} ptProfile={ptProfile} onUpdated={inv => setInvoices(prev => prev.map(i => i.id === inv.id ? inv : i))} onDeleted={id => setInvoices(prev => prev.filter(i => i.id !== id))} onAdd={() => setShowNew(true)} />}
          {tab === 'income'    && <IncomeTab invoices={invoices} de={de} settings={settings} />}
          {tab === 'expenses'  && <ExpensesTab expenses={expenses} de={de} settings={settings} accessToken={accessToken} ptId={ptId} onCreated={exp => setExpenses(prev => [exp, ...prev])} onUpdated={exp => setExpenses(prev => prev.map(e => e.id === exp.id ? exp : e))} onDeleted={id => setExpenses(prev => prev.filter(e => e.id !== id))} />}
          {tab === 'reports'   && <ReportsTab invoices={invoices} expenses={expenses} de={de} settings={settings} />}
          {tab === 'templates' && <TemplatesTab settings={settings} de={de} accessToken={accessToken} onSaved={templates => setSettings(prev => prev ? { ...prev, item_templates: templates } : prev)} />}
          {tab === 'settings'  && <SettingsTab settings={settings} de={de} accessToken={accessToken} onSaved={setSettings} />}
        </>
      )}

      {showNew && (
        <NewInvoiceModal
          de={de} clients={clients} settings={settings} accessToken={accessToken}
          onCreated={inv => setInvoices(prev => [inv, ...prev])}
          onClose={() => setShowNew(false)}
          onTemplatesSaved={templates => setSettings(prev => prev ? { ...prev, item_templates: templates } : prev)}
        />
      )}
    </PageShell>
  );
}
