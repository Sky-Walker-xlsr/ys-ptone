'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/styles/theme';
import { useTranslation } from '@/locales';
import type { Language } from '@/locales/types';

type Tab = 'plans' | 'logbook' | 'journal' | 'account';

interface Profile {
  first_name:   string | null;
  last_name:    string | null;
  display_name: string | null;
  email:        string;
  has_coach:    boolean;
}

interface TrainerProfile {
  id:           string;
  first_name:   string | null;
  last_name:    string | null;
  display_name: string | null;
  email:        string;
}

interface PTRelation {
  tc_id:   string;
  status:  'active' | 'pending';
  trainer: TrainerProfile | null;
}

interface AssignedPlan {
  assignment_id: string;
  plan_id:       string;
  title:         string;
  description:   string | null;
  exercise_count: number;
  trainer_name:  string;
}

interface OwnPlan {
  id:          string;
  title:       string;
  description: string | null;
  exercise_count: number;
}

interface WorkoutSession {
  id:               string;
  title:            string;
  status:           string;
  started_at:       string;
  finished_at:      string | null;
  duration_seconds: number | null;
  total_volume_kg:  number | null;
  total_sets:       number | null;
  source:           string;
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function PlansIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  );
}

function LogbookIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  );
}

function JournalIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      <line x1="6" y1="8" x2="6" y2="8"/><line x1="6" y1="12" x2="8" y2="12"/><line x1="6" y1="16" x2="8" y2="16"/>
    </svg>
  )
}

function AccountIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function PTOneLogo() {
  return (
    <svg width="90" height="26" viewBox="0 0 110 32" fill="none" aria-label="PTOne">
      <rect x="1" y="5" width="16" height="16" rx="3" fill="var(--accent)" opacity="0.9"/>
      <rect x="7" y="11" width="16" height="16" rx="3" fill="var(--accent)" opacity="0.5"/>
      <text x="30" y="22" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" fontSize="17" fontWeight="700" fill="var(--text-primary)">PT</text>
      <text x="53" y="22" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" fontSize="17" fontWeight="400" fill="var(--text-muted)">One</text>
    </svg>
  );
}

// ─── Nav config ──────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: Tab; label: Record<Language, string>; Icon: React.FC<{ active: boolean }> }[] = [
  { id: 'plans',   label: { de: 'Pläne',   en: 'Plans'   }, Icon: PlansIcon   },
  { id: 'logbook', label: { de: 'Logbuch', en: 'Logbook' }, Icon: LogbookIcon },
  { id: 'journal', label: { de: 'Journal', en: 'Journal' }, Icon: JournalIcon },
  { id: 'account', label: { de: 'Konto',   en: 'Account' }, Icon: AccountIcon },
];

// ─── Shared ──────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border)',
  borderRadius: 16, padding: '20px',
};

function Divider() {
  return <div style={{ height: 1, background: 'var(--border)', margin: '0 -20px' }} />;
}

interface MenuRowProps {
  label: string; value?: string; icon?: React.ReactNode; danger?: boolean;
  onClick?: () => void; href?: string;
}

function MenuRow({ label, value, icon, danger, onClick, href }: MenuRowProps) {
  const inner = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {icon && <div style={{ width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: danger ? 'rgba(240,68,68,0.1)' : 'var(--bg-tertiary)', flexShrink: 0 }}>{icon}</div>}
        <span style={{ fontSize: 15, color: danger ? 'var(--danger)' : 'var(--text-primary)' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {value && <span style={{ fontSize: 14, color: 'var(--text-subtle)' }}>{value}</span>}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-subtle)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
      </div>
    </>
  );
  const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', cursor: 'pointer', width: '100%' };
  if (href) return <a href={href} style={{ ...rowStyle, textDecoration: 'none' }}>{inner}</a>;
  return <button onClick={onClick} style={{ ...rowStyle, background: 'none', border: 'none', textAlign: 'left', fontFamily: 'inherit' }}>{inner}</button>;
}

function trainerInitials(t: TrainerProfile | null) {
  if (!t) return '?';
  return ((t.first_name?.[0] ?? '') + (t.last_name?.[0] ?? '')).toUpperCase() || (t.email[0] ?? '?').toUpperCase();
}

function trainerName(t: TrainerProfile | null) {
  if (!t) return '—';
  return t.display_name || `${t.first_name ?? ''} ${t.last_name ?? ''}`.trim() || t.email;
}

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(dateStr: string, lang: Language) {
  return new Date(dateStr).toLocaleDateString(lang === 'de' ? 'de-CH' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Plans Tab ───────────────────────────────────────────────────────────────

interface PlansTabProps {
  profile:       Profile | null;
  lang:          Language;
  assignedPlans: AssignedPlan[];
  ownPlans:      OwnPlan[];
  onStartPlan:   (planId: string, title: string) => void;
  onStartEmpty:  () => void;
  onCreatePlan:  () => void;
  starting:      boolean;
}

function PlansTab({ profile, lang, assignedPlans, ownPlans, onStartPlan, onStartEmpty, onCreatePlan, starting }: PlansTabProps) {
  const firstName = profile?.first_name ?? (lang === 'de' ? 'du' : 'there');

  return (
    <div style={{ paddingTop: 24, paddingBottom: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
        {lang === 'de' ? `Hey ${firstName} 👋` : `Hey ${firstName} 👋`}
      </h1>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
        {lang === 'de' ? 'Bereit für dein Training?' : 'Ready for your workout?'}
      </p>

      {/* Quick start button */}
      <button onClick={onStartEmpty} disabled={starting} style={{ width: '100%', padding: '13px', background: 'rgba(124,106,255,0.12)', border: '1px solid rgba(124,106,255,0.3)', borderRadius: 14, color: 'var(--accent)', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 24, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        {starting ? (lang === 'de' ? 'Erstelle…' : 'Creating…') : (lang === 'de' ? 'Leeres Training starten' : 'Start empty workout')}
      </button>

      {/* Assigned plans */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          {lang === 'de' ? 'Von PT zugewiesen' : 'Assigned by PT'}
        </h2>
        {assignedPlans.length === 0 ? (
          <div style={{ ...card, textAlign: 'center', padding: '28px 24px' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              {lang === 'de' ? 'Noch kein Plan zugewiesen' : 'No plan assigned yet'}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-subtle)', lineHeight: 1.5 }}>
              {lang === 'de' ? 'Dein PT hat dir noch keinen Trainingsplan zugewiesen.' : 'Your trainer has not assigned a training plan yet.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {assignedPlans.map(p => (
              <div key={p.assignment_id} style={{ ...card, padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{p.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.exercise_count} {lang === 'de' ? 'Übungen' : 'exercises'} · {lang === 'de' ? 'von' : 'by'} {p.trainer_name}</div>
                    {p.description && <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 4, lineHeight: 1.5 }}>{p.description}</div>}
                  </div>
                </div>
                <button onClick={() => onStartPlan(p.plan_id, p.title)} disabled={starting} style={{ width: '100%', padding: '9px', background: 'var(--accent)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {lang === 'de' ? 'Training starten' : 'Start workout'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Own plans */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {lang === 'de' ? 'Eigene Pläne' : 'My Plans'}
          </h2>
          <button onClick={onCreatePlan} style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
            + {lang === 'de' ? 'Neu' : 'New'}
          </button>
        </div>
        {ownPlans.length === 0 ? (
          <div style={{ ...card, textAlign: 'center', padding: '28px 24px' }}>
            <p style={{ fontSize: 13, color: 'var(--text-subtle)' }}>
              {lang === 'de' ? 'Noch keine eigenen Pläne.' : 'No personal plans yet.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ownPlans.map(p => (
              <div key={p.id} style={{ ...card, padding: '16px 20px' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{p.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>{p.exercise_count} {lang === 'de' ? 'Übungen' : 'exercises'}</div>
                <button onClick={() => onStartPlan(p.id, p.title)} disabled={starting} style={{ width: '100%', padding: '9px', background: 'rgba(124,106,255,0.12)', border: '1px solid rgba(124,106,255,0.25)', borderRadius: 10, color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {lang === 'de' ? 'Training starten' : 'Start workout'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Logbook Tab ─────────────────────────────────────────────────────────────

interface LogbookTabProps {
  lang:     Language;
  sessions: WorkoutSession[];
  streak:   number;
}

function LogbookTab({ lang, sessions, streak }: LogbookTabProps) {
  return (
    <div style={{ paddingTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
          {lang === 'de' ? 'Trainingslog' : 'Workout Log'}
        </h1>
      </div>

      <div style={{ background: 'linear-gradient(135deg, rgba(124,106,255,0.12), rgba(62,207,142,0.08))', border: '1px solid rgba(124,106,255,0.2)', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <span style={{ fontSize: 28 }}>🔥</span>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{streak}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{lang === 'de' ? 'Wochen in Folge' : 'Week streak'}</div>
        </div>
        <div style={{ width: 1, height: 36, background: 'var(--border)', marginLeft: 4, marginRight: 4 }} />
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{sessions.length}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{lang === 'de' ? 'Einheiten gesamt' : 'Total sessions'}</div>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📓</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
            {lang === 'de' ? 'Noch keine Einheiten' : 'No sessions yet'}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-subtle)', lineHeight: 1.6 }}>
            {lang === 'de' ? 'Starte dein erstes Training, um deinen Fortschritt hier zu sehen.' : 'Start your first workout to see your progress here.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sessions.map(s => (
            <Link key={s.id} href={`/logbook/${s.id}`} style={{ ...card, padding: '16px 20px', textDecoration: 'none', display: 'block' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{s.title}</div>
                    {s.source === 'plan' && <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent)', background: 'rgba(124,106,255,0.12)', border: '1px solid rgba(124,106,255,0.25)', borderRadius: 4, padding: '2px 6px' }}>Plan</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {s.duration_seconds && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>⏱ {formatDuration(s.duration_seconds)}</span>}
                    {s.total_volume_kg && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>🏋️ {s.total_volume_kg} kg</span>}
                    {s.total_sets && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>📋 {s.total_sets} sets</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {formatDate(s.finished_at ?? s.started_at, lang)}
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-subtle)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Journal Tab ─────────────────────────────────────────────────────────────

interface JournalSection {
  id: string; type: 'heading' | 'scale' | 'text' | 'dropdown'
  title?: string; question?: string; min?: number; max?: number
  label_min?: string; label_max?: string; options?: string[]
}
interface JournalAssignment { template_id: string; sections: JournalSection[]; intro_text: string | null }

function getISOWeek(date: Date): { week: number; year: number } {
  const d = new Date(date); d.setHours(12, 0, 0, 0)
  const day = d.getDay() || 7; d.setDate(d.getDate() + 4 - day)
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return { week, year: d.getFullYear() }
}

function JournalTab({ lang, userId, ptId }: { lang: Language; userId: string; ptId: string | null }) {
  const supabase = useMemo(() => createClient(), [])
  const [assignment, setAssignment] = useState<{ template_id: string; sections: any[]; intro_text: string | null } | null>(null)
  const [existingEntry, setExistingEntry] = useState<{ id: string; submitted_at: string; avg_score: number | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [weightKg, setWeightKg] = useState('')
  const [waistCm, setWaistCm] = useState('')
  const [scores, setScores] = useState<Record<string, number>>({})
  const [texts, setTexts] = useState<Record<string, string>>({})

  const { week, year } = getISOWeek(new Date())

  useEffect(() => {
    if (!ptId) { setLoading(false); return }
    async function load() {
      const { data: asgn } = await supabase.from('journal_assignments')
        .select('template_id, journal_templates(intro_text, sections)')
        .eq('client_id', userId).eq('trainer_id', ptId).maybeSingle()
      if (!asgn || !(asgn as any).journal_templates) { setLoading(false); return }
      const tmpl = (asgn as any).journal_templates
      setAssignment({ template_id: asgn.template_id, sections: tmpl.sections ?? [], intro_text: tmpl.intro_text })
      const { data: entry } = await supabase.from('journal_entries')
        .select('id, submitted_at, avg_score')
        .eq('client_id', userId).eq('week_number', week).eq('year', year)
        .eq('template_id', asgn.template_id).maybeSingle()
      if (entry) setExistingEntry(entry as any)
      setLoading(false)
    }
    load()
  }, [userId, ptId])

  async function handleSubmit() {
    if (!assignment || !ptId) return
    setSubmitting(true)
    const scaleQuestions = assignment.sections.filter((s: any) => s.type === 'scale' && scores[s.id] != null)
    const avgScore = scaleQuestions.length > 0
      ? scaleQuestions.reduce((sum: number, s: any) => sum + (scores[s.id] ?? 0), 0) / scaleQuestions.length
      : null
    const { data: entry } = await supabase.from('journal_entries').insert({
      client_id: userId, pt_id: ptId, template_id: assignment.template_id,
      week_label: `KW ${week} / ${year}`, year, week_number: week,
      weight_kg: weightKg ? parseFloat(weightKg) : null,
      waist_cm: waistCm ? parseFloat(waistCm) : null,
      avg_score: avgScore, submitted_at: new Date().toISOString(),
    }).select('id, submitted_at, avg_score').single()
    if (entry) {
      const responses = assignment.sections.filter((s: any) => s.type !== 'heading').map((s: any) => ({
        entry_id: entry.id, question_id: s.id,
        value_score: s.type === 'scale' ? (scores[s.id] ?? null) : null,
        value_text: (s.type === 'text' || s.type === 'dropdown') ? (texts[s.id] ?? null) : null,
      }))
      if (responses.length > 0) await supabase.from('journal_responses').insert(responses)
      setExistingEntry({ id: entry.id, submitted_at: entry.submitted_at, avg_score: entry.avg_score })
    }
    setSubmitting(false)
  }

  if (loading) return (
    <div style={{ paddingTop: 60, display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--border-strong)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  if (!assignment) return (
    <div style={{ paddingTop: 48, textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📓</div>
      <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
        {lang === 'de' ? 'Noch kein Journal' : 'No journal yet'}
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        {lang === 'de' ? 'Dein PT hat noch keine Journal-Vorlage für dich eingerichtet.' : "Your PT hasn't set up a journal template for you yet."}
      </p>
    </div>
  )

  if (existingEntry) return (
    <div style={{ paddingTop: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Journal</h1>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>KW {week} / {year}</p>
      <div style={{ background: 'rgba(62,207,142,0.08)', border: '1px solid rgba(62,207,142,0.3)', borderRadius: 14, padding: '20px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--success)', marginBottom: 4 }}>
          {lang === 'de' ? 'Diese Woche eingereicht!' : 'Submitted this week!'}
        </div>
        {existingEntry.avg_score != null && (
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Ø Score: {Number(existingEntry.avg_score).toFixed(1)} / 10</div>
        )}
        <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 6 }}>
          {new Date(existingEntry.submitted_at).toLocaleDateString(lang === 'de' ? 'de-CH' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ paddingTop: 24, paddingBottom: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>Journal</h1>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>KW {week} / {year}</p>

      {assignment.intro_text && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 20, whiteSpace: 'pre-line' }}>
          {assignment.intro_text}
        </div>
      )}

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px', marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Messungen</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: lang === 'de' ? 'Gewicht (kg)' : 'Weight (kg)', value: weightKg, set: setWeightKg },
            { label: lang === 'de' ? 'Bauchumfang (cm)' : 'Waist (cm)', value: waistCm, set: setWaistCm },
          ].map(m => (
            <div key={m.label}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>{m.label}</label>
              <input type="number" inputMode="decimal" value={m.value} onChange={e => m.set(e.target.value)} placeholder="—" style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: 15, fontFamily: 'inherit', outline: 'none' }} />
            </div>
          ))}
        </div>
      </div>

      {assignment.sections.filter((s: any) => s.type !== 'heading').map((section: any) => (
        <div key={section.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px', marginBottom: 12 }}>
          <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 12, fontWeight: 500 }}>{section.question}</div>
          {section.type === 'scale' && (
            <>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {Array.from({ length: (section.max ?? 10) - (section.min ?? 1) + 1 }, (_, i) => i + (section.min ?? 1)).map(n => (
                  <button key={n} onClick={() => setScores(p => ({ ...p, [section.id]: n }))} style={{ width: 40, height: 40, borderRadius: 10, border: scores[section.id] === n ? '2px solid var(--accent)' : '1px solid var(--border)', background: scores[section.id] === n ? 'rgba(124,106,255,0.15)' : 'var(--bg-tertiary)', color: scores[section.id] === n ? 'var(--accent)' : 'var(--text-primary)', fontSize: 14, fontWeight: scores[section.id] === n ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {n}
                  </button>
                ))}
              </div>
              {(section.label_min || section.label_max) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{section.min ?? 1} = {section.label_min}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>{section.max ?? 10} = {section.label_max}</span>
                </div>
              )}
            </>
          )}
          {section.type === 'text' && (
            <textarea value={texts[section.id] ?? ''} onChange={e => setTexts(p => ({ ...p, [section.id]: e.target.value }))} placeholder={lang === 'de' ? 'Deine Antwort…' : 'Your answer…'} rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none', resize: 'none' }} />
          )}
          {section.type === 'dropdown' && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(section.options ?? []).map((opt: string) => (
                <button key={opt} onClick={() => setTexts(p => ({ ...p, [section.id]: opt }))} style={{ padding: '8px 16px', borderRadius: 20, border: texts[section.id] === opt ? '2px solid var(--accent)' : '1px solid var(--border)', background: texts[section.id] === opt ? 'rgba(124,106,255,0.12)' : 'var(--bg-tertiary)', color: texts[section.id] === opt ? 'var(--accent)' : 'var(--text-primary)', fontSize: 13, fontWeight: texts[section.id] === opt ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      <button onClick={handleSubmit} disabled={submitting} style={{ width: '100%', padding: '14px', background: 'var(--accent)', border: 'none', borderRadius: 14, color: '#fff', fontSize: 15, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: submitting ? 0.7 : 1 }}>
        {submitting ? (lang === 'de' ? 'Einreichen…' : 'Submitting…') : (lang === 'de' ? 'Journal einreichen' : 'Submit journal')}
      </button>
    </div>
  )
}

// ─── Doc types (used by AccountTab) ──────────────────────────────────────────

interface DocFile {
  id:           string;
  name:         string;
  storage_path: string;
  size_bytes:   number | null;
  section:      string;
  subfolder:    string | null;
  created_at:   string;
}

interface DocFolder {
  id:   string;
  name: string;
}

// ─── Account Tab ─────────────────────────────────────────────────────────────

interface AccountTabProps {
  profile: Profile | null; initials: string; themeId: string; toggleTheme: () => void;
  lang: Language; setLang: (l: Language) => void; signOut: () => void;
  relations: PTRelation[]; onAccept: (tcId: string) => void; onDecline: (tcId: string) => void;
  userId: string;
}

function AccountTab({ profile, initials, themeId, toggleTheme, lang, setLang, signOut, relations, onAccept, onDecline, userId }: AccountTabProps) {
  const pendingRelations = relations.filter(r => r.status === 'pending');
  const activeRelations  = relations.filter(r => r.status === 'active');
  const supabase = useMemo(() => createClient(), []);

  const [subView,     setSubView]     = useState<'main' | 'docs'>('main');
  const [docFiles,    setDocFiles]    = useState<DocFile[]>([]);
  const [docFolders,  setDocFolders]  = useState<DocFolder[]>([]);
  const [docsLoaded,  setDocsLoaded]  = useState(false);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docTab,      setDocTab]      = useState<'documents' | 'invoices'>('documents');
  const [dlId,        setDlId]        = useState<string | null>(null);
  const [expanded,    setExpanded]    = useState<Set<string>>(new Set());

  async function loadDocs() {
    if (docsLoaded) return;
    setDocsLoading(true);
    const [filesRes, foldersRes] = await Promise.all([
      supabase
        .from('pt_files')
        .select('id, name, storage_path, size_bytes, section, subfolder, created_at')
        .in('section', ['client_documents', 'client_invoices'])
        .order('created_at', { ascending: false }),
      supabase
        .from('pt_client_folders')
        .select('id, name')
        .order('name'),
    ]);
    setDocFiles((filesRes.data ?? []) as DocFile[]);
    setDocFolders((foldersRes.data ?? []) as DocFolder[]);
    setDocsLoaded(true);
    setDocsLoading(false);
  }

  function openDocs() {
    setSubView('docs');
    loadDocs();
  }

  function toggleFolder(name: string) {
    setExpanded(p => { const n = new Set(p); n.has(name) ? n.delete(name) : n.add(name); return n; });
  }

  async function handleDownload(file: DocFile) {
    setDlId(file.id);
    const { data } = await supabase.storage.from('ptone_drive').createSignedUrl(file.storage_path, 3600);
    if (data?.signedUrl) {
      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.download = file.name;
      a.click();
    }
    setDlId(null);
  }

  function fmtBytes(b: number | null): string {
    if (!b) return '';
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(0)} KB`;
    return `${(b / 1048576).toFixed(1)} MB`;
  }

  function DocFileRow({ file, indent = false }: { file: DocFile; indent?: boolean }) {
    const ext  = file.name.split('.').pop()?.toLowerCase() ?? '';
    const icon = file.section === 'client_invoices' ? '🧾'
      : ['pdf'].includes(ext) ? '📄'
      : ['jpg','jpeg','png','gif','webp'].includes(ext) ? '🖼️'
      : ['xls','xlsx','csv'].includes(ext) ? '📊' : '📄';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: `13px ${indent ? 28 : 16}px`, borderTop: '1px solid var(--border)', background: indent ? 'rgba(124,106,255,0.04)' : 'transparent' }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 2 }}>
            {fmtBytes(file.size_bytes)}{file.size_bytes ? ' · ' : ''}
            {new Date(file.created_at).toLocaleDateString(lang === 'de' ? 'de-CH' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
        <button onClick={() => handleDownload(file)} disabled={dlId === file.id} style={{ padding: '6px 14px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, cursor: dlId === file.id ? 'not-allowed' : 'pointer', fontFamily: 'inherit', flexShrink: 0, opacity: dlId === file.id ? 0.5 : 1 }}>
          {dlId === file.id ? '…' : 'Download'}
        </button>
      </div>
    );
  }

  if (subView === 'docs') {
    const docOnlyFiles = docFiles.filter(f => f.section === 'client_documents');
    const invoiceFiles = docFiles.filter(f => f.section === 'client_invoices');
    const rootDocFiles = docOnlyFiles.filter(f => !f.subfolder);

    return (
      <div style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => setSubView('main')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
            {lang === 'de' ? 'Dokumente' : 'Documents'}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 4, marginBottom: 20 }}>
          {(['documents', 'invoices'] as const).map(t => (
            <button key={t} onClick={() => setDocTab(t)} style={{ flex: 1, padding: '8px', borderRadius: 9, border: 'none', background: docTab === t ? 'var(--accent)' : 'transparent', color: docTab === t ? '#fff' : 'var(--text-muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {t === 'documents' ? (lang === 'de' ? 'Dokumente' : 'Documents') : (lang === 'de' ? 'Rechnungen' : 'Invoices')}
            </button>
          ))}
        </div>

        {docsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--border-strong)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : docTab === 'documents' ? (
          /* ── Folder tree (read-only) ── */
          docFolders.length === 0 && rootDocFiles.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', padding: '40px 24px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{lang === 'de' ? 'Keine Dokumente' : 'No documents yet'}</p>
              <p style={{ fontSize: 13, color: 'var(--text-subtle)', lineHeight: 1.6 }}>{lang === 'de' ? 'Dein PT hat noch keine Dateien geteilt.' : 'Your trainer has not shared any files yet.'}</p>
            </div>
          ) : (
            <div>
              {/* Root files */}
              {rootDocFiles.length > 0 && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 8 }}>
                  {rootDocFiles.map(f => <DocFileRow key={f.id} file={f} />)}
                </div>
              )}
              {/* Folders */}
              {docFolders.map(folder => {
                const isOpen = expanded.has(folder.name);
                const folderFiles = docOnlyFiles.filter(f => f.subfolder === folder.name);
                return (
                  <div key={folder.id} style={{ marginBottom: 8 }}>
                    <button
                      onClick={() => toggleFolder(folder.name)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: isOpen ? '12px 12px 0 0' : 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                    >
                      <svg style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.18s', flexShrink: 0 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                      <span style={{ fontSize: 18 }}>{isOpen ? '📂' : '📁'}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>{folder.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>({folderFiles.length})</span>
                    </button>
                    {isOpen && (
                      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
                        {folderFiles.length === 0
                          ? <div style={{ padding: '16px', fontSize: 13, color: 'var(--text-subtle)', textAlign: 'center' }}>{lang === 'de' ? 'Keine Dateien.' : 'No files.'}</div>
                          : folderFiles.map(f => <DocFileRow key={f.id} file={f} indent />)
                        }
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* ── Invoices flat list ── */
          invoiceFiles.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', padding: '40px 24px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🧾</div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{lang === 'de' ? 'Keine Rechnungen' : 'No invoices yet'}</p>
              <p style={{ fontSize: 13, color: 'var(--text-subtle)', lineHeight: 1.6 }}>{lang === 'de' ? 'Dein PT hat noch keine Rechnungen geteilt.' : 'Your trainer has not shared any invoices yet.'}</p>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              {invoiceFiles.map(f => <DocFileRow key={f.id} file={f} />)}
            </div>
          )
        )}
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 24 }}>
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.display_name ?? profile?.first_name ?? 'User'}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.email}</div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Personal Trainer</h2>
        {pendingRelations.map(r => (
          <div key={r.tc_id} style={{ ...card, padding: '16px 20px', marginBottom: 8, border: '1px solid rgba(245,166,35,0.35)', background: 'rgba(245,166,35,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>{trainerInitials(r.trainer)}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trainerName(r.trainer)}</div>
                <div style={{ fontSize: 12, color: 'rgba(245,166,35,0.9)', marginTop: 2 }}>{lang === 'de' ? '🔔 Coaching-Anfrage' : '🔔 Coaching request'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => onDecline(r.tc_id)} style={{ flex: 1, padding: '9px', borderRadius: 8, fontSize: 14, fontWeight: 500, background: 'rgba(240,68,68,0.1)', border: '1px solid rgba(240,68,68,0.25)', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit' }}>{lang === 'de' ? 'Ablehnen' : 'Decline'}</button>
              <button onClick={() => onAccept(r.tc_id)} style={{ flex: 2, padding: '9px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: 'var(--accent)', border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>{lang === 'de' ? 'Annehmen' : 'Accept'}</button>
            </div>
          </div>
        ))}
        {activeRelations.map(r => (
          <div key={r.tc_id} style={{ ...card, padding: '16px 20px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>{trainerInitials(r.trainer)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trainerName(r.trainer)}</div>
              <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 2 }}>{lang === 'de' ? '✓ Aktiver PT' : '✓ Active PT'}</div>
            </div>
          </div>
        ))}
        {relations.length === 0 && (
          <div style={{ ...card, textAlign: 'center', padding: '24px', border: '1px dashed var(--border)' }}>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {lang === 'de' ? 'Noch kein Personal Trainer verbunden.\nTeile deine E-Mail-Adresse mit deinem PT.' : 'No personal trainer connected yet.\nShare your email address with your PT.'}
            </p>
          </div>
        )}
      </div>

      <div style={{ ...card, marginBottom: 16 }}>
        <MenuRow
          label={lang === 'de' ? 'Dokumente' : 'Documents'}
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
          onClick={openDocs}
        />
      </div>

      <div style={{ ...card, marginBottom: 16 }}>
        <MenuRow label={lang === 'de' ? 'Erscheinungsbild' : 'Appearance'} value={themeId === 'dark' ? (lang === 'de' ? 'Dunkel' : 'Dark') : (lang === 'de' ? 'Hell' : 'Light')} icon={themeId === 'dark' ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>} onClick={toggleTheme} />
        <Divider />
        <MenuRow label={lang === 'de' ? 'Sprache' : 'Language'} value={lang === 'de' ? 'Deutsch' : 'English'} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>} onClick={() => setLang(lang === 'de' ? 'en' : 'de')} />
      </div>

      <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
        <MenuRow label={lang === 'de' ? 'Abmelden' : 'Sign out'} danger icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>} onClick={signOut} />
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-subtle)', textAlign: 'center', marginTop: 24 }}>PTOne Client · v0.1.0</p>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

function getISOWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - day); // nearest Thursday (ISO rule)
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getFullYear()}-${weekNum}`;
}

function calcStreak(sessions: WorkoutSession[]): number {
  const finished = sessions.filter(s => s.finished_at);
  if (finished.length === 0) return 0;
  const workedWeeks = new Set(finished.map(s => getISOWeekKey(new Date(s.finished_at!))));
  let streak = 0;
  const checkDate = new Date();
  // Current week gets a free pass — start counting from last week if this week is empty
  if (!workedWeeks.has(getISOWeekKey(checkDate))) checkDate.setDate(checkDate.getDate() - 7);
  while (streak < 104) {
    if (workedWeeks.has(getISOWeekKey(checkDate))) { streak++; checkDate.setDate(checkDate.getDate() - 7); }
    else break;
  }
  return streak;
}

export default function Dashboard() {
  const router = useRouter();
  const { themeId, toggle: toggleTheme } = useTheme();
  const { lang, setLang } = useTranslation();
  const supabase = useMemo(() => createClient(), []);

  const [tab,           setTab]           = useState<Tab>('plans');
  const [profile,       setProfile]       = useState<Profile | null>(null);
  const [relations,     setRelations]     = useState<PTRelation[]>([]);
  const [assignedPlans, setAssignedPlans] = useState<AssignedPlan[]>([]);
  const [ownPlans,      setOwnPlans]      = useState<OwnPlan[]>([]);
  const [sessions,      setSessions]      = useState<WorkoutSession[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [starting,      setStarting]      = useState(false);
  const [userId,        setUserId]        = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/login'); return; }
      const uid = session.user.id;
      setUserId(uid);

      const [profileRes, tcRes, assignRes, ownRes, sessRes] = await Promise.all([
        supabase.from('profiles').select('first_name, last_name, display_name, email, has_coach').eq('id', uid).single(),
        supabase.from('trainer_clients').select('id, trainer_id, status').eq('client_id', uid).in('status', ['pending', 'active']).order('created_at', { ascending: false }),
        supabase.from('plan_assignments').select('id, plan_id, trainer_id, plans(id, title, description, plan_exercises(count))').eq('client_id', uid),
        supabase.from('plans').select('id, title, description, plan_exercises(count)').eq('user_id', uid).order('created_at', { ascending: false }),
        supabase.from('workout_sessions').select('id, title, status, started_at, finished_at, duration_seconds, total_volume_kg, total_sets, source').eq('user_id', uid).eq('status', 'completed').order('finished_at', { ascending: false }).limit(50),
      ]);

      setProfile(profileRes.data ?? { first_name: session.user.email?.split('@')[0] ?? null, last_name: null, display_name: null, email: session.user.email ?? '', has_coach: false });
      setSessions((sessRes.data ?? []) as WorkoutSession[]);
      setOwnPlans((ownRes.data ?? []).map((p: any) => ({ id: p.id, title: p.title, description: p.description, exercise_count: p.plan_exercises?.[0]?.count ?? 0 })));

      // PT relations
      if (tcRes.data && tcRes.data.length > 0) {
        const ids = tcRes.data.map((r: any) => r.trainer_id);
        const { data: trainerProfiles } = await supabase.from('profiles').select('id, first_name, last_name, display_name, email').in('id', ids);
        const profileMap = new Map((trainerProfiles ?? []).map((p: any) => [p.id, p as TrainerProfile]));
        setRelations(tcRes.data.map((r: any) => ({ tc_id: r.id, status: r.status, trainer: profileMap.get(r.trainer_id) ?? null })));
      }

      // Assigned plans
      if (assignRes.data && assignRes.data.length > 0) {
        const trainerIds = [...new Set(assignRes.data.map((a: any) => a.trainer_id))];
        const { data: ptProfiles } = await supabase.from('profiles').select('id, first_name, last_name, display_name').in('id', trainerIds);
        const ptMap = new Map((ptProfiles ?? []).map((p: any) => [p.id, p]));
        setAssignedPlans(assignRes.data.map((a: any) => {
          const pt = ptMap.get(a.trainer_id);
          const ptName = pt ? (pt.display_name || `${pt.first_name ?? ''} ${pt.last_name ?? ''}`.trim()) : 'PT';
          return { assignment_id: a.id, plan_id: a.plan_id, title: a.plans?.title ?? '', description: a.plans?.description ?? null, exercise_count: a.plans?.plan_exercises?.[0]?.count ?? 0, trainer_name: ptName };
        }));
      }

      setLoading(false);
    });
  }, [router, supabase]);

  async function signOut() {
    await supabase.auth.signOut();
    document.cookie = 'ptone_session=; path=/; max-age=0';
    router.replace('/login');
  }

  async function handleAccept(tcId: string) {
    const { error } = await supabase.from('trainer_clients').update({ status: 'active' }).eq('id', tcId);
    if (!error) {
      setRelations(prev => prev.map(r => r.tc_id === tcId ? { ...r, status: 'active' } : r));
      setProfile(prev => prev ? { ...prev, has_coach: true } : prev);
    }
  }

  async function handleDecline(tcId: string) {
    const { error } = await supabase.from('trainer_clients').update({ status: 'ended' }).eq('id', tcId);
    if (!error) setRelations(prev => prev.filter(r => r.tc_id !== tcId));
  }

  async function startFromPlan(planId: string, title: string) {
    if (!userId || starting) return;
    setStarting(true);
    // Load plan exercises
    const { data: planExs } = await supabase.from('plan_exercises').select('*, plan_sets(*)').eq('plan_id', planId).order('position');
    const { data: session } = await supabase.from('workout_sessions').insert({ user_id: userId, plan_id: planId, title, status: 'active', source: 'plan', started_at: new Date().toISOString() }).select('id').single();
    if (!session) { setStarting(false); return; }

    for (const pe of (planExs ?? [])) {
      const { data: we } = await supabase.from('workout_exercises').insert({ workout_session_id: session.id, exercise_id: pe.exercise_id, position: pe.position, superset_group: pe.superset_group }).select('id').single();
      if (!we) continue;
      const sets = pe.plan_sets ?? [];
      if (sets.length > 0) {
        await supabase.from('sets').insert(sets.sort((a: any, b: any) => a.set_number - b.set_number).map((s: any) => ({ workout_session_id: session.id, workout_exercise_id: we.id, set_number: s.set_number, weight_kg: s.weight_kg, reps: s.reps, is_completed: false })));
      } else {
        await supabase.from('sets').insert([1, 2, 3].map(n => ({ workout_session_id: session.id, workout_exercise_id: we.id, set_number: n, weight_kg: null, reps: null, is_completed: false })));
      }
    }

    router.push(`/workout?session=${session.id}`);
  }

  async function startEmptyWorkout() {
    if (!userId || starting) return;
    setStarting(true);
    const title = `Workout ${new Date().toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    const { data: session } = await supabase.from('workout_sessions').insert({ user_id: userId, title, status: 'active', source: 'own', started_at: new Date().toISOString() }).select('id').single();
    if (session) router.push(`/workout?session=${session.id}`);
    else setStarting(false);
  }

  async function createOwnPlan() {
    if (!userId) return;
    const title = `${lang === 'de' ? 'Mein Plan' : 'My Plan'} ${ownPlans.length + 1}`;
    const { data } = await supabase.from('plans').insert({ user_id: userId, title }).select('id, title, description, plan_exercises(count)').single();
    if (data) setOwnPlans(prev => [{ id: data.id, title: data.title, description: data.description, exercise_count: 0 }, ...prev]);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border-strong)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const firstName    = profile?.first_name ?? '';
  const lastName     = profile?.last_name ?? '';
  const initials     = ((firstName[0] ?? '') + (lastName[0] ?? '')).toUpperCase() || (profile?.email?.[0] ?? '?').toUpperCase();
  const pendingCount = relations.filter(r => r.status === 'pending').length;
  const streak       = calcStreak(sessions);
  const activePtId   = relations.find(r => r.status === 'active')?.trainer?.id ?? null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', paddingBottom: 104 }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-page)', borderBottom: '1px solid var(--border)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <PTOneLogo />
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, userSelect: 'none' }}>{initials}</div>
      </header>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px' }}>
        {tab === 'plans' && <PlansTab profile={profile} lang={lang} assignedPlans={assignedPlans} ownPlans={ownPlans} onStartPlan={startFromPlan} onStartEmpty={startEmptyWorkout} onCreatePlan={createOwnPlan} starting={starting} />}
        {tab === 'logbook' && <LogbookTab lang={lang} sessions={sessions} streak={streak} />}
        {tab === 'journal' && <JournalTab lang={lang} userId={userId!} ptId={activePtId} />}
        {tab === 'account' && <AccountTab profile={profile} initials={initials} themeId={themeId} toggleTheme={toggleTheme} lang={lang} setLang={setLang} signOut={signOut} relations={relations} onAccept={handleAccept} onDecline={handleDecline} userId={userId!} />}
      </div>

      <nav style={{ position: 'fixed', bottom: 20, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 100, padding: '0 16px', pointerEvents: 'none' }}>
        <div style={{ width: '100%', maxWidth: 480, background: 'rgba(20,20,22,0.88)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 22, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', display: 'flex', padding: 6, gap: 4, pointerEvents: 'auto' }}>
          {NAV_ITEMS.map(item => {
            const active = tab === item.id;
            const badge  = item.id === 'account' ? pendingCount : 0;
            return (
              <button key={item.id} onClick={() => setTab(item.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '9px 8px', borderRadius: 16, border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s, color 0.15s', background: active ? 'rgba(124,106,255,0.18)' : 'transparent', color: active ? 'var(--accent)' : 'var(--text-subtle)', position: 'relative' }}>
                <div style={{ position: 'relative', display: 'inline-flex' }}>
                  <item.Icon active={active} />
                  {badge > 0 && <div style={{ position: 'absolute', top: -2, right: -3, width: 9, height: 9, borderRadius: '50%', background: '#f04444', border: '1.5px solid rgba(20,20,22,0.88)' }} />}
                </div>
                <span style={{ fontSize: 11, fontWeight: active ? 600 : 400, letterSpacing: '-0.01em' }}>{item.label[lang]}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
