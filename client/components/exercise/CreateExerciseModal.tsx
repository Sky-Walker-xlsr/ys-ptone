'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  onCreated: (exercise: { id: string; name: string; source: string }) => void
  onClose: () => void
}

interface Muscle    { id: string; name: string }
interface Equipment { id: string; name: string }

export default function CreateExerciseModal({ onCreated, onClose }: Props) {
  const [name,             setName]           = useState('')
  const [primaryMuscleId,  setPrimaryMuscleId] = useState('')
  const [equipmentId,      setEquipmentId]     = useState('')
  const [muscles,          setMuscles]         = useState<Muscle[]>([])
  const [equipmentList,    setEquipmentList]   = useState<Equipment[]>([])
  const [saving,           setSaving]          = useState(false)

  useEffect(() => {
    const sb = createClient()
    sb.from('muscles').select('id, name').order('name').then(({ data }) => setMuscles(data ?? []))
    sb.from('equipment').select('id, name').order('name').then(({ data }) => setEquipmentList(data ?? []))
  }, [])

  async function handleSubmit() {
    if (!name.trim()) return
    setSaving(true)
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { setSaving(false); return }

    const { data, error } = await sb
      .from('exercises')
      .insert({
        source: 'custom',
        user_id: user.id,
        name: name.trim(),
        primary_muscle_id: primaryMuscleId || null,
        equipment_id: equipmentId || null,
      })
      .select('id, name, source')
      .single()

    setSaving(false)
    if (data && !error) onCreated(data)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--bg-page)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 500, fontSize: 15, cursor: 'pointer' }}>Cancel</button>
        <span style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)' }}>New Exercise</span>
        <button onClick={handleSubmit} disabled={!name.trim() || saving}
          style={{ background: 'none', border: 'none', fontWeight: 600, fontSize: 15, cursor: name.trim() ? 'pointer' : 'default', color: name.trim() ? 'var(--accent)' : 'var(--text-subtle)' }}>
          {saving ? 'Saving…' : 'Create'}
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Name */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 8 }}>Name *</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Bulgarian Split Squat"
            style={{ fontSize: 16, fontWeight: 600, width: '100%', background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)' }}
          />
        </div>

        {/* Primary Muscle */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 10 }}>Primary Muscle</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {muscles.map(m => (
              <button key={m.id} onClick={() => setPrimaryMuscleId(p => p === m.id ? '' : m.id)}
                style={{ padding: '6px 12px', borderRadius: 99, fontSize: 13, fontWeight: primaryMuscleId === m.id ? 600 : 400, cursor: 'pointer', border: primaryMuscleId === m.id ? '1px solid rgba(124,106,255,0.7)' : '1px solid var(--border)', background: primaryMuscleId === m.id ? 'rgba(124,106,255,0.18)' : 'transparent', color: primaryMuscleId === m.id ? 'var(--accent)' : 'var(--text-muted)' }}>
                {m.name}
              </button>
            ))}
          </div>
        </div>

        {/* Equipment */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginBottom: 10 }}>Equipment</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {equipmentList.map(e => (
              <button key={e.id} onClick={() => setEquipmentId(p => p === e.id ? '' : e.id)}
                style={{ padding: '6px 12px', borderRadius: 99, fontSize: 13, fontWeight: equipmentId === e.id ? 600 : 400, cursor: 'pointer', border: equipmentId === e.id ? '1px solid rgba(124,106,255,0.7)' : '1px solid var(--border)', background: equipmentId === e.id ? 'rgba(124,106,255,0.18)' : 'transparent', color: equipmentId === e.id ? 'var(--accent)' : 'var(--text-muted)' }}>
                {e.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
