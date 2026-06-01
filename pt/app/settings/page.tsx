'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/PageShell';
import { useTranslation } from '@/locales';
import { useTheme } from '@/styles/theme';
import { dashboard } from '@/locales/dashboard.strings';
import { createClient } from '@/lib/supabase/client';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
        {title}
      </h2>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

function SettingRow({ label, description, control, last }: { label: string; description?: string; control: React.ReactNode; last?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 20px', borderBottom: last ? 'none' : '1px solid var(--border)',
      gap: 16,
    }}>
      <div>
        <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{label}</div>
        {description && <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 2 }}>{description}</div>}
      </div>
      {control}
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{
      width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
      background: on ? 'var(--accent)' : 'var(--bg-tertiary)',
      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <span style={{
        display: 'block', width: 18, height: 18, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 3, left: on ? 23 : 3, transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
      }} />
    </button>
  );
}

interface GCalCalendarShape { id: string; summary: string; primary?: boolean; backgroundColor?: string; }
type GCalState = 'loading' | { email: string | null; defaultCalendarId: string | null } | null;

export default function SettingsPage() {
  const { t, lang, setLang } = useTranslation();
  const { themeId, toggle: toggleTheme } = useTheme();
  const s = t(dashboard);
  const de = lang === 'de';

  const [gcal,            setGcal]           = useState<GCalState>('loading');
  const [gcalCalendars,   setGcalCalendars]  = useState<GCalCalendarShape[]>([]);
  const [savingDefault,   setSavingDefault]  = useState(false);
  const [accessToken,     setAccessToken]    = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setGcal(null); return; }
      setAccessToken(session.access_token);

      const { data: conn } = await supabase
        .from('google_calendar_connections')
        .select('google_email, default_calendar_id')
        .eq('trainer_id', session.user.id)
        .maybeSingle();

      setGcal(conn ? { email: conn.google_email, defaultCalendarId: conn.default_calendar_id ?? null } : null);

      if (conn) {
        const res = await fetch('/api/google/calendars', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const { calendars } = await res.json();
          setGcalCalendars(calendars);
        }
      }
    });

    if (typeof window !== 'undefined' && (
      window.location.search.includes('google_connected') ||
      window.location.search.includes('google_error')
    )) {
      window.history.replaceState({}, '', '/settings');
    }
  }, []);

  async function connectGoogle() {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    window.location.href = `/api/google/connect?trainer_id=${data.user.id}`;
  }

  async function disconnectGoogle() {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from('google_calendar_connections').delete().eq('trainer_id', data.user.id);
    setGcal(null);
    setGcalCalendars([]);
  }

  async function saveDefaultCalendar(calendarId: string) {
    if (!accessToken) return;
    setSavingDefault(true);
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await supabase
        .from('google_calendar_connections')
        .update({ default_calendar_id: calendarId })
        .eq('trainer_id', data.user.id);
      setGcal(prev => prev && prev !== 'loading' ? { ...prev, defaultCalendarId: calendarId } : prev);
    }
    setSavingDefault(false);
  }

  const btnBase: React.CSSProperties = {
    padding: '6px 14px', borderRadius: 7, fontSize: 13, fontWeight: 500,
    border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit',
  };

  return (
    <PageShell title={s.settings} subtitle={de ? 'App-Einstellungen und Präferenzen.' : 'App settings and preferences.'}>
      <div style={{ maxWidth: 600 }}>

        <Section title={de ? 'Darstellung' : 'Appearance'}>
          <SettingRow
            label={de ? 'Dunkles Design' : 'Dark mode'}
            description={de ? 'Dunkles Farbschema verwenden' : 'Use dark color scheme'}
            control={<Toggle on={themeId === 'dark'} onToggle={toggleTheme} />}
          />
          <SettingRow
            label={de ? 'Sprache' : 'Language'}
            description={de ? 'App-Sprache' : 'Application language'}
            last
            control={
              <div style={{ display: 'flex', gap: 6 }}>
                {(['de', 'en'] as const).map(l => (
                  <button key={l} onClick={() => setLang(l)} style={{
                    padding: '4px 12px', borderRadius: 6, fontSize: 13, fontWeight: 500,
                    background: lang === l ? 'var(--accent)' : 'var(--bg-tertiary)',
                    color: lang === l ? '#fff' : 'var(--text-muted)',
                    border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            }
          />
        </Section>

        <Section title={de ? 'Benachrichtigungen' : 'Notifications'}>
          <SettingRow
            label={de ? 'Journal-Einreichungen' : 'Journal submissions'}
            description={de ? 'Benachrichtigung bei neuem Wochenjournal' : 'Notify when client submits weekly journal'}
            control={<Toggle on={true} onToggle={() => {}} />}
          />
          <SettingRow
            label={de ? 'Zahlungserinnerungen' : 'Payment reminders'}
            description={de ? 'Automatische Mahnungen versenden' : 'Send automatic payment reminders'}
            control={<Toggle on={true} onToggle={() => {}} />}
          />
          <SettingRow
            label={de ? 'Termin-Erinnerungen' : 'Appointment reminders'}
            description={de ? 'Erinnerung vor Terminen' : 'Reminder before appointments'}
            last
            control={<Toggle on={false} onToggle={() => {}} />}
          />
        </Section>

        <Section title={de ? 'Integrationen' : 'Integrations'}>
          <SettingRow
            label="Google Calendar"
            last={!gcal || gcal === 'loading' || gcalCalendars.length <= 1}
            description={
              gcal === 'loading' ? '...'
              : gcal
                ? (de ? `Verbunden${gcal.email ? ` als ${gcal.email}` : ''}` : `Connected${gcal.email ? ` as ${gcal.email}` : ''}`)
                : (de ? 'Termine mit Google Kalender synchronisieren' : 'Sync appointments with Google Calendar')
            }
            control={
              gcal === 'loading' ? (
                <span style={{ fontSize: 13, color: 'var(--text-subtle)', minWidth: 80, textAlign: 'center' }}>...</span>
              ) : gcal ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
                  <button onClick={disconnectGoogle} style={{ ...btnBase, background: 'rgba(240,68,68,0.1)', borderColor: 'rgba(240,68,68,0.2)', color: 'var(--danger)' }}>
                    {de ? 'Trennen' : 'Disconnect'}
                  </button>
                </div>
              ) : (
                <button onClick={connectGoogle} style={{ ...btnBase, background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff' }}>
                  {de ? 'Verbinden' : 'Connect'}
                </button>
              )
            }
          />
          {gcal && gcal !== 'loading' && gcalCalendars.length > 1 && (
            <SettingRow
              label={de ? 'Standard-Kalender' : 'Default Calendar'}
              description={de ? 'Kalender für neue Termine' : 'Calendar for new appointments'}
              last
              control={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <select
                    value={gcal.defaultCalendarId ?? gcalCalendars.find(c => c.primary)?.id ?? gcalCalendars[0]?.id ?? ''}
                    onChange={e => saveDefaultCalendar(e.target.value)}
                    disabled={savingDefault}
                    style={{
                      padding: '5px 10px', borderRadius: 7, fontSize: 13,
                      background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                      color: 'var(--text-primary)', fontFamily: 'inherit', cursor: 'pointer',
                      opacity: savingDefault ? 0.6 : 1,
                    }}
                  >
                    {gcalCalendars.map(c => (
                      <option key={c.id} value={c.id}>{c.summary}</option>
                    ))}
                  </select>
                  {savingDefault && <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>…</span>}
                </div>
              }
            />
          )}
        </Section>

        <Section title={de ? 'Konto' : 'Account'}>
          <SettingRow
            label={de ? 'Daten exportieren' : 'Export data'}
            description={de ? 'Alle Daten als CSV herunterladen' : 'Download all data as CSV'}
            control={
              <button style={{ ...btnBase, background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                {de ? 'Export' : 'Export'}
              </button>
            }
          />
          <SettingRow
            label={de ? 'Konto löschen' : 'Delete account'}
            description={de ? 'Konto und alle Daten dauerhaft löschen' : 'Permanently delete account and all data'}
            last
            control={
              <button style={{ ...btnBase, background: 'rgba(240,68,68,0.1)', borderColor: 'rgba(240,68,68,0.2)', color: 'var(--danger)' }}>
                {de ? 'Löschen' : 'Delete'}
              </button>
            }
          />
        </Section>

        <p style={{ fontSize: 12, color: 'var(--text-subtle)' }}>PTOne PT Dashboard · v0.1.0</p>
      </div>
    </PageShell>
  );
}
