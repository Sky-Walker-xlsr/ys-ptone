'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sidebar } from '@/components/Sidebar';
import { useTranslation } from '@/locales/index';
import { dashboard } from '@/locales/dashboard.strings';

// ─── Types ────────────────────────────────────────────────────────────────────

type CardType = 'quick-actions' | 'appointments-list' | 'journal-list' | 'clients-list' | 'recent-invoices';

interface Card { id: string; type: CardType; x: number; y: number; w: number; h: number; }

interface Client { id: string; client_id: string; name: string; }

interface DashData {
  clients: Client[];
  openCount: number; openTotal: number;
  monthRevenue: number; currency: string;
  upcomingCount: number;
  appointments: { id: string; title: string; start_at: string; end_at: string }[];
  journals: { id: string; client_name: string; week_label: string; submitted_at: string }[];
  invoices: { id: string; invoice_number: string; title: string; status: string; total: number }[];
}

// ─── Grid / collision ─────────────────────────────────────────────────────────

const STEP = 50;
const snap = (v: number) => Math.round(v / STEP) * STEP;
const MIN_W = 200; const MIN_H = 120; const MAX_H = 400;
// MAX_W is always half the container width — computed dynamically per card

function hits(a: { x: number; y: number; w: number; h: number }, b: Card) {
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
}

// ─── Persistence ──────────────────────────────────────────────────────────────

const KEY = 'ptone_dash_v5';

function defaultCards(cw: number): Card[] {
  const h = snap(Math.floor((cw - STEP) / 2));
  const c2 = h + STEP;
  return [
    { id: 'qa', type: 'quick-actions',    x: 0,  y: 0,   w: h,  h: 200 },
    { id: 'al', type: 'appointments-list',x: c2, y: 0,   w: h,  h: 350 },
    { id: 'cl', type: 'clients-list',     x: 0,  y: 250, w: h,  h: 300 },
    { id: 'ri', type: 'recent-invoices',  x: c2, y: 400, w: h,  h: 250 },
    { id: 'jl', type: 'journal-list',     x: 0,  y: 600, w: h,  h: 250 },
  ];
}

function load(cw: number): Card[] {
  try { const r = localStorage.getItem(KEY); if (r) return JSON.parse(r); } catch (_) {}
  return defaultCards(cw);
}

function save(cards: Card[]) {
  try { localStorage.setItem(KEY, JSON.stringify(cards)); } catch (_) {}
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(s: Record<string, string>) {
  const h = new Date().getHours();
  return h < 12 ? s.greeting : h < 18 ? s.greetingAfternoon : s.greetingEvening;
}
const fmtCur = (n: number, cur = 'CHF') => `${cur} ${n.toFixed(2)}`;
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
const fmtDate = (iso: string, de: boolean) => new Date(iso).toLocaleDateString(de ? 'de-CH' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
const initials = (n: string) => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const STATUS_COLOR: Record<string, string> = {
  draft: 'var(--text-subtle)', sent: '#3b82f6', overdue: 'var(--danger)',
  reminder1: '#9333ea', reminder2: '#92400e', paid: 'var(--success)', cancelled: 'var(--text-subtle)',
};

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, color, href }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string; href?: string }) {
  const body = (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, height: '100%', boxSizing: 'border-box' }}>
      <div style={{ width: 40, height: 40, borderRadius: 9, background: `${color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>{value}</div>
        {sub && <div style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 1 }}>{sub}</div>}
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
  return href ? <a href={href} style={{ textDecoration: 'none' }}>{body}</a> : body;
}

// ─── Appointment modal ────────────────────────────────────────────────────────

const fieldStyle: React.CSSProperties = { width: '100%', padding: '8px 11px', borderRadius: 7, fontSize: 13, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };
const labelStyle: React.CSSProperties = { fontSize: 11, color: 'var(--text-subtle)', display: 'block', marginBottom: 3, fontWeight: 500 };

function ApptModal({ de, clients, token, onClose }: { de: boolean; clients: Client[]; token: string; onClose: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState('');
  const [clientQ, setClientQ] = useState('');
  const [clientOpen, setClientOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [date, setDate] = useState(today);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('10:00');
  const [saving, setSaving] = useState(false);

  const filtered = clients.filter(c => !clientQ || c.name.toLowerCase().includes(clientQ.toLowerCase()));

  async function submit() {
    if (!title) return; setSaving(true);
    const s = `${date}T${start}:00`; const e = `${date}T${end}:00`;
    const res = await fetch('/api/google/event', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ summary: title, start: s, end: e, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, calendarId: 'primary', clientId: selectedClient?.client_id ?? null }) });
    if (!res.ok) {
      const sb = createClient(); const { data: { session } } = await sb.auth.getSession();
      if (session) await sb.from('appointments').insert({ pt_id: session.user.id, client_id: selectedClient?.client_id ?? null, title, start_at: s, end_at: e });
    }
    setSaving(false); onClose();
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, width: '100%', maxWidth: 420, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{de ? 'Termin erstellen' : 'New appointment'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)' }}>×</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          <div><label style={labelStyle}>{de ? 'Titel *' : 'Title *'}</label><input value={title} onChange={e => setTitle(e.target.value)} style={fieldStyle} autoFocus /></div>
          <div><label style={labelStyle}>{de ? 'Datum' : 'Date'}</label><input type="date" value={date} onChange={e => setDate(e.target.value)} style={fieldStyle} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={labelStyle}>{de ? 'Start' : 'Start'}</label><input type="time" value={start} onChange={e => setStart(e.target.value)} style={fieldStyle} /></div>
            <div><label style={labelStyle}>{de ? 'Ende' : 'End'}</label><input type="time" value={end} onChange={e => setEnd(e.target.value)} style={fieldStyle} /></div>
          </div>
          {clients.length > 0 && (
            <div style={{ position: 'relative' }}>
              <label style={labelStyle}>Client</label>
              <input value={selectedClient ? selectedClient.name : clientQ} onChange={e => { setClientQ(e.target.value); setSelectedClient(null); setClientOpen(true); }} onFocus={() => setClientOpen(true)} onBlur={() => setTimeout(() => setClientOpen(false), 150)} placeholder={de ? 'Suchen...' : 'Search...'} style={fieldStyle} />
              {clientOpen && !selectedClient && filtered.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, maxHeight: 150, overflowY: 'auto', marginTop: 2 }}>
                  {filtered.map(c => <div key={c.id} onMouseDown={() => { setSelectedClient(c); setClientQ(''); setClientOpen(false); }} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>{c.name}</div>)}
                </div>
              )}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button onClick={onClose} style={{ padding: '8px 14px', borderRadius: 7, fontSize: 13, fontWeight: 500, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>{de ? 'Abbrechen' : 'Cancel'}</button>
            <button onClick={submit} disabled={saving || !title} style={{ padding: '8px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600, background: '#3b82f6', border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', opacity: !title ? 0.5 : 1 }}>{saving ? '...' : (de ? 'Erstellen' : 'Create')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Card content ─────────────────────────────────────────────────────────────

function QuickActions({ de, onAppt }: { de: boolean; onAppt: () => void }) {
  const btn = (label: string, color: string, onClick: () => void) => (
    <button onClick={onClick} style={{ width: '100%', padding: '9px', borderRadius: 7, fontSize: 13, fontWeight: 600, background: color, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>{label}</button>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {btn(`💰 ${de ? 'Rechnung erstellen' : 'New invoice'}`, 'var(--accent)', () => { window.location.href = '/accounting?new=1'; })}
      {btn(`📅 ${de ? 'Termin erstellen' : 'New appointment'}`, '#3b82f6', onAppt)}
      {btn(`👤 ${de ? 'Client einladen' : 'Invite client'}`, '#8b5cf6', () => { window.location.href = '/clients?new=1'; })}
    </div>
  );
}

function AppointmentsList({ data, de }: { data: DashData; de: boolean }) {
  if (!data.appointments.length) return <p style={{ fontSize: 13, color: 'var(--text-subtle)', textAlign: 'center', paddingTop: 24 }}>{de ? 'Keine Termine.' : 'No appointments.'}</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.appointments.map(a => (
        <div key={a.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 10px', background: 'var(--bg-tertiary)', borderRadius: 9 }}>
          <div style={{ flexShrink: 0, width: 36, textAlign: 'center', background: 'var(--accent-muted)', borderRadius: 7, padding: '4px 0' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{new Date(a.start_at).getDate()}</div>
            <div style={{ fontSize: 8, color: 'var(--accent)', textTransform: 'uppercase' }}>{new Date(a.start_at).toLocaleDateString(de ? 'de-CH' : 'en-GB', { month: 'short' })}</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{fmtTime(a.start_at)} – {fmtTime(a.end_at)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function JournalList({ data, de }: { data: DashData; de: boolean }) {
  if (!data.journals.length) return <p style={{ fontSize: 13, color: 'var(--text-subtle)', textAlign: 'center', paddingTop: 24 }}>{de ? 'Keine Einreichungen.' : 'No submissions.'}</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {data.journals.map(j => (
        <div key={j.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg-tertiary)', borderRadius: 9 }}>
          <div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{j.client_name}</div><div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{j.week_label}</div></div>
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', flexShrink: 0 }}>{fmtDate(j.submitted_at, de)}</div>
        </div>
      ))}
    </div>
  );
}

function ClientsList({ data, de }: { data: DashData; de: boolean }) {
  const [q, setQ] = useState('');
  const list = q ? data.clients.filter(c => c.name.toLowerCase().includes(q.toLowerCase())) : data.clients;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ position: 'relative' }}>
        <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder={de ? 'Suchen...' : 'Search...'} style={{ ...fieldStyle, paddingLeft: 26 }} />
      </div>
      {list.length === 0 ? <p style={{ fontSize: 13, color: 'var(--text-subtle)', textAlign: 'center', paddingTop: 16 }}>{data.clients.length === 0 ? (de ? 'Noch keine Clients.' : 'No clients yet.') : (de ? 'Nichts gefunden.' : 'Not found.')}</p>
        : list.map(c => (
          <a key={c.id} href={`/clients/${c.client_id}`} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 8, background: 'var(--bg-tertiary)', textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>{initials(c.name)}</div>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{c.name}</span>
          </a>
        ))
      }
    </div>
  );
}

function InvoicesList({ data, de }: { data: DashData; de: boolean }) {
  if (!data.invoices.length) return <p style={{ fontSize: 13, color: 'var(--text-subtle)', textAlign: 'center', paddingTop: 24 }}>{de ? 'Keine Rechnungen.' : 'No invoices.'}</p>;
  return (
    <div>
      {data.invoices.map((inv, i) => (
        <a key={inv.id} href="/accounting" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none', textDecoration: 'none' }}>
          <div style={{ minWidth: 0, marginRight: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.title || inv.invoice_number}</div>
            <div style={{ fontSize: 10, color: 'var(--text-subtle)' }}>{inv.invoice_number}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: `${STATUS_COLOR[inv.status] ?? 'var(--border)'}22`, color: STATUS_COLOR[inv.status] ?? 'var(--text-subtle)', fontWeight: 600 }}>{inv.status}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{fmtCur(inv.total, data.currency)}</span>
          </div>
        </a>
      ))}
    </div>
  );
}

// ─── Dashboard card (NO local position/size state — all in parent) ─────────────

const CARD_TITLE: Record<CardType, [string, string]> = {
  'quick-actions':    ['Schnellaktionen', 'Quick actions'],
  'appointments-list':['Termine',         'Upcoming'],
  'journal-list':     ['Journal',         'Journal'],
  'clients-list':     ['Clients',         'Clients'],
  'recent-invoices':  ['Rechnungen',      'Invoices'],
};
const CARD_HREF: Partial<Record<CardType, string>> = {
  'appointments-list': '/calendar',
  'journal-list':      '/journal',
  'clients-list':      '/clients',
  'recent-invoices':   '/accounting',
};

interface CardProps {
  card: Card;
  data: DashData;
  de: boolean;
  isEditing: boolean;
  token: string;
  others: Card[];
  zIndex: number;
  containerW: number;
  onAppt: () => void;
  onRemove: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, w: number, h: number) => void;
}

function DashCard({ card, data, de, isEditing, token, others, zIndex, containerW, onAppt, onRemove, onMove, onResize }: CardProps) {
  const isDraggingRef = useRef(false);

  function startMove(e: React.MouseEvent) {
    if (!isEditing) return;
    if ((e.target as HTMLElement).closest('button,input,a,textarea,select')) return;
    e.preventDefault();
    const ox = e.clientX - card.x;
    const oy = e.clientY - card.y;
    let lx = card.x, ly = card.y;
    isDraggingRef.current = true;

    function mm(ev: MouseEvent) {
      const nx = snap(Math.min(containerW - card.w, Math.max(0, ev.clientX - ox)));
      const ny = snap(Math.max(0, ev.clientY - oy)); // bottom is unlimited
      const blocked = others.some(o => hits({ x: nx, y: ny, w: card.w, h: card.h }, o));
      if (!blocked) { lx = nx; ly = ny; onMove(card.id, nx, ny); }
    }
    function mu() {
      onMove(card.id, lx, ly);
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mouseup', mu);
    }
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);
  }

  function startResize(e: React.MouseEvent) {
    if (!isEditing) return;
    e.preventDefault(); e.stopPropagation();
    const sx = e.clientX, sy = e.clientY, sw = card.w, sh = card.h;
    let lw = sw, lh = sh;

    function mm(ev: MouseEvent) {
      // Right edge = screen edge; bottom is unlimited
      const nw = snap(Math.min(containerW - card.x, Math.max(MIN_W, sw + ev.clientX - sx)));
      const nh = snap(Math.min(MAX_H, Math.max(MIN_H, sh + ev.clientY - sy)));
      const blocked = others.some(o => hits({ x: card.x, y: card.y, w: nw, h: nh }, o));
      if (!blocked) { lw = nw; lh = nh; onResize(card.id, nw, nh); }
    }
    function mu() {
      onResize(card.id, lw, lh);
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mouseup', mu);
    }
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);
  }

  const [de_title, en_title] = CARD_TITLE[card.type];
  const href = CARD_HREF[card.type];

  return (
    <div style={{ position: 'absolute', left: card.x, top: card.y, width: card.w, height: card.h, zIndex, padding: 5, boxSizing: 'border-box' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 13, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.10)' }}>

        {/* Header — drag zone */}
        <div onMouseDown={startMove} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', borderBottom: '1px solid var(--border)', cursor: isEditing ? 'grab' : 'default', flexShrink: 0, userSelect: 'none' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{de ? de_title : en_title}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {href && <a href={href} onClick={e => e.stopPropagation()} style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}>{de ? 'Alle →' : 'All →'}</a>}
            {isEditing && <button onClick={e => { e.stopPropagation(); onRemove(card.id); }} style={{ width: 19, height: 19, borderRadius: '50%', background: 'var(--danger)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>}
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
          {card.type === 'quick-actions'    && <QuickActions de={de} onAppt={onAppt} />}
          {card.type === 'appointments-list'&& <AppointmentsList data={data} de={de} />}
          {card.type === 'journal-list'     && <JournalList data={data} de={de} />}
          {card.type === 'clients-list'     && <ClientsList data={data} de={de} />}
          {card.type === 'recent-invoices'  && <InvoicesList data={data} de={de} />}
        </div>

        {/* Resize handle — invisible grab zone, no visual triangle */}
        {isEditing && <div onMouseDown={startResize} style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, cursor: 'nwse-resize' }} />}
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const s = t(dashboard); const de = lang === 'de';

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('PT');
  const [data, setData] = useState<DashData>({ clients: [], openCount: 0, openTotal: 0, monthRevenue: 0, currency: 'CHF', upcomingCount: 0, appointments: [], journals: [], invoices: [] });
  const [cards, setCards] = useState<Card[]>([]);
  const [zOrder, setZOrder] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [showAppt, setShowAppt] = useState(false);
  const [token, setToken] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(1100);

  // ── Compute right boundary from window + CSS sidebar var ──────────────────
  // This is always correct: windowWidth - sidebarWidth - leftPadding(36).
  // At maximum card x + w = containerW → viewport right edge = windowWidth. ✓
  function computeW(): number {
    if (typeof window === 'undefined') return 1100;
    const raw   = getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width').trim();
    const sbW   = parseFloat(raw) || 240;
    return Math.floor(window.innerWidth - sbW - 72); // 72 = main left+right padding (36+36)
  }

  // ── Persist ────────────────────────────────────────────────────────────────
  function setAndSave(next: Card[]) { setCards(next); save(next); }

  function onMove(id: string, x: number, y: number) {
    setCards(prev => {
      const next = prev.map(c => c.id === id ? { ...c, x, y } : c);
      save(next); return next;
    });
  }

  function onResize(id: string, w: number, h: number) {
    setCards(prev => {
      const next = prev.map(c => c.id === id ? { ...c, w, h } : c);
      save(next); return next;
    });
  }

  function removeCard(id: string) {
    setAndSave(cards.filter(c => c.id !== id));
    setZOrder(p => p.filter(i => i !== id));
  }

  function addCard(type: CardType) {
    const id = `${type}-${Date.now()}`;
    const newCard: Card = { id, type, x: 0, y: 0, w: snap(400), h: type === 'quick-actions' ? 200 : 280 };
    setAndSave([...cards, newCard]);
    setZOrder(p => [...p, id]);
    setShowCatalog(false);
  }

  function bringToFront(id: string) {
    setZOrder(p => [...p.filter(i => i !== id), id]);
  }

  // ── Keep containerW in sync with window size + sidebar width changes ──────
  useEffect(() => {
    const update = () => setContainerW(computeW());
    update();
    window.addEventListener('resize', update);

    // Watch --sidebar-width CSS var changes (sidebar collapse/expand)
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });

    return () => { window.removeEventListener('resize', update); mo.disconnect(); };
  }, []);

  // ── Load saved cards on mount ───────────────────────────────────────────────
  useEffect(() => {
    const loaded = load(computeW());
    setCards(loaded);
    setZOrder(loaded.map(c => c.id));
  }, []);

  useEffect(() => {
    async function init() {
      const sb = createClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) { router.replace('/login'); return; }
      const uid = session.user.id;
      setToken(session.access_token);

      const [profRes, tcRes, invRes, appRes, setRes, jRes] = await Promise.all([
        sb.from('profiles').select('first_name,display_name').eq('id', uid).single(),
        sb.from('trainer_clients').select('id,client_id').eq('trainer_id', uid).eq('status', 'active'),
        sb.from('invoices').select('id,status,total,paid_at,invoice_number,title').eq('pt_id', uid).order('created_at', { ascending: false }).limit(20),
        sb.from('appointments').select('id,title,start_at,end_at').eq('pt_id', uid).gte('start_at', new Date().toISOString()).order('start_at').limit(5),
        sb.from('accounting_settings').select('currency').eq('pt_id', uid).maybeSingle(),
        sb.from('journal_entries').select('id,week_label,submitted_at,profiles!journal_entries_client_id_fkey(display_name,first_name,last_name)').eq('pt_id', uid).not('submitted_at', 'is', null).order('submitted_at', { ascending: false }).limit(6),
      ]);

      const p = profRes.data;
      setName(p ? (p.display_name || p.first_name || 'PT') : 'PT');

      const tcRows = (tcRes.data ?? []) as { id: string; client_id: string }[];
      let clients: Client[] = [];
      if (tcRows.length > 0) {
        const { data: profs } = await sb.from('profiles').select('id,display_name,first_name,last_name').in('id', tcRows.map(r => r.client_id));
        const pm = new Map((profs ?? []).map((pr: { id: string; display_name: string | null; first_name: string | null; last_name: string | null }) => [pr.id, pr]));
        clients = tcRows.map(tc => { const pr = pm.get(tc.client_id); return { id: tc.id, client_id: tc.client_id, name: pr ? (pr.display_name || [pr.first_name, pr.last_name].filter(Boolean).join(' ') || tc.client_id) : tc.client_id }; });
      }

      const cur = setRes.data?.currency ?? 'CHF';
      const allInv = (invRes.data ?? []) as { id: string; status: string; total: number; paid_at: string | null; invoice_number: string; title: string }[];
      const ms = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const open = allInv.filter(i => ['sent','overdue','reminder1','reminder2'].includes(i.status));

      const journals = (jRes.data ?? []).map((j: unknown) => {
        const r = j as { id: string; week_label: string; submitted_at: string; profiles: unknown };
        const pr = (Array.isArray(r.profiles) ? r.profiles[0] : r.profiles) as { display_name: string | null; first_name: string | null; last_name: string | null } | null;
        return { id: r.id, client_name: pr ? (pr.display_name || [pr.first_name, pr.last_name].filter(Boolean).join(' ') || '?') : '?', week_label: r.week_label, submitted_at: r.submitted_at };
      });

      setData({ clients, openCount: open.length, openTotal: open.reduce((s, i) => s + (i.total ?? 0), 0), monthRevenue: allInv.filter(i => i.status === 'paid' && i.paid_at && i.paid_at >= ms).reduce((s, i) => s + (i.total ?? 0), 0), currency: cur, upcomingCount: (appRes.data ?? []).length, appointments: (appRes.data ?? []) as DashData['appointments'], journals, invoices: allInv.slice(0, 6) });
      setLoading(false);
    }
    init();
  }, [router]);

  const existing = new Set(cards.map(c => c.type));
  const catalog = (['quick-actions','appointments-list','journal-list','clients-list','recent-invoices'] as CardType[]).filter(t => !existing.has(t));
  const canvasH = Math.max(500, ...cards.map(c => c.y + c.h + 60));

  const stats = [
    { label: s.activeClients, value: data.clients.length, color: 'var(--accent)', href: '/clients', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { label: s.openInvoices, value: data.openCount, sub: data.openCount > 0 ? fmtCur(data.openTotal, data.currency) : undefined, color: 'var(--warning)', href: '/accounting', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
    { label: s.monthlyRevenue, value: fmtCur(data.monthRevenue, data.currency), color: 'var(--success)', href: '/accounting', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
    { label: s.upcomingAppointments, value: data.upcomingCount, color: '#3b82f6', href: '/calendar', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  ];

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border-strong)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 'var(--sidebar-width)', padding: '28px 36px 80px', minHeight: '100vh', transition: 'margin-left 0.2s ease' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{getGreeting(s)}, {name} 👋</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{new Date().toLocaleDateString(de ? 'de-CH' : 'en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <button
            onClick={() => setIsEditing(e => !e)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: isEditing ? 'var(--success)' : 'var(--bg-card)', color: isEditing ? '#fff' : 'var(--text-muted)', border: `1px solid ${isEditing ? 'var(--success)' : 'var(--border)'}`, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {isEditing ? `✓ ${de ? 'Fertig' : 'Done'}` : `✎ ${de ? 'Bearbeiten' : 'Edit'}`}
          </button>
        </div>

        {/* Stat row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {stats.map(st => <StatCard key={st.label} label={st.label} value={st.value} sub={'sub' in st ? st.sub : undefined} icon={st.icon} color={st.color} href={st.href} />)}
        </div>

        {/* Edit hint */}
        {isEditing && <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px dashed var(--accent)66', borderRadius: 8, padding: '6px 14px', marginBottom: 16, fontSize: 12, color: 'var(--accent)' }}>{de ? 'Header ziehen zum Verschieben · Ecke ziehen zum Skalieren (50px Raster, max 400px) · × zum Entfernen' : 'Drag header to move · Drag corner to resize (50px grid, max 400px) · × to remove'}</div>}

        {/* Free canvas */}
        <div style={{ position: 'relative', width: '100%', minHeight: canvasH }}>
          {cards.map(card => (
            <DashCard
              key={card.id}
              card={card}
              data={data}
              de={de}
              isEditing={isEditing}
              token={token}
              others={cards.filter(c => c.id !== card.id)}
              zIndex={zOrder.indexOf(card.id) + 1}
              containerW={containerW}
              onAppt={() => setShowAppt(true)}
              onRemove={removeCard}
              onMove={(id, x, y) => { bringToFront(id); onMove(id, x, y); }}
              onResize={onResize}
            />
          ))}
        </div>
      </main>

      {/* + FAB */}
      {catalog.length > 0 && (
        <button onClick={() => setShowCatalog(true)} style={{ position: 'fixed', bottom: 28, right: 28, width: 46, height: 46, borderRadius: '50%', background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 22, boxShadow: '0 4px 16px rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>+</button>
      )}

      {/* Catalog panel */}
      {showCatalog && (
        <div onClick={e => { if (e.target === e.currentTarget) setShowCatalog(false); }} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: 24 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, width: 260 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{de ? 'Karte hinzufügen' : 'Add card'}</span>
              <button onClick={() => setShowCatalog(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {catalog.map(type => {
                const [deLbl, enLbl] = CARD_TITLE[type];
                return (
                  <button key={type} onClick={() => addCard(type)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-tertiary)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{de ? deLbl : enLbl}</span>
                    <span style={{ color: 'var(--accent)', fontSize: 16 }}>+</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showAppt && <ApptModal de={de} clients={data.clients} token={token} onClose={() => setShowAppt(false)} />}
    </div>
  );
}
