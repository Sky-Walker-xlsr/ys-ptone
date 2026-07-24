'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Equipment { id: string; name: string }
interface Muscle    { id: string; name: string }

const EXERCISE_TYPES = [
  { name: 'Weight & Reps',       fields: ['weight_kg', 'reps'] },
  { name: 'Bodyweight Reps',     fields: ['reps'] },
  { name: 'Weighted Bodyweight', fields: ['reps', 'weight_kg'] },
  { name: 'Assisted Bodyweight', fields: ['reps', 'weight_kg'] },
  { name: 'Duration',            fields: ['duration_seconds'] },
  { name: 'Duration & Weight',   fields: ['duration_seconds', 'weight_kg'] },
  { name: 'Distance & Duration', fields: ['distance_km', 'duration_seconds'] },
  { name: 'Weight & Distance',   fields: ['weight_kg', 'distance_km'] },
] as const

interface Props {
  onCreated: (exercise: { id: string; name: string; source: string }) => void
  onClose:   () => void
}

export default function CreateExerciseModal({ onCreated, onClose }: Props) {
  const [name,               setName]           = useState('')
  const [selectedTypeName,   setSelectedTypeName] = useState('')
  const [primaryMuscleId,    setPrimaryMuscleId] = useState('')
  const [secondaryMuscleIds, setSecondaryIds]    = useState<string[]>([])
  const [equipmentId,        setEquipmentId]     = useState('')
  const [equipment,          setEquipment]       = useState<Equipment[]>([])
  const [muscles,            setMuscles]         = useState<Muscle[]>([])
  const [saving,             setSaving]          = useState(false)
  const [userId,             setUserId]          = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('equipment').select('id, name').order('name'),
      supabase.from('muscles').select('id, name').order('name'),
      supabase.auth.getUser(),
    ]).then(([eq, mu, { data: ud }]) => {
      setEquipment(eq.data ?? [])
      setMuscles(mu.data ?? [])
      setUserId(ud.user?.id ?? null)
    })
  }, [])

  function toggleSecondary(id: string) {
    setSecondaryIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handleSubmit() {
    if (!name.trim() || !userId || !selectedTypeName) return
    setSaving(true)
    const exType = EXERCISE_TYPES.find(t => t.name === selectedTypeName)!
    const supabase = createClient()
    const { data, error } = await supabase
      .from('exercises')
      .insert({
        name:                 name.trim(),
        source:               'custom',
        user_id:              userId,
        exercise_type_name:   exType.name,
        exercise_type_fields: [...exType.fields],
        primary_muscle_id:    primaryMuscleId || null,
        secondary_muscle_ids: secondaryMuscleIds.length ? secondaryMuscleIds : null,
        equipment_id:         equipmentId     || null,
      })
      .select('id, name, source')
      .single()
    setSaving(false)
    if (!error && data) onCreated(data)
  }

  const selectedType = EXERCISE_TYPES.find(t => t.name === selectedTypeName)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 500, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
        <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>New Exercise</span>
        <button onClick={handleSubmit} disabled={!name.trim() || !selectedTypeName || saving} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: name.trim() && selectedTypeName ? 'var(--accent)' : 'var(--text-muted)' }}>
          {saving ? 'Saving…' : 'Create'}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <SectionCard label="Name *">
          <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Bulgarian Split Squat" style={{ fontSize: 15, fontWeight: 600, width: '100%', background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontFamily: 'inherit' }} />
        </SectionCard>

        <SectionCard label="Exercise Type *">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {EXERCISE_TYPES.map(t => (
              <button key={t.name} onClick={() => setSelectedTypeName(t.name)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 10, border: selectedTypeName === t.name ? '1px solid rgba(124,106,255,0.6)' : '1px solid var(--border)', background: selectedTypeName === t.name ? 'rgba(124,106,255,0.1)' : 'transparent', cursor: 'pointer' }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{t.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.fields.join(' · ')}</span>
              </button>
            ))}
          </div>
          {selectedType && <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>Fields: <strong style={{ color: 'var(--accent)' }}>{selectedType.fields.join(', ')}</strong></p>}
        </SectionCard>

        <SectionCard label="Equipment">
          <ChipGroup items={equipment} selected={[equipmentId]} onToggle={id => setEquipmentId(prev => prev === id ? '' : id)} />
        </SectionCard>

        <SectionCard label="Primary Muscle">
          <ChipGroup items={muscles} selected={[primaryMuscleId]} onToggle={id => setPrimaryMuscleId(prev => prev === id ? '' : id)} />
        </SectionCard>

        <SectionCard label="Secondary Muscles">
          <ChipGroup items={muscles.filter(m => m.id !== primaryMuscleId)} selected={secondaryMuscleIds} onToggle={toggleSecondary} multi />
        </SectionCard>
      </div>
    </div>
  )
}

function SectionCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  )
}

function ChipGroup({ items, selected, onToggle, multi = false }: { items: { id: string; name: string }[]; selected: string[]; onToggle: (id: string) => void; multi?: boolean }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
      {items.map(item => {
        const isSelected = selected.includes(item.id)
        return (
          <button key={item.id} onClick={() => onToggle(item.id)} style={{ padding: '5px 11px', borderRadius: 20, border: isSelected ? '1px solid rgba(124,106,255,0.6)' : '1px solid var(--border)', background: isSelected ? 'rgba(124,106,255,0.12)' : 'transparent', color: isSelected ? 'var(--accent)' : 'var(--text-muted)', fontSize: 12, fontWeight: isSelected ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            {multi && isSelected && <span style={{ fontSize: 10 }}>✓</span>}
            {item.name}
          </button>
        )
      })}
    </div>
  )
}
