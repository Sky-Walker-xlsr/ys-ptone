'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageShell } from '@/components/PageShell';
import { useTranslation } from '@/locales';
import { dashboard } from '@/locales/dashboard.strings';
import { createClient } from '@/lib/supabase/client';
import type { GCalEvent, GCalCalendar } from '@/lib/google/calendar';

// ── Locale ────────────────────────────────────────────────────────────────────

const MONTHS: Record<string, string[]> = {
  de: ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
};
const DAYS: Record<string, string[]> = {
  de: ['Mo','Di','Mi','Do','Fr','Sa','So'],
  en: ['Mo','Tu','We','Th','Fr','Sa','Su'],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function eventDateKey(ev: GCalEvent) {
  return (ev.start.dateTime ?? ev.start.date ?? '').slice(0, 10);
}

function fmtTime(iso: string | undefined) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function fmtDate(iso: string, lang: string) {
  return new Date(iso).toLocaleDateString(lang === 'de' ? 'de-CH' : 'en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function localIso(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dateKey(yr: number, mo: number, d: number) {
  return `${yr}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Client { id: string; name: string; }
type SupaProfile = { id: string; display_name: string | null; first_name: string | null; last_name: string | null };

// ── Calendar tabs ─────────────────────────────────────────────────────────────

function CalTabs({ calendars, activeId, onChange, lang }: {
  calendars: GCalCalendar[]; activeId: string; onChange: (id: string) => void; lang: string;
}) {
  if (calendars.length <= 1) return null;
  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12, flexWrap: 'wrap' }}>
      {calendars.map(cal => {
        const active = cal.id === activeId;
        const color  = cal.backgroundColor ?? 'var(--accent)';
        return (
          <button
            key={cal.id}
            onClick={() => onChange(cal.id)}
            style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
              fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap',
              border: `1.5px solid ${active ? color : 'var(--border)'}`,
              background: active ? color : 'transparent',
              color: active ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.15s',
            }}
          >
            {cal.summary}
            {cal.primary && !active && (
              <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.6 }}>
                {lang === 'de' ? '(Standard)' : '(Primary)'}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Day cell ──────────────────────────────────────────────────────────────────

function DayCell({ day, events, isToday, isSelected, onSelect, calColor }: {
  day: number; events: GCalEvent[]; isToday: boolean; isSelected: boolean;
  onSelect: () => void; calColor: string;
}) {
  const MAX_SHOWN = 2;
  const shown  = events.slice(0, MAX_SHOWN);
  const excess = events.length - MAX_SHOWN;

  return (
    <button
      onClick={onSelect}
      style={{
        height: 88, borderRadius: 9, padding: '6px 7px',
        border: isSelected && !isToday ? `1.5px solid ${calColor}` : 'none',
        cursor: 'pointer', fontFamily: 'inherit',
        background: isToday ? calColor : isSelected ? `${calColor}18` : 'transparent',
        color: isToday ? '#fff' : isSelected ? calColor : 'var(--text-primary)',
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
        overflow: 'hidden', transition: 'background 0.12s', width: '100%',
      }}
    >
      <span style={{ fontSize: 13, fontWeight: isToday || isSelected ? 700 : 400, lineHeight: 1.3 }}>
        {day}
      </span>
      {shown.map(ev => (
        <span
          key={ev.id}
          style={{
            fontSize: 10, lineHeight: 1.3,
            background: isToday ? 'rgba(255,255,255,0.25)' : `${calColor}28`,
            color: isToday ? '#fff' : 'var(--text-primary)',
            borderRadius: 3, padding: '1px 4px', width: '100%',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            boxSizing: 'border-box',
          }}
        >
          {ev.summary}
        </span>
      ))}
      {excess > 0 && (
        <span style={{ fontSize: 10, color: isToday ? 'rgba(255,255,255,0.8)' : 'var(--text-subtle)' }}>
          +{excess}
        </span>
      )}
    </button>
  );
}

// ── Event pill (sidebar) ──────────────────────────────────────────────────────

function EventPill({ ev, onDelete, lang }: { ev: GCalEvent; onDelete: (id: string) => void; lang: string }) {
  const [open, setOpen] = useState(false);
  const isAllDay = !ev.start.dateTime;
  const start    = fmtTime(ev.start.dateTime);
  const end      = fmtTime(ev.end.dateTime);

  return (
    <div style={{ borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', textAlign: 'left', padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ev.summary}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-subtle)', flexShrink: 0 }}>
          {isAllDay ? (lang === 'de' ? 'Ganztags' : 'All day') : `${start}–${end}`}
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 12px 12px', borderTop: '1px solid var(--border)' }}>
          {ev.description && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0', lineHeight: 1.5 }}>{ev.description}</p>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {ev.htmlLink && (
              <a href={ev.htmlLink} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>
                {lang === 'de' ? 'In Google öffnen ↗' : 'Open in Google ↗'}
              </a>
            )}
            <button
              onClick={() => onDelete(ev.id)}
              style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
            >
              {lang === 'de' ? 'Löschen' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── New event form ────────────────────────────────────────────────────────────

interface NewEventFormData {
  title: string; date: string; startTime: string; endTime: string;
  desc: string; calendarId: string; clientId: string;
}

function NewEventPanel({ defaultDate, calendars, defaultCalendarId, clients, onCreated, accessToken, lang }: {
  defaultDate: string; calendars: GCalCalendar[]; defaultCalendarId: string;
  clients: Client[]; onCreated: (ev: GCalEvent) => void; accessToken: string; lang: string;
}) {
  const [form, setForm] = useState<NewEventFormData>({
    title: '', date: defaultDate, startTime: '09:00', endTime: '10:00',
    desc: '', calendarId: defaultCalendarId, clientId: '',
  });
  const [creating,      setCreating]      = useState(false);
  const [error,         setError]         = useState('');
  const [clientSearch,  setClientSearch]  = useState('');
  const [clientOpen,    setClientOpen]    = useState(false);
  const de = lang === 'de';

  useEffect(() => { setForm(f => ({ ...f, date: defaultDate })); }, [defaultDate]);
  useEffect(() => { setForm(f => ({ ...f, calendarId: defaultCalendarId })); }, [defaultCalendarId]);

  const set = <K extends keyof NewEventFormData>(k: K, v: NewEventFormData[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.date || !form.startTime || !form.endTime) return;
    setCreating(true); setError('');

    const res = await fetch('/api/google/event', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body:    JSON.stringify({
        summary:    form.title,
        description: form.desc || undefined,
        start:      `${form.date}T${form.startTime}:00`,
        end:        `${form.date}T${form.endTime}:00`,
        calendarId: form.calendarId || 'primary',
        clientId:   form.clientId   || undefined,
      }),
    });

    if (res.ok) {
      const { event } = await res.json();
      onCreated(event);
      setForm(f => ({ ...f, title: '', desc: '', clientId: '' }));
    } else {
      setError(de ? 'Fehler beim Erstellen' : 'Failed to create event');
    }
    setCreating(false);
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '7px 10px', boxSizing: 'border-box',
    background: 'var(--bg-page)', border: '1px solid var(--border-strong)', borderRadius: 7,
    color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit', outline: 'none',
  };
  const lbl: React.CSSProperties = {
    fontSize: 10, fontWeight: 600, color: 'var(--text-subtle)', display: 'block',
    marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em',
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      <div>
        <label style={lbl}>{de ? 'Titel' : 'Title'}</label>
        <input style={inp} value={form.title} required onChange={e => set('title', e.target.value)}
          placeholder={de ? 'z.B. Training mit Max' : 'e.g. Session with Max'} />
      </div>

      {calendars.length > 1 && (
        <div>
          <label style={lbl}>{de ? 'Kalender' : 'Calendar'}</label>
          <select style={inp} value={form.calendarId} onChange={e => set('calendarId', e.target.value)}>
            {calendars.map(c => (
              <option key={c.id} value={c.id}>{c.summary}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label style={lbl}>{de ? 'Datum' : 'Date'}</label>
        <input style={inp} type="date" value={form.date} required onChange={e => set('date', e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label style={lbl}>{de ? 'Von' : 'From'}</label>
          <input style={inp} type="time" value={form.startTime} required onChange={e => set('startTime', e.target.value)} />
        </div>
        <div>
          <label style={lbl}>{de ? 'Bis' : 'To'}</label>
          <input style={inp} type="time" value={form.endTime} required onChange={e => set('endTime', e.target.value)} />
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <label style={lbl}>{de ? 'Kunde (optional)' : 'Client (optional)'}</label>
        <div style={{ position: 'relative' }}>
          <input
            style={inp}
            value={form.clientId ? (clients.find(c => c.id === form.clientId)?.name ?? '') : clientSearch}
            onChange={e => { setClientSearch(e.target.value); set('clientId', ''); setClientOpen(true); }}
            onFocus={() => setClientOpen(true)}
            onBlur={() => setTimeout(() => setClientOpen(false), 150)}
            placeholder={de ? 'Suchen…' : 'Search…'}
            autoComplete="off"
          />
          {form.clientId && (
            <button
              type="button"
              onClick={() => { set('clientId', ''); setClientSearch(''); }}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)', fontSize: 16, padding: '0 2px', lineHeight: 1 }}
            >×</button>
          )}
        </div>
        {clientOpen && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, marginTop: 2,
            background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)', overflow: 'hidden', maxHeight: 180, overflowY: 'auto',
          }}>
            <button
              type="button"
              onMouseDown={() => { set('clientId', ''); setClientSearch(''); setClientOpen(false); }}
              style={{ width: '100%', textAlign: 'left', padding: '9px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-subtle)', fontFamily: 'inherit', borderBottom: '1px solid var(--border)' }}
            >
              {de ? 'Kein Kunde' : 'No client'}
            </button>
            {clients
              .filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
              .map(c => (
                <button
                  key={c.id}
                  type="button"
                  onMouseDown={() => { set('clientId', c.id); setClientSearch(''); setClientOpen(false); }}
                  style={{
                    width: '100%', textAlign: 'left', padding: '9px 12px', background: form.clientId === c.id ? 'rgba(124,106,255,0.1)' : 'none',
                    border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                    fontSize: 13, color: 'var(--text-primary)', fontFamily: 'inherit',
                  }}
                >
                  {c.name}
                </button>
              ))
            }
            {clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 && (
              <div style={{ padding: '9px 12px', fontSize: 13, color: 'var(--text-subtle)' }}>
                {de ? 'Keine Treffer' : 'No results'}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <label style={lbl}>{de ? 'Notizen' : 'Notes'}</label>
        <textarea style={{ ...inp, resize: 'vertical', minHeight: 52 }} value={form.desc}
          onChange={e => set('desc', e.target.value)} placeholder="Optional…" />
      </div>

      {error && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</div>}

      <button type="submit" disabled={creating} className="btn btn-primary"
        style={{ fontSize: 13, padding: '8px 16px', justifyContent: 'center', opacity: creating ? 0.6 : 1 }}>
        {creating ? (de ? 'Erstellen…' : 'Creating…') : (de ? 'Termin erstellen' : 'Create event')}
      </button>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const { t, lang } = useTranslation();
  const s = t(dashboard);
  const de  = lang === 'de';
  const now = new Date();

  const [connected,         setConnected]         = useState<boolean | null>(null);
  const [calendars,         setCalendars]          = useState<GCalCalendar[]>([]);
  const [activeCalendarId,  setActiveCalendarId]   = useState('primary');
  const [defaultCalendarId, setDefaultCalendarId]  = useState('primary');
  const [events,            setEvents]             = useState<GCalEvent[]>([]);
  const [clients,           setClients]            = useState<Client[]>([]);
  const [year,              setYear]               = useState(now.getFullYear());
  const [month,             setMonth]              = useState(now.getMonth());
  const [selectedDay,       setSelectedDay]        = useState(now.getDate());
  const [showNewEvent,      setShowNewEvent]       = useState(false);
  const [accessToken,       setAccessToken]        = useState<string | null>(null);
  const [loadingEvents,     setLoadingEvents]      = useState(false);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setConnected(false); return; }
      setAccessToken(session.access_token);

      const [connRes, tcRes] = await Promise.all([
        supabase.from('google_calendar_connections')
          .select('google_email, default_calendar_id')
          .eq('trainer_id', session.user.id)
          .maybeSingle(),
        supabase.from('trainer_clients')
          .select('client_id')
          .eq('trainer_id', session.user.id)
          .eq('status', 'active'),
      ]);

      setConnected(!!connRes.data);

      if (connRes.data) {
        const defCalId = connRes.data.default_calendar_id ?? 'primary';
        setDefaultCalendarId(defCalId);

        const calRes = await fetch('/api/google/calendars', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (calRes.ok) {
          const { calendars: cals } = await calRes.json() as { calendars: GCalCalendar[] };
          setCalendars(cals);
          const found = cals.find(c => c.id === defCalId);
          const fallback = cals.find(c => c.primary)?.id ?? cals[0]?.id ?? 'primary';
          setActiveCalendarId(found ? defCalId : fallback);
        }
      }

      const clientIds = (tcRes.data ?? []).map((r: { client_id: string }) => r.client_id);
      if (clientIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, first_name, last_name')
          .in('id', clientIds);
        setClients((profiles ?? []).map((p: SupaProfile) => ({
          id: p.id,
          name: p.display_name
            || [p.first_name, p.last_name].filter(Boolean).join(' ')
            || p.id,
        })));
      }
    }
    init();
  }, []);

  // ── Load events ───────────────────────────────────────────────────────────
  const loadEvents = useCallback(async (yr: number, mo: number, token: string, calId: string) => {
    setLoadingEvents(true);
    const timeMin = new Date(yr, mo, 1).toISOString();
    const timeMax = new Date(yr, mo + 1, 0, 23, 59, 59).toISOString();
    const res = await fetch(
      `/api/google/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&calendarId=${encodeURIComponent(calId)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (res.ok) {
      const { events: evs } = await res.json();
      setEvents(evs);
    }
    setLoadingEvents(false);
  }, []);

  useEffect(() => {
    if (connected && accessToken && activeCalendarId) {
      loadEvents(year, month, accessToken, activeCalendarId);
    } else if (connected === false) {
      setEvents([]);
    }
  }, [connected, accessToken, activeCalendarId, year, month, loadEvents]);

  // ── Events by date ────────────────────────────────────────────────────────
  const byDate = useMemo(() => {
    const map: Record<string, GCalEvent[]> = {};
    events.forEach(ev => {
      const k = eventDateKey(ev);
      (map[k] ??= []).push(ev);
    });
    return map;
  }, [events]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (eventId: string) => {
    if (!accessToken) return;
    const res = await fetch(
      `/api/google/event?eventId=${encodeURIComponent(eventId)}&calendarId=${encodeURIComponent(activeCalendarId)}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (res.ok) setEvents(evs => evs.filter(e => e.id !== eventId));
  }, [accessToken, activeCalendarId]);

  // ── Calendar math ─────────────────────────────────────────────────────────
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const firstWeekDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  function prevMonth() { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); }

  const selectedKey    = dateKey(year, month, selectedDay);
  const selectedEvents = byDate[selectedKey] ?? [];
  const todayKey       = localIso(now);
  const defaultDate    = dateKey(year, month, selectedDay);

  const upcoming = events
    .filter(ev => eventDateKey(ev) >= todayKey)
    .sort((a, b) => (a.start.dateTime ?? a.start.date ?? '') < (b.start.dateTime ?? b.start.date ?? '') ? -1 : 1)
    .slice(0, 12);

  const activeCalendar = calendars.find(c => c.id === activeCalendarId);
  const calColor       = activeCalendar?.backgroundColor ?? 'var(--accent)';

  const sideTitle = de
    ? `${selectedDay}. ${MONTHS.de[month]}`
    : `${MONTHS.en[month]} ${selectedDay}`;

  return (
    <PageShell
      title={s.calendar}
      subtitle={de ? 'Termine und Kalenderübersicht.' : 'Appointments and calendar overview.'}
    >
      {connected === false && (
        <div style={{
          marginBottom: 20, padding: '14px 18px', borderRadius: 10,
          background: 'rgba(124,106,255,0.08)', border: '1px solid rgba(124,106,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
              {de ? 'Google Calendar nicht verbunden' : 'Google Calendar not connected'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {de ? 'Verbinde deinen Kalender, um Termine zu sehen und zu erstellen.' : 'Connect your calendar to view and create events.'}
            </div>
          </div>
          <a href="/settings" className="btn btn-primary" style={{ fontSize: 13, padding: '8px 16px', flexShrink: 0 }}>
            {de ? 'Verbinden' : 'Connect'}
          </a>
        </div>
      )}

      {/* 3-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 300px', gap: 20, alignItems: 'start' }}>

        {/* ── Left: Upcoming ── */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            {de ? 'Demnächst' : 'Upcoming'}
          </div>
          {upcoming.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-subtle)', textAlign: 'center', padding: '16px 0' }}>
              {connected === false ? (de ? 'Kein Kalender' : 'No calendar') : (de ? 'Keine Termine' : 'No events')}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {upcoming.map(ev => {
                const dk    = eventDateKey(ev);
                const start = ev.start.dateTime;
                return (
                  <div key={ev.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                      background: calColor !== 'var(--accent)' ? calColor : 'var(--accent)',
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.summary}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 1 }}>
                        {fmtDate(dk, lang)}{start ? ` · ${fmtTime(start)}` : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Center: Calendar ── */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
          <CalTabs calendars={calendars} activeId={activeCalendarId} onChange={id => { setActiveCalendarId(id); }} lang={lang} />

          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button onClick={prevMonth} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                {MONTHS[lang][month]} {year}
              </span>
              {loadingEvents && (
                <div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
              )}
            </div>
            <button onClick={nextMonth} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
            {DAYS[lang].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'var(--text-subtle)', padding: '3px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {Array.from({ length: firstWeekDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day     = i + 1;
              const isToday = isCurrentMonth && day === now.getDate();
              const isSel   = day === selectedDay;
              const dk      = dateKey(year, month, day);
              return (
                <DayCell
                  key={day}
                  day={day}
                  events={byDate[dk] ?? []}
                  isToday={isToday}
                  isSelected={isSel}
                  onSelect={() => setSelectedDay(day)}
                  calColor={calColor}
                />
              );
            })}
          </div>
        </div>

        {/* ── Right: Add + Selected day ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Add event */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <button
              onClick={() => setShowNewEvent(o => !o)}
              disabled={!connected}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', background: 'none', border: 'none',
                cursor: connected ? 'pointer' : 'default', fontFamily: 'inherit',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: connected ? 'var(--text-primary)' : 'var(--text-subtle)' }}>
                {de ? '+ Termin erstellen' : '+ New event'}
              </span>
              {connected && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  style={{ transition: 'transform 0.2s', transform: showNewEvent ? 'rotate(180deg)' : 'none', color: 'var(--text-subtle)' }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              )}
            </button>
            {showNewEvent && connected && accessToken && (
              <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
                <div style={{ paddingTop: 12 }}>
                  <NewEventPanel
                    defaultDate={defaultDate}
                    calendars={calendars}
                    defaultCalendarId={activeCalendarId}
                    clients={clients}
                    accessToken={accessToken}
                    lang={lang}
                    onCreated={ev => {
                      setEvents(evs => [...evs, ev]);
                      setShowNewEvent(false);
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Selected day events */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10 }}>{sideTitle}</div>
            {selectedEvents.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-subtle)', textAlign: 'center', padding: '14px 0' }}>
                {connected === false
                  ? (de ? 'Kein Kalender verbunden' : 'No calendar connected')
                  : (de ? 'Keine Termine' : 'No events')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {selectedEvents.map(ev => (
                  <EventPill key={ev.id} ev={ev} onDelete={handleDelete} lang={lang} />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </PageShell>
  );
}
