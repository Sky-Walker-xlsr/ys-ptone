'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageShell } from '@/components/PageShell';
import { useTranslation } from '@/locales';
import { dashboard } from '@/locales/dashboard.strings';
import { createClient } from '@/lib/supabase/client';
import type { GCalEvent } from '@/lib/google/calendar';

// ── Locale data ───────────────────────────────────────────────────────────────

const MONTHS: Record<string, string[]> = {
  de: ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
};
const DAYS: Record<string, string[]> = {
  de: ['Mo','Di','Mi','Do','Fr','Sa','So'],
  en: ['Mo','Tu','We','Th','Fr','Sa','Su'],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDateKey(iso: string) { return iso.slice(0, 10); }

function eventDateKey(ev: GCalEvent) {
  return toDateKey(ev.start.dateTime ?? ev.start.date ?? '');
}

function fmtTime(iso: string | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
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

// ── Event pill ────────────────────────────────────────────────────────────────

function EventPill({ ev, onDelete, lang }: { ev: GCalEvent; onDelete: (id: string) => void; lang: string }) {
  const [open, setOpen] = useState(false);
  const isAllDay = !ev.start.dateTime;
  const start    = fmtTime(ev.start.dateTime);
  const end      = fmtTime(ev.end.dateTime);

  return (
    <div style={{ borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', textAlign: 'left', padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 10 }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
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
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '10px 0 10px', lineHeight: 1.5 }}>{ev.description}</p>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {ev.htmlLink && (
              <a href={ev.htmlLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>
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

interface NewEventForm { title: string; date: string; startTime: string; endTime: string; desc: string }

function NewEventPanel({ defaultDate, onCreated, lang }: {
  defaultDate: string; onCreated: (ev: GCalEvent) => void; lang: string;
}) {
  const [form, setForm] = useState<NewEventForm>({ title: '', date: defaultDate, startTime: '09:00', endTime: '10:00', desc: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError]       = useState('');
  const de = lang === 'de';

  useEffect(() => { setForm(f => ({ ...f, date: defaultDate })); }, [defaultDate]);

  const set = <K extends keyof NewEventForm>(k: K, v: NewEventForm[K]) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.date || !form.startTime || !form.endTime) return;
    setCreating(true); setError('');

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError(de ? 'Nicht eingeloggt' : 'Not logged in'); setCreating(false); return; }

    const start = `${form.date}T${form.startTime}:00`;
    const end   = `${form.date}T${form.endTime}:00`;

    const res = await fetch('/api/google/event', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body:    JSON.stringify({ summary: form.title, description: form.desc || undefined, start, end }),
    });

    if (res.ok) {
      const { event } = await res.json();
      onCreated(event);
      setForm(f => ({ ...f, title: '', desc: '' }));
    } else {
      setError(de ? 'Fehler beim Erstellen' : 'Failed to create event');
    }
    setCreating(false);
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 11px', boxSizing: 'border-box',
    background: 'var(--bg-page)', border: '1px solid var(--border-strong)', borderRadius: 7,
    color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit', outline: 'none',
  };
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--text-subtle)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <label style={lbl}>{de ? 'Titel' : 'Title'}</label>
        <input style={inp} value={form.title} required onChange={e => set('title', e.target.value)}
          placeholder={de ? 'z.B. Training mit Max' : 'e.g. Session with Max'} />
      </div>
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
      <div>
        <label style={lbl}>{de ? 'Notizen' : 'Notes'}</label>
        <textarea style={{ ...inp, resize: 'vertical', minHeight: 60 }} value={form.desc}
          onChange={e => set('desc', e.target.value)}
          placeholder={de ? 'Optional…' : 'Optional…'} />
      </div>
      {error && <div style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</div>}
      <button type="submit" disabled={creating} className="btn btn-primary" style={{ fontSize: 13, padding: '8px 16px', justifyContent: 'center', opacity: creating ? 0.6 : 1 }}>
        {creating ? (de ? 'Erstellen…' : 'Creating…') : (de ? 'Termin erstellen' : 'Create event')}
      </button>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const { t, lang } = useTranslation();
  const s = t(dashboard);
  const de = lang === 'de';
  const now = new Date();

  const [connected,     setConnected]     = useState<boolean | null>(null);
  const [events,        setEvents]        = useState<GCalEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [year,          setYear]          = useState(now.getFullYear());
  const [month,         setMonth]         = useState(now.getMonth());
  const [selectedDay,   setSelectedDay]   = useState(now.getDate());
  const [showNewEvent,  setShowNewEvent]  = useState(false);
  const [accessToken,   setAccessToken]   = useState<string | null>(null);

  // ── Auth + connection check ────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setConnected(false); return; }
      setAccessToken(session.access_token);
      const { data } = await supabase
        .from('google_calendar_connections')
        .select('google_email')
        .eq('trainer_id', session.user.id)
        .maybeSingle();
      setConnected(!!data);
    });
  }, []);

  // ── Load events for current month ─────────────────────────────────────────
  const loadEvents = useCallback(async (yr: number, mo: number, token: string) => {
    setLoadingEvents(true);
    const timeMin = new Date(yr, mo, 1).toISOString();
    const timeMax = new Date(yr, mo + 1, 0, 23, 59, 59).toISOString();
    const res = await fetch(`/api/google/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const { events: evs } = await res.json();
      setEvents(evs);
    }
    setLoadingEvents(false);
  }, []);

  useEffect(() => {
    if (connected && accessToken) loadEvents(year, month, accessToken);
    else if (!connected) setEvents([]);
  }, [connected, accessToken, year, month, loadEvents]);

  // ── Event map by date ──────────────────────────────────────────────────────
  const byDate = useMemo(() => {
    const map: Record<string, GCalEvent[]> = {};
    events.forEach(ev => {
      const k = eventDateKey(ev);
      (map[k] ??= []).push(ev);
    });
    return map;
  }, [events]);

  // ── Delete event ───────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (eventId: string) => {
    if (!accessToken) return;
    const res = await fetch(`/api/google/event?eventId=${encodeURIComponent(eventId)}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) setEvents(evs => evs.filter(e => e.id !== eventId));
  }, [accessToken]);

  // ── Calendar math ──────────────────────────────────────────────────────────
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const firstWeekDay = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  function prevMonth() { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); }

  const selectedKey = `${year}-${String(month + 1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`;
  const selectedEvents = byDate[selectedKey] ?? [];

  // Upcoming: all events from today onward, sorted
  const todayKey = localIso(now);
  const upcoming = events
    .filter(ev => eventDateKey(ev) >= todayKey)
    .sort((a, b) => (a.start.dateTime ?? a.start.date ?? '') < (b.start.dateTime ?? b.start.date ?? '') ? -1 : 1)
    .slice(0, 10);

  const defaultDate = `${year}-${String(month + 1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`;

  // ── Sidebar content ────────────────────────────────────────────────────────
  const sideTitle = de
    ? `${selectedDay}. ${MONTHS.de[month]}`
    : `${MONTHS.en[month]} ${selectedDay}`;

  return (
    <PageShell
      title={s.calendar}
      subtitle={de ? 'Termine und Kalenderübersicht.' : 'Appointments and calendar overview.'}
    >
      {/* Not connected banner */}
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

        {/* ── Calendar grid ── */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <button onClick={prevMonth} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                {MONTHS[lang][month]} {year}
              </span>
              {loadingEvents && (
                <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
              )}
            </div>
            <button onClick={nextMonth} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
            {DAYS[lang].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-subtle)', padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {Array.from({ length: firstWeekDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day    = i + 1;
              const isToday    = isCurrentMonth && day === now.getDate();
              const isSelected = day === selectedDay;
              const dateKey    = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const dayEvents  = byDate[dateKey] ?? [];

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    height: 44, borderRadius: 9, border: isSelected && !isToday ? '1.5px solid var(--accent)' : 'none',
                    cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
                    fontWeight: isToday || isSelected ? 700 : 400,
                    background: isToday ? 'var(--accent)' : isSelected ? 'rgba(124,106,255,0.1)' : 'transparent',
                    color: isToday ? '#fff' : isSelected ? 'var(--accent)' : 'var(--text-primary)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                    transition: 'background 0.12s',
                  }}
                >
                  <span>{day}</span>
                  {dayEvents.length > 0 && (
                    <span style={{ display: 'flex', gap: 2 }}>
                      {dayEvents.slice(0, 3).map((_, di) => (
                        <span key={di} style={{ width: 4, height: 4, borderRadius: '50%', background: isToday ? 'rgba(255,255,255,0.7)' : 'var(--accent)' }} />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* New event */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <button
              onClick={() => setShowNewEvent(o => !o)}
              disabled={!connected}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', background: 'none', border: 'none', cursor: connected ? 'pointer' : 'default',
                fontFamily: 'inherit',
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
            {showNewEvent && connected && (
              <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
                <div style={{ paddingTop: 14 }}>
                  <NewEventPanel
                    defaultDate={defaultDate}
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
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>{sideTitle}</div>
            {selectedEvents.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-subtle)', textAlign: 'center', padding: '16px 0' }}>
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

          {/* Upcoming events */}
          {connected && upcoming.length > 0 && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 12 }}>
                {de ? 'Demnächst' : 'Upcoming'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcoming.map(ev => {
                  const dk = eventDateKey(ev);
                  const start = ev.start.dateTime;
                  return (
                    <div key={ev.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 5 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.summary}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 1 }}>
                          {fmtDate(dk, lang)}{start ? ` · ${fmtTime(start)}` : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
