'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/Sidebar'

interface JournalEntry {
  id: string
  week_label: string
  year: number
  week_number: number | null
  weight_kg: number | null
  waist_cm: number | null
  avg_score: number | null
  notes: string | null
  submitted_at: string | null
  status: string | null
  template_id: string | null
}

interface Response {
  question_id: string
  value_text: string | null
  value_score: number | null
}

interface TemplateSection {
  id: string
  type: 'heading' | 'scale' | 'text' | 'dropdown'
  title?: string
  question?: string
  min?: number
  max?: number
  label_min?: string
  label_max?: string
  options?: string[]
}

interface ClientProfile {
  first_name: string | null
  last_name: string | null
  display_name: string | null
  email: string
}

function getDisplayName(p: ClientProfile | null) {
  if (!p) return '—'
  return p.display_name || `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.email
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('de-CH', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ─── Entry detail panel ───────────────────────────────────────────────────────

function EntryDetail({ entry, supabase }: { entry: JournalEntry; supabase: ReturnType<typeof createClient> }) {
  const [responses, setResponses] = useState<Response[]>([])
  const [sections, setSections] = useState<TemplateSection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    async function load() {
      const [respRes, tmplRes] = await Promise.all([
        supabase.from('journal_responses').select('question_id, value_text, value_score').eq('entry_id', entry.id),
        entry.template_id
          ? supabase.from('journal_templates').select('sections').eq('id', entry.template_id).single()
          : Promise.resolve({ data: null }),
      ])
      setResponses((respRes.data ?? []) as Response[])
      setSections(((tmplRes as any).data?.sections ?? []) as TemplateSection[])
      setLoading(false)
    }
    load()
  }, [entry.id])

  const responseMap = new Map(responses.map(r => [r.question_id, r]))

  function ScoreBar({ score, min = 1, max = 10 }: { score: number; min?: number; max?: number }) {
    const pct = ((score - min) / (max - min)) * 100
    const color = pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--danger)'
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: color, transition: 'width 0.3s' }} />
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color, minWidth: 28, textAlign: 'right' }}>{score}</span>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{entry.week_label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{entry.submitted_at ? formatDate(entry.submitted_at) : '—'}</div>
      </div>

      {/* Measurements */}
      {(entry.weight_kg != null || entry.waist_cm != null || entry.avg_score != null) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', padding: '12px 20px', borderBottom: '1px solid var(--border)', gap: 8 }}>
          {[
            { label: 'Gewicht', value: entry.weight_kg != null ? `${entry.weight_kg} kg` : '—' },
            { label: 'Bauchumfang', value: entry.waist_cm != null ? `${entry.waist_cm} cm` : '—' },
            { label: 'Ø Score', value: entry.avg_score != null ? `${Number(entry.avg_score).toFixed(1)}/10` : '—' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--accent)' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Responses */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '28px' }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--border-strong)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : sections.length === 0 ? (
        <div style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>Keine Vorlage verknüpft</div>
      ) : (
        <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sections.map(section => {
            const resp = responseMap.get(section.id)
            if (section.type === 'heading') return (
              <div key={section.id} style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', paddingTop: 4, borderTop: '1px solid var(--border)' }}>{section.title}</div>
            )
            return (
              <div key={section.id}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6, lineHeight: 1.5 }}>{section.question}</div>
                {section.type === 'scale' && resp?.value_score != null && (
                  <>
                    <ScoreBar score={resp.value_score} min={section.min} max={section.max} />
                    {(section.label_min || section.label_max) && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-subtle)' }}>{section.label_min}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-subtle)' }}>{section.label_max}</span>
                      </div>
                    )}
                  </>
                )}
                {section.type === 'scale' && resp?.value_score == null && (
                  <span style={{ fontSize: 13, color: 'var(--text-subtle)' }}>—</span>
                )}
                {(section.type === 'text' || section.type === 'dropdown') && (
                  <div style={{ fontSize: 14, color: resp?.value_text ? 'var(--text-primary)' : 'var(--text-subtle)', background: 'var(--bg-tertiary)', borderRadius: 8, padding: '8px 12px', lineHeight: 1.6 }}>
                    {resp?.value_text ?? '—'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {entry.notes && (
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-tertiary)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>NOTIZ</div>
          <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>{entry.notes}</div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientJournalPage() {
  const router = useRouter()
  const params = useParams<{ clientId: string }>()
  const clientId = params.clientId
  const supabase = useMemo(() => createClient(), [])

  const [client, setClient] = useState<ClientProfile | null>(null)
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }

      const [profileRes, entriesRes] = await Promise.all([
        supabase.from('profiles').select('first_name, last_name, display_name, email').eq('id', clientId).single(),
        supabase.from('journal_entries')
          .select('id, week_label, year, week_number, weight_kg, waist_cm, avg_score, notes, submitted_at, status, template_id')
          .eq('client_id', clientId).eq('pt_id', session.user.id)
          .order('submitted_at', { ascending: false }).limit(100),
      ])

      setClient(profileRes.data as ClientProfile)
      const rows = (entriesRes.data ?? []) as JournalEntry[]
      setEntries(rows)
      if (rows.length > 0) setSelectedId(rows[0].id)
      setLoading(false)
    }
    load()
  }, [clientId])

  const selectedEntry = entries.find(e => e.id === selectedId) ?? null

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border-strong)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Sidebar />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <main style={{ flex: 1, marginLeft: 'var(--sidebar-width)', minHeight: '100vh', transition: 'margin-left 0.2s ease' }}>
        <div style={{ borderBottom: '1px solid var(--border)', padding: '16px 40px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={() => router.push('/journal')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0, fontFamily: 'inherit' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            Journal
          </button>
          <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{getDisplayName(client)}</h1>
        </div>

        <div style={{ padding: '28px 40px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {/* Left: entry list */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {entries.length === 0 ? (
              <div style={{ background: 'var(--bg-card)', border: '1px dashed var(--border-strong)', borderRadius: 14, padding: '40px', textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Noch keine Journal-Einreichungen.</p>
              </div>
            ) : entries.map(e => {
              const isSelected = selectedId === e.id
              return (
                <button key={e.id} onClick={() => setSelectedId(e.id)} style={{ width: '100%', padding: '10px 14px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 10, transition: 'all 0.15s', background: isSelected ? 'rgba(124,106,255,0.1)' : 'var(--bg-card)', border: isSelected ? '1px solid rgba(124,106,255,0.4)' : '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{e.week_label}</span>
                    {e.status === 'reviewed' && <span style={{ fontSize: 10, color: 'var(--success)' }}>✓</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {e.avg_score != null && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ø {Number(e.avg_score).toFixed(1)}</span>}
                    {e.weight_kg != null && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.weight_kg} kg</span>}
                    <span style={{ fontSize: 11, color: 'var(--text-subtle)', marginLeft: 'auto' }}>{e.submitted_at ? new Date(e.submitted_at).toLocaleDateString('de-CH', { day: 'numeric', month: 'short' }) : '—'}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Right: entry detail */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {selectedEntry ? (
              <EntryDetail entry={selectedEntry} supabase={supabase} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280, background: 'var(--bg-card)', border: '1px dashed var(--border-strong)', borderRadius: 14 }}>
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Eintrag auswählen</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
