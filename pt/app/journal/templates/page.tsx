'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageShell } from '@/components/PageShell'

// ─── Types ───────────────────────────────────────────────────────────────────

type SectionType = 'heading' | 'scale' | 'text' | 'dropdown'

interface TemplateSection {
  id: string
  type: SectionType
  title?: string       // heading
  question?: string    // scale, text, dropdown
  min?: number         // scale
  max?: number         // scale
  label_min?: string   // scale
  label_max?: string   // scale
  options?: string[]   // dropdown
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

function newId() { return Math.random().toString(36).slice(2, 10) }

const TYPE_LABELS: Record<SectionType, string> = {
  heading: 'Überschrift', scale: 'Skala 1–10', text: 'Freitext', dropdown: 'Dropdown',
}
const TYPE_COLORS: Record<SectionType, string> = {
  heading: 'rgba(245,166,35,0.15)', scale: 'rgba(124,106,255,0.12)', text: 'rgba(62,207,142,0.12)', dropdown: 'rgba(255,149,0,0.12)',
}

// ─── Section Editor Card ──────────────────────────────────────────────────────

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
            <input value={section.label_min ?? ''} onChange={e => onChange({ ...section, label_min: e.target.value })} placeholder="Label Min (z.B. sehr schlecht)" style={inp} />
            <input value={section.label_max ?? ''} onChange={e => onChange({ ...section, label_max: e.target.value })} placeholder="Label Max (z.B. sehr gut)" style={inp} />
          </div>
        )}
        {section.type === 'dropdown' && (
          <input value={section.options?.join(', ') ?? ''} onChange={e => onChange({ ...section, options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="Optionen, kommagetrennt: Sehr gut, Gut, Mittel, Schlecht" style={inp} />
        )}
      </div>
    </div>
  )
}

// ─── Template Editor (right panel) ───────────────────────────────────────────

function TemplateEditor({ template, trainerId, onSaved }: { template: Template; trainerId: string; onSaved: (t: Template) => void }) {
  const supabase = useMemo(() => createClient(), [])
  const [name, setName] = useState(template.name)
  const [description, setDescription] = useState(template.description ?? '')
  const [introText, setIntroText] = useState(template.intro_text ?? '')
  const [sections, setSections] = useState<TemplateSection[]>(template.sections)
  const [clients, setClients] = useState<ClientRow[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [addingType, setAddingType] = useState(false)

  useEffect(() => {
    setName(template.name); setDescription(template.description ?? ''); setIntroText(template.intro_text ?? ''); setSections(template.sections)
  }, [template.id])

  useEffect(() => {
    async function loadClients() {
      const { data: tc } = await supabase.from('trainer_clients')
        .select('client_id, profiles!client_id(first_name, last_name, display_name, email)')
        .eq('trainer_id', trainerId).eq('status', 'active')
      const { data: asgn } = await supabase.from('journal_assignments')
        .select('id, client_id').eq('trainer_id', trainerId).eq('template_id', template.id)

      const asgnMap = new Map((asgn ?? []).map((a: any) => [a.client_id, a.id]))
      setClients((tc ?? []).map((row: any) => {
        const p = row.profiles
        const name = p ? (p.display_name || `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.email) : '?'
        return { id: row.client_id, name, assignmentId: asgnMap.get(row.client_id) ?? null }
      }))
    }
    loadClients()
  }, [template.id, trainerId])

  function moveSection(index: number, dir: -1 | 1) {
    const s = [...sections]
    const target = index + dir
    if (target < 0 || target >= s.length) return;
    [s[index], s[target]] = [s[target], s[index]]
    setSections(s)
  }

  function addSection(type: SectionType) {
    const newSection: TemplateSection = { id: newId(), type, min: type === 'scale' ? 1 : undefined, max: type === 'scale' ? 10 : undefined }
    setSections(prev => [...prev, newSection])
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

  async function toggleAssignment(client: ClientRow) {
    if (client.assignmentId) {
      await supabase.from('journal_assignments').delete().eq('id', client.assignmentId)
      setClients(prev => prev.map(c => c.id === client.id ? { ...c, assignmentId: null } : c))
    } else {
      const { data } = await supabase.from('journal_assignments')
        .upsert({ trainer_id: trainerId, client_id: client.id, template_id: template.id }, { onConflict: 'trainer_id,client_id' })
        .select('id').single()
      if (data) setClients(prev => prev.map(c => c.id === client.id ? { ...c, assignmentId: data.id } : c))
    }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-page)', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit', outline: 'none' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Meta */}
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

      {/* Measurements note */}
      <div style={{ background: 'rgba(124,106,255,0.06)', border: '1px solid rgba(124,106,255,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)' }}>
        Gewicht (kg) und Bauchumfang (cm) werden automatisch bei jeder Einreichung abgefragt.
      </div>

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Fragen ({sections.length})</div>
        {sections.map((s, i) => (
          <SectionCard key={s.id} section={s} index={i} total={sections.length}
            onChange={updated => setSections(prev => prev.map((x, idx) => idx === i ? updated : x))}
            onMove={dir => moveSection(i, dir)}
            onDelete={() => setSections(prev => prev.filter((_, idx) => idx !== i))}
          />
        ))}

        {/* Add section */}
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

      {/* Assign to clients */}
      {clients.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 18px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>Clients zuweisen</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {clients.map(c => (
              <button key={c.id} onClick={() => toggleAssignment(c)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, border: c.assignmentId ? '1px solid rgba(62,207,142,0.4)' : '1px solid var(--border)', background: c.assignmentId ? 'rgba(62,207,142,0.08)' : 'var(--bg-tertiary)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%' }}>
                <div style={{ width: 18, height: 18, borderRadius: 4, border: c.assignmentId ? '2px solid var(--success)' : '1px solid var(--border-strong)', background: c.assignmentId ? 'var(--success)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {c.assignmentId && <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><polyline points="2 6 5 9 10 3"/></svg>}
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{c.name}</span>
                {c.assignmentId && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--success)' }}>Zugewiesen</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Save */}
      <button onClick={handleSave} disabled={saving || !name.trim()} style={{ padding: '11px', borderRadius: 10, background: saved ? 'var(--success)' : name.trim() ? 'var(--accent)' : 'var(--bg-tertiary)', color: name.trim() ? '#fff' : 'var(--text-muted)', border: 'none', fontSize: 14, fontWeight: 600, cursor: name.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'background 0.2s' }}>
        {saving ? 'Speichern…' : saved ? '✓ Gespeichert' : 'Speichern'}
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JournalTemplatesPage() {
  const supabase = useMemo(() => createClient(), [])
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [trainerId, setTrainerId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setTrainerId(session.user.id)
      const { data } = await supabase.from('journal_templates')
        .select('id, name, description, intro_text, sections, is_default')
        .eq('trainer_id', session.user.id)
        .order('created_at', { ascending: false })
      setTemplates((data ?? []) as Template[])
      if (data && data.length > 0) setSelectedId(data[0].id)
      setLoading(false)
    }
    load()
  }, [])

  async function createTemplate(fromDefault = false) {
    setCreating(true)
    const { data } = await supabase.from('journal_templates').insert({
      trainer_id: trainerId,
      name: fromDefault ? 'Wochenjournal (Standard)' : 'Neue Vorlage',
      description: fromDefault ? 'Wöchentliches Check-in basierend auf dem Standard-Fragebogen' : null,
      intro_text: fromDefault ? DEFAULT_INTRO : null,
      sections: fromDefault ? DEFAULT_SECTIONS : [],
    }).select('id, name, description, intro_text, sections, is_default').single()
    if (data) {
      setTemplates(prev => [data as Template, ...prev])
      setSelectedId(data.id)
    }
    setCreating(false)
  }

  async function deleteTemplate(id: string) {
    await supabase.from('journal_templates').delete().eq('id', id)
    setTemplates(prev => prev.filter(t => t.id !== id))
    if (selectedId === id) setSelectedId(templates.find(t => t.id !== id)?.id ?? null)
  }

  const selectedTemplate = templates.find(t => t.id === selectedId) ?? null

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border-strong)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <PageShell title="Journal-Vorlagen" subtitle="Erstelle und verwalte Fragebogen-Vorlagen für deine Clients.">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Left: template list */}
        <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button onClick={() => createTemplate(false)} disabled={creating} style={{ padding: '8px 14px', borderRadius: 9, background: 'var(--accent)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {creating ? '…' : '+ Neue Vorlage'}
            </button>
            <button onClick={() => createTemplate(true)} disabled={creating} style={{ padding: '8px 14px', borderRadius: 9, background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              Standard laden (CSV)
            </button>
          </div>

          {templates.length === 0 ? (
            <div style={{ background: 'var(--bg-card)', border: '1px dashed var(--border-strong)', borderRadius: 12, padding: '28px 14px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Noch keine Vorlagen. Erstelle eine neue oder lade den Standard.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {templates.map(t => {
                const isSelected = selectedId === t.id
                return (
                  <div key={t.id} style={{ position: 'relative', borderRadius: 10, background: isSelected ? 'rgba(124,106,255,0.1)' : 'var(--bg-card)', border: isSelected ? '1px solid rgba(124,106,255,0.4)' : '1px solid var(--border)', display: 'flex', alignItems: 'stretch', transition: 'all 0.15s' }}>
                    <button onClick={() => setSelectedId(t.id)} style={{ flex: 1, padding: '10px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                      {t.description && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.description}</div>}
                      <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>{t.sections.length} Fragen</div>
                    </button>
                    <button onClick={() => deleteTemplate(t.id)} style={{ padding: '0 8px', background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', fontSize: 15 }}>×</button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: template editor */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {selectedTemplate ? (
            <TemplateEditor
              key={selectedTemplate.id}
              template={selectedTemplate}
              trainerId={trainerId}
              onSaved={updated => setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t))}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, background: 'var(--bg-card)', border: '1px dashed var(--border-strong)', borderRadius: 14 }}>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Vorlage auswählen oder erstellen</p>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
