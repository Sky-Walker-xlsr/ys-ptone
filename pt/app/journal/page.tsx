'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PageShell, EmptyState } from '@/components/PageShell'

// ─── Types ───────────────────────────────────────────────────────────────────

type PageTab = 'entries' | 'templates' | 'clients'
type SectionType = 'heading' | 'scale' | 'text' | 'dropdown'

interface JournalEntry {
  id: string
  client_id: string
  week_label: string
  year: number
  week_number: number | null
  weight_kg: number | null
  waist_cm: number | null
  avg_score: number | null
  submitted_at: string | null
  status: string | null
  clientName: string
}

interface ClientOption { id: string; name: string }

interface TemplateSection {
  id: string
  type: SectionType
  title?: string
  question?: string
  min?: number
  max?: number
  label_min?: string
  label_max?: string
  options?: string[]
}

interface Template {
  id: string
  name: string
  description: string | null
  intro_text: string | null
  sections: TemplateSection[]
  is_default: boolean
}

interface ClientRow {
  id: string
  name: string
  assignmentId: string | null
  templateId: string | null
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_SECTIONS: TemplateSection[] = [
  { id: 'dq1', type: 'scale', question: 'Training – Wie gut hast du deinen Trainingsplan diese Woche umgesetzt?', min: 1, max: 10, label_min: 'gar nicht', label_max: 'vollständig' },
  { id: 'dq2', type: 'scale', question: 'Ernährung – Wie konsequent warst du bei deiner Ernährung?', min: 1, max: 10, label_min: 'gar nicht', label_max: 'vollständig' },
  { id: 'dq3', type: 'scale', question: 'Aktivität / Umsetzung – Wie konstant warst du insgesamt diese Woche?', min: 1, max: 10, label_min: 'sehr schlecht', label_max: 'sehr gut' },
  { id: 'dq4', type: 'scale', question: 'Energie / Schlaf – Wie war dein Energielevel und dein Schlaf diese Woche?', min: 1, max: 10, label_min: 'sehr schlecht', label_max: 'sehr gut' },
  { id: 'dq5', type: 'scale', question: 'Sicherheit im Training – Wie sicher hast du dich bei den Übungen gefühlt?', min: 1, max: 10, label_min: 'sehr unsicher', label_max: 'sehr sicher' },
  { id: 'dq6', type: 'text', question: 'Was war die grösste Herausforderung diese Woche?' },
]

const DEFAULT_INTRO = 'Versuche die Fragen möglichst ehrlich und spontan zu beantworten – der Fragebogen dient zur persönlichen Fortschrittskontrolle und als Grundlage für den nächsten Coaching-Termin.\n\n1 = sehr schlecht / gar nicht umgesetzt\n10 = sehr gut / vollständig umgesetzt'

const TYPE_LABELS: Record<SectionType, string> = {
  heading: 'Überschrift', scale: 'Skala 1–10', text: 'Freitext', dropdown: 'Dropdown',
}
const TYPE_COLORS: Record<SectionType, string> = {
  heading: 'rgba(245,166,35,0.15)', scale: 'rgba(124,106,255,0.12)', text: 'rgba(62,207,142,0.12)', dropdown: 'rgba(255,149,0,0.12)',
}

function newId() { return Math.random().toString(36).slice(2, 10) }
function formatDate(d: string) { return new Date(d).toLocaleDateString('de-CH', { day: 'numeric', month: 'short', year: 'numeric' }) }
function getISOWeek(date: Date): { week: number; year: number } {
  const d = new Date(date); d.setHours(12, 0, 0, 0)
  const day = d.getDay() || 7; d.setDate(d.getDate() + 4 - day)
  const yearStart = new Date(d.getFullYear(), 0, 1)
  return { week: Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7), year: d.getFullYear() }
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ section, index, total, onChange, onMove, onDelete }: {
  section: TemplateSection; index: number; total: number
  onChange: (s: TemplateSection) => void; onMove: (dir: -1 | 1) => void; onDelete: () => void
}) {
  const inp: React.CSSProperties = { width: '100%', padding: '7px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-page)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }
  const btn = (disabled?: boolean): React.CSSProperties => ({ background: 'none', border: 'none', borderRadius: 6, color: disabled ? 'var(--text-subtle)' : 'var(--text-muted)', cursor: disabled ? 'not-allowed' : 'pointer', padding: '3px 6px', fontSize: 14, lineHeight: 1, opacity: disabled ? 0.35 : 1 })
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: TYPE_COLORS[section.type], borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{TYPE_LABELS[section.type]}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
          <button onClick={() => onMove(-1)} disabled={index === 0} style={btn(index === 0)}>↑</button>
          <button onClick={() => onMove(1)} disabled={index === total - 1} style={btn(index === total - 1)}>↓</button>
          <button onClick={onDelete} style={{ ...btn(), color: 'var(--danger)' }}>×</button>
        </div>
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {section.type === 'heading' && (
          <input value={section.title ?? ''} onChange={e => onChange({ ...section, title: e.target.value })} placeholder="Überschrift…" style={inp} />
        )}
        {section.type !== 'heading' && (
          <textarea value={section.question ?? ''} onChange={e => onChange({ ...section, question: e.target.value })} placeholder="Frage…" rows={2} style={{ ...inp, resize: 'none' }} />
        )}
        {section.type === 'scale' && (
          <div style={{ display: 'grid', gridTemplateColumns: '60px 60px 1fr 1fr', gap: 6 }}>
            <input type="number" value={section.min ?? 1} onChange={e => onChange({ ...section, min: parseInt(e.target.value) || 1 })} placeholder="Min" style={{ ...inp, textAlign: 'center' }} />
            <input type="number" value={section.max ?? 10} onChange={e => onChange({ ...section, max: parseInt(e.target.value) || 10 })} placeholder="Max" style={{ ...inp, textAlign: 'center' }} />
            <input value={section.label_min ?? ''} onChange={e => onChange({ ...section, label_min: e.target.value })} placeholder="Label Min" style={inp} />
            <input value={section.label_max ?? ''} onChange={e => onChange({ ...section, label_max: e.target.value })} placeholder="Label Max" style={inp} />
          </div>
        )}
        {section.type === 'dropdown' && (
          <input value={section.options?.join(', ') ?? ''} onChange={e => onChange({ ...section, options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="Optionen, kommagetrennt: Sehr gut, Gut, Mittel, Schlecht" style={inp} />
        )}
      </div>
    </div>
  )
}

// ─── Template Editor ──────────────────────────────────────────────────────────

function TemplateEditor({ template, onSaved }: { template: Template; onSaved: (t: Template) => void }) {
  const supabase = useMemo(() => createClient(), [])
  const [name, setName] = useState(template.name)
  const [description, setDescription] = useState(template.description ?? '')
  const [introText, setIntroText] = useState(template.intro_text ?? '')
  const [sections, setSections] = useState<TemplateSection[]>(template.sections)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [addingType, setAddingType] = useState(false)

  useEffect(() => {
    setName(template.name); setDescription(template.description ?? ''); setIntroText(template.intro_text ?? ''); setSections(template.sections)
  }, [template.id])

  function moveSection(index: number, dir: -1 | 1) {
    const s = [...sections]; const target = index + dir
    if (target < 0 || target >= s.length) return
    ;[s[index], s[target]] = [s[target], s[index]]; setSections(s)
  }

  function addSection(type: SectionType) {
    setSections(prev => [...prev, { id: newId(), type, min: type === 'scale' ? 1 : undefined, max: type === 'scale' ? 10 : undefined }])
    setAddingType(false)
  }

  async function handleSave() {
    setSaving(true)
    const { data } = await supabase.from('journal_templates')
      .update({ name: name.trim(), description: description.trim() || null, intro_text: introText.trim() || null, sections })
      .eq('id', template.id).select().single()
    setSaving(false); setSaved(true)
    if (data) onSaved(data as Template)
    setTimeout(() => setSaved(false), 2000)
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-page)', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5 }}>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Vorlage Bezeichnung" style={inp} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5 }}>Beschreibung</label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional" style={inp} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5 }}>Einleitungstext (wird dem Client angezeigt)</label>
          <textarea value={introText} onChange={e => setIntroText(e.target.value)} placeholder="Hinweis oder Einleitung für den Client…" rows={3} style={{ ...inp, resize: 'none' }} />
        </div>
      </div>

      <div style={{ background: 'rgba(124,106,255,0.06)', border: '1px solid rgba(124,106,255,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)' }}>
        Gewicht (kg) und Bauchumfang (cm) werden automatisch bei jeder Einreichung abgefragt.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Fragen ({sections.length})</div>
        {sections.map((s, i) => (
          <SectionCard key={s.id} section={s} index={i} total={sections.length}
            onChange={updated => setSections(prev => prev.map((x, idx) => idx === i ? updated : x))}
            onMove={dir => moveSection(i, dir)}
            onDelete={() => setSections(prev => prev.filter((_, idx) => idx !== i))}
          />
        ))}
        {addingType ? (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['heading', 'scale', 'text', 'dropdown'] as SectionType[]).map(type => (
              <button key={type} onClick={() => addSection(type)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border-strong)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                + {TYPE_LABELS[type]}
              </button>
            ))}
            <button onClick={() => setAddingType(false)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Abbrechen</button>
          </div>
        ) : (
          <button onClick={() => setAddingType(true)} style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px dashed rgba(124,106,255,0.4)', background: 'rgba(124,106,255,0.05)', color: 'var(--accent)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Frage hinzufügen
          </button>
        )}
      </div>

      <button onClick={handleSave} disabled={saving || !name.trim()} style={{ padding: '11px', borderRadius: 10, background: saved ? 'var(--success)' : name.trim() ? 'var(--accent)' : 'var(--bg-tertiary)', color: name.trim() ? '#fff' : 'var(--text-muted)', border: 'none', fontSize: 14, fontWeight: 600, cursor: name.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'background 0.2s' }}>
        {saving ? 'Speichern…' : saved ? '✓ Gespeichert' : 'Speichern'}
      </button>
    </div>
  )
}

// ─── Tab 1: Einreichungen ─────────────────────────────────────────────────────

function EntriesTab({ trainerId }: { trainerId: string }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [clientFilter, setClientFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: tc } = await supabase.from('trainer_clients')
        .select('client_id').eq('trainer_id', trainerId).eq('status', 'active')
      if (!tc || tc.length === 0) { setLoading(false); return }
      const clientIds = tc.map((r: any) => r.client_id)
      const { data: profileRows } = await supabase.from('profiles')
        .select('id, first_name, last_name, display_name, email').in('id', clientIds)
      const nameMap = new Map<string, string>((profileRows ?? []).map((p: any) => [
        p.id, p.display_name || `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.email
      ]))
      setClients(clientIds.map((id: string) => ({ id, name: nameMap.get(id) ?? '?' })))
      const { data: rows } = await supabase.from('journal_entries')
        .select('id, client_id, week_label, year, week_number, weight_kg, waist_cm, avg_score, submitted_at, status')
        .in('client_id', clientIds).order('submitted_at', { ascending: false }).limit(200)
      setEntries((rows ?? []).map((r: any) => ({ ...r, clientName: nameMap.get(r.client_id) ?? '?' })))
      setLoading(false)
    }
    load()
  }, [trainerId])

  const filtered = clientFilter === 'all' ? entries : entries.filter(e => e.client_id === clientFilter)
  const { week: thisWeek, year: thisYear } = getISOWeek(new Date())
  const thisWeekEntries = filtered.filter(e => e.week_number === thisWeek && e.year === thisYear)

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--border-strong)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} /></div>

  return (
    <>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} style={{ padding: '8px 32px 8px 12px', borderRadius: 8, fontSize: 14, background: 'var(--bg-card)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)', fontFamily: 'inherit', cursor: 'pointer', appearance: 'none', outline: 'none' }}>
            <option value="all">Alle Clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <svg style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-subtle)" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-subtle)', marginLeft: 'auto' }}>{filtered.length} Einreichungen</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Diese Woche', value: thisWeekEntries.length, color: 'var(--accent)' },
          { label: 'Ausstehend', value: Math.max(0, clients.length - thisWeekEntries.length), color: 'var(--warning)' },
          { label: 'Gesamt', value: filtered.length, color: 'var(--success)' },
        ].map(card => (
          <div key={card.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: card.color }}>{card.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>}
          title="Noch keine Einreichungen"
          message="Sobald Clients ihr Wochenjournal einreichen, erscheint es hier."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(e => (
            <button key={e.id} onClick={() => router.push(`/journal/clients/${e.client_id}`)} style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{e.clientName}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 5, padding: '1px 7px' }}>{e.week_label}</span>
                  {e.status === 'reviewed' && <span style={{ fontSize: 10, color: 'var(--success)', background: 'rgba(62,207,142,0.1)', border: '1px solid rgba(62,207,142,0.3)', borderRadius: 5, padding: '1px 7px' }}>✓ Reviewed</span>}
                </div>
                <div style={{ display: 'flex', gap: 14 }}>
                  {e.avg_score != null && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ø {Number(e.avg_score).toFixed(1)}/10</span>}
                  {e.weight_kg != null && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{e.weight_kg} kg</span>}
                  {e.waist_cm != null && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{e.waist_cm} cm</span>}
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>{e.submitted_at ? formatDate(e.submitted_at) : '—'}</div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-subtle)" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          ))}
        </div>
      )}
    </>
  )
}

// ─── Tab 2: Vorlagen ──────────────────────────────────────────────────────────

function TemplatesTab({ trainerId }: { trainerId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('journal_templates')
        .select('id, name, description, intro_text, sections, is_default')
        .eq('trainer_id', trainerId).order('created_at', { ascending: false })
      setTemplates((data ?? []) as Template[])
      if (data && data.length > 0) setSelectedId(data[0].id)
    }
    load()
  }, [trainerId])

  async function createTemplate(fromDefault = false) {
    setCreating(true)
    const { data } = await supabase.from('journal_templates').insert({
      trainer_id: trainerId,
      name: fromDefault ? 'Wochenjournal (Standard)' : 'Neue Vorlage',
      description: fromDefault ? 'Wöchentliches Check-in basierend auf dem Standard-Fragebogen' : null,
      intro_text: fromDefault ? DEFAULT_INTRO : null,
      sections: fromDefault ? DEFAULT_SECTIONS : [],
    }).select('id, name, description, intro_text, sections, is_default').single()
    if (data) { setTemplates(prev => [data as Template, ...prev]); setSelectedId(data.id) }
    setCreating(false)
  }

  async function deleteTemplate(id: string) {
    await supabase.from('journal_templates').delete().eq('id', id)
    const remaining = templates.filter(t => t.id !== id)
    setTemplates(remaining)
    if (selectedId === id) setSelectedId(remaining[0]?.id ?? null)
  }

  const selectedTemplate = templates.find(t => t.id === selectedId) ?? null

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      {/* Left: list */}
      <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button onClick={() => createTemplate(false)} disabled={creating} style={{ padding: '8px 14px', borderRadius: 9, background: 'var(--accent)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {creating ? '…' : '+ Neue Vorlage'}
          </button>
          <button onClick={() => createTemplate(true)} disabled={creating} style={{ padding: '8px 14px', borderRadius: 9, background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            Standard laden (CSV)
          </button>
        </div>
        {templates.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1px dashed var(--border-strong)', borderRadius: 12, padding: '24px 14px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Noch keine Vorlagen.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {templates.map(t => {
              const isSelected = selectedId === t.id
              return (
                <div key={t.id} style={{ borderRadius: 10, background: isSelected ? 'rgba(124,106,255,0.1)' : 'var(--bg-card)', border: isSelected ? '1px solid rgba(124,106,255,0.4)' : '1px solid var(--border)', display: 'flex', alignItems: 'stretch', transition: 'all 0.15s' }}>
                  <button onClick={() => setSelectedId(t.id)} style={{ flex: 1, padding: '10px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>{t.sections.length} Fragen</div>
                  </button>
                  <button onClick={() => deleteTemplate(t.id)} style={{ padding: '0 10px', background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', fontSize: 16 }}>×</button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Right: editor */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {selectedTemplate ? (
          <TemplateEditor
            key={selectedTemplate.id}
            template={selectedTemplate}
            onSaved={updated => setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t))}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, background: 'var(--bg-card)', border: '1px dashed var(--border-strong)', borderRadius: 14 }}>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Vorlage auswählen oder erstellen</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab 3: Client-Verwaltung ─────────────────────────────────────────────────

function ClientsTab({ trainerId }: { trainerId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [clients, setClients] = useState<ClientRow[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [tcRes, tmplRes, asgnRes] = await Promise.all([
        supabase.from('trainer_clients')
          .select('client_id').eq('trainer_id', trainerId).eq('status', 'active'),
        supabase.from('journal_templates')
          .select('id, name, description, intro_text, sections, is_default')
          .eq('trainer_id', trainerId).order('created_at', { ascending: false }),
        supabase.from('journal_assignments')
          .select('id, client_id, template_id').eq('trainer_id', trainerId),
      ])
      const clientIds = (tcRes.data ?? []).map((r: any) => r.client_id)
      const asgnMap = new Map((asgnRes.data ?? []).map((a: any) => [a.client_id, { id: a.id, templateId: a.template_id }]))
      setTemplates((tmplRes.data ?? []) as Template[])
      if (clientIds.length > 0) {
        const { data: profileRows } = await supabase.from('profiles')
          .select('id, first_name, last_name, display_name, email').in('id', clientIds)
        const nameMap = new Map((profileRows ?? []).map((p: any) => [
          p.id, p.display_name || `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.email
        ]))
        setClients(clientIds.map((id: string) => {
          const asgn = asgnMap.get(id)
          return { id, name: nameMap.get(id) ?? '?', assignmentId: asgn?.id ?? null, templateId: asgn?.templateId ?? null }
        }))
      }
      setLoading(false)
    }
    load()
  }, [trainerId])

  async function setClientTemplate(client: ClientRow, templateId: string | null) {
    setSaving(client.id)
    if (templateId === null) {
      if (client.assignmentId) {
        await supabase.from('journal_assignments').delete().eq('id', client.assignmentId)
        setClients(prev => prev.map(c => c.id === client.id ? { ...c, assignmentId: null, templateId: null } : c))
      }
    } else {
      const { data } = await supabase.from('journal_assignments')
        .upsert({ trainer_id: trainerId, client_id: client.id, template_id: templateId }, { onConflict: 'trainer_id,client_id' })
        .select('id').single()
      if (data) setClients(prev => prev.map(c => c.id === client.id ? { ...c, assignmentId: data.id, templateId } : c))
    }
    setSaving(null)
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--border-strong)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} /></div>

  if (clients.length === 0) return (
    <div style={{ background: 'var(--bg-card)', border: '1px dashed var(--border-strong)', borderRadius: 14, padding: '60px 40px', textAlign: 'center' }}>
      <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Noch keine aktiven Clients.</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {templates.length === 0 && (
        <div style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 10, padding: '10px 16px', fontSize: 13, color: 'var(--warning)', marginBottom: 8 }}>
          Erstelle zuerst eine Vorlage im Tab «Vorlagen», um sie Clients zuzuweisen.
        </div>
      )}
      {clients.map(client => (
        <div key={client.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
            {client.name[0]?.toUpperCase() ?? '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{client.name}</div>
            <div style={{ fontSize: 12, color: client.templateId ? 'var(--success)' : 'var(--text-muted)', marginTop: 2 }}>
              {client.templateId ? `✓ ${templates.find(t => t.id === client.templateId)?.name ?? '—'}` : 'Kein Journal zugewiesen'}
            </div>
          </div>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <select
              value={client.templateId ?? ''}
              onChange={e => setClientTemplate(client, e.target.value || null)}
              disabled={saving === client.id || templates.length === 0}
              style={{ padding: '8px 36px 8px 12px', borderRadius: 8, fontSize: 13, background: 'var(--bg-tertiary)', border: `1px solid ${client.templateId ? 'rgba(62,207,142,0.4)' : 'var(--border-strong)'}`, color: client.templateId ? 'var(--text-primary)' : 'var(--text-muted)', fontFamily: 'inherit', cursor: 'pointer', appearance: 'none', outline: 'none', minWidth: 200 }}
            >
              <option value="">Kein Journal</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {saving === client.id
              ? <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
              : <svg style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-subtle)" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
            }
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS: { id: PageTab; label: string }[] = [
  { id: 'entries',   label: 'Einreichungen' },
  { id: 'templates', label: 'Vorlagen' },
  { id: 'clients',   label: 'Client-Verwaltung' },
]

export default function JournalPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [tab, setTab] = useState<PageTab>('entries')
  const [trainerId, setTrainerId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }
      setTrainerId(session.user.id)
    })
  }, [])

  if (!trainerId) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border-strong)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <PageShell title="Journal" subtitle="Wöchentliche Check-ins, Vorlagen und Client-Verwaltung.">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 28, gap: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? 'var(--accent)' : 'var(--text-muted)', borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: -1, transition: 'color 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'entries'   && <EntriesTab   trainerId={trainerId} />}
      {tab === 'templates' && <TemplatesTab  trainerId={trainerId} />}
      {tab === 'clients'   && <ClientsTab   trainerId={trainerId} />}
    </PageShell>
  )
}
