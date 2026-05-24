'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/Sidebar'
import AddExerciseModal, { type EDBExercise } from '@/components/exercise/AddExerciseModal'
import { pairSuperset, dissolveSuperset } from '@/lib/supabase/sessions'

// ─── Types ──────────────────────────────────────────────────────────────────

type Tab = 'plans' | 'logbook' | 'journal' | 'documents' | 'invoices'

interface ClientProfile {
  id: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  email: string
}

interface AssignedPlan {
  assignment_id: string
  plan_id: string
  title: string
  description: string | null
  exercise_count: number
}

interface OwnPlan {
  id: string
  title: string
  description: string | null
  exercise_count: number
}

interface Session {
  id: string
  title: string
  source: string
  started_at: string
  finished_at: string | null
  duration_seconds: number | null
  total_volume_kg: number | null
  total_sets: number | null
}

interface PlanSet {
  id?: string
  set_number: number
  weight_kg: number | null
  reps: number | null
  isNew?: boolean
}

interface PlanExercise {
  id: string
  plan_id: string
  exercise_id: string
  position: number
  superset_group: string | null
  default_sets: number | null
  exercises?: { id: string; external_id: string | null; name: string | null; source: string }
  plan_sets?: PlanSet[]
  edbData?: { name: string; imageUrl: string | null; targetMuscles: string[] }
}

type RenderGroup =
  | { type: 'single'; ex: PlanExercise }
  | { type: 'superset'; exA: PlanExercise; exB: PlanExercise; groupId: string }

function buildRenderGroups(exercises: PlanExercise[]): RenderGroup[] {
  const groups: RenderGroup[] = []
  const seen = new Set<string>()
  exercises.forEach(ex => {
    if (seen.has(ex.id)) return
    if (ex.superset_group) {
      const p = exercises.find(e => e.superset_group === ex.superset_group && e.id !== ex.id)
      if (p) { seen.add(ex.id); seen.add(p.id); groups.push({ type: 'superset', exA: ex, exB: p, groupId: ex.superset_group }); return }
    }
    seen.add(ex.id); groups.push({ type: 'single', ex })
  })
  return groups
}

function ExerciseMenu({ isInSuperset, canPair, onStartPairing, onDissolve, onReplace, onRemove, onClose }: {
  isInSuperset: boolean; canPair: boolean
  onStartPairing: () => void; onDissolve: () => void; onReplace: () => void; onRemove: () => void; onClose: () => void
}) {
  const item = (danger = false, disabled = false): React.CSSProperties => ({ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: 'none', background: 'transparent', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 13, textAlign: 'left', color: disabled ? 'var(--text-subtle)' : danger ? 'var(--danger)' : 'var(--text-primary)', opacity: disabled ? 0.4 : 1, fontFamily: 'inherit' })
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={onClose} />
      <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, minWidth: 190, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 6, zIndex: 99, boxShadow: '0 12px 32px rgba(0,0,0,0.3)' }}>
        {isInSuperset
          ? <button onClick={() => { onDissolve(); onClose() }} style={{ ...item(), color: 'var(--warning)' }}>Dissolve Superset</button>
          : <button onClick={() => { if (canPair) { onStartPairing(); onClose() } }} disabled={!canPair} style={item(false, !canPair)}>Add to Superset</button>
        }
        <button onClick={() => { onReplace(); onClose() }} style={item()}>Replace Exercise</button>
        <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
        <button onClick={() => { onRemove(); onClose() }} style={item(true)}>Remove Exercise</button>
      </div>
    </>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getInitials(p: ClientProfile | null) {
  if (!p) return '?'
  return ((p.first_name?.[0] ?? '') + (p.last_name?.[0] ?? '')).toUpperCase() || p.email[0].toUpperCase()
}

function getDisplayName(p: ClientProfile | null) {
  if (!p) return '—'
  return p.display_name || `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.email
}

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('de-CH', { day: 'numeric', month: 'short', year: 'numeric' })
}


// ─── Plan Editor Panel (inline right panel) ──────────────────────────────────

function PlanEditorPanel({ planId }: { planId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [title,              setTitle]              = useState('')
  const [description,        setDescription]        = useState('')
  const [exercises,          setExercises]          = useState<PlanExercise[]>([])
  const [loading,            setLoading]            = useState(true)
  const [saving,             setSaving]             = useState(false)
  const [saved,              setSaved]              = useState(false)
  const [showAddExercise,    setShowAddExercise]    = useState(false)
  const [supersetPickingFor, setSupersetPickingFor] = useState<string | null>(null)
  const [menuOpenId,         setMenuOpenId]         = useState<string | null>(null)
  const [replacingId,        setReplacingId]        = useState<string | null>(null)

  useEffect(() => {
    setLoading(true); setSaved(false)
    async function load() {
      const { data: plan } = await supabase.from('plans').select('id, title, description').eq('id', planId).single()
      if (!plan) return
      setTitle(plan.title); setDescription(plan.description ?? '')
      const { data: exs } = await supabase
        .from('plan_exercises').select('*, exercises(id, external_id, name, source), plan_sets(*)')
        .eq('plan_id', planId).order('position')
      setExercises((exs ?? []).map((ex: any) => ({
        ...ex,
        plan_sets: ex.plan_sets?.length
          ? [...ex.plan_sets].sort((a: any, b: any) => a.set_number - b.set_number)
          : [{ set_number: 1, weight_kg: null, reps: null, isNew: true }],
      })))
      setLoading(false)
    }
    load()
  }, [planId])

  function updateSet(exId: string, si: number, field: 'weight_kg' | 'reps', value: string) {
    const nv = value === '' ? null : parseFloat(value)
    setExercises(p => p.map(ex => {
      if (ex.id !== exId) return ex
      const s = [...(ex.plan_sets ?? [])]; s[si] = { ...s[si], [field]: nv }; return { ...ex, plan_sets: s }
    }))
  }
  function addSet(exId: string) {
    setExercises(p => p.map(ex => {
      if (ex.id !== exId) return ex
      const s = ex.plan_sets ?? [], ls = s[s.length - 1]
      return { ...ex, plan_sets: [...s, { set_number: s.length + 1, weight_kg: ls?.weight_kg ?? null, reps: ls?.reps ?? null, isNew: true }] }
    }))
  }
  function removeSet(exId: string, si: number) {
    setExercises(p => p.map(ex => {
      if (ex.id !== exId) return ex
      const s = (ex.plan_sets ?? []).filter((_, i) => i !== si).map((x, i) => ({ ...x, set_number: i + 1 }))
      return { ...ex, plan_sets: s }
    }))
  }

  async function resolveExerciseId(edb: EDBExercise): Promise<string | undefined> {
    if (edb.source === 'custom') return edb.exerciseId
    const { data: existing } = await supabase.from('exercises').select('id').eq('external_id', edb.exerciseId).eq('source', 'exercisedb').maybeSingle()
    if (existing?.id) return existing.id
    const { data: created } = await supabase.from('exercises').insert({ external_id: edb.exerciseId, source: 'exercisedb', name: edb.name }).select('id').single()
    return created?.id
  }

  async function addExercise(edb: EDBExercise) {
    const exerciseId = await resolveExerciseId(edb)
    if (!exerciseId) return
    const { data: pe } = await supabase.from('plan_exercises')
      .insert({ plan_id: planId, exercise_id: exerciseId, position: exercises.length, default_sets: 3 })
      .select('*, exercises(id, external_id, name, source)').single()
    if (pe) {
      setExercises(prev => [...prev, { ...pe, plan_sets: [1, 2, 3].map(n => ({ set_number: n, weight_kg: null, reps: null, isNew: true })), edbData: { name: edb.name, imageUrl: edb.imageUrl, targetMuscles: edb.targetMuscles } }])
      setShowAddExercise(false)
    }
  }

  async function replaceExercise(edb: EDBExercise) {
    if (!replacingId) return
    const exerciseId = await resolveExerciseId(edb)
    if (!exerciseId) return
    await supabase.from('plan_exercises').update({ exercise_id: exerciseId }).eq('id', replacingId)
    setExercises(prev => prev.map(ex => ex.id === replacingId
      ? { ...ex, exercise_id: exerciseId, edbData: { name: edb.name, imageUrl: edb.imageUrl, targetMuscles: edb.targetMuscles }, exercises: undefined }
      : ex))
    setReplacingId(null)
  }

  async function removeExercise(id: string) {
    const ex = exercises.find(e => e.id === id)
    if (ex?.superset_group) {
      await dissolveSuperset(ex.superset_group, 'plan_exercises')
      setExercises(p => p.map(e => e.superset_group === ex.superset_group ? { ...e, superset_group: null } : e))
    }
    await supabase.from('plan_exercises').delete().eq('id', id)
    setExercises(p => p.filter(e => e.id !== id))
  }

  async function handleSupersetPair(targetId: string) {
    if (!supersetPickingFor) return
    const groupId = await pairSuperset(supersetPickingFor, targetId, 'plan_exercises')
    setExercises(p => p.map(ex => ex.id === supersetPickingFor || ex.id === targetId ? { ...ex, superset_group: groupId } : ex))
    setSupersetPickingFor(null)
  }

  async function handleSupersetDissolve(groupId: string) {
    await dissolveSuperset(groupId, 'plan_exercises')
    setExercises(p => p.map(ex => ex.superset_group === groupId ? { ...ex, superset_group: null } : ex))
  }

  async function handleSave() {
    setSaving(true)
    await supabase.from('plans').update({ title: title.trim(), description: description.trim() || null }).eq('id', planId)
    await Promise.all(exercises.map(async (ex, index) => {
      await supabase.from('plan_exercises').update({ position: index }).eq('id', ex.id)
      const sets = ex.plan_sets ?? []
      await supabase.from('plan_sets').delete().eq('plan_exercise_id', ex.id)
      if (sets.length > 0)
        await supabase.from('plan_sets').insert(sets.map(s => ({ plan_exercise_id: ex.id, set_number: s.set_number, weight_kg: s.weight_kg, reps: s.reps })))
    }))
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function renderExBlock(ex: PlanExercise) {
    const name = ex.edbData?.name ?? ex.exercises?.name ?? 'Loading…'
    const isInSS = !!ex.superset_group
    const isPairingTarget = !!supersetPickingFor && supersetPickingFor !== ex.id && !isInSS
    const canPair = !isInSS && exercises.filter(e => !e.superset_group && e.id !== ex.id).length > 0
    const isMenuOpen = menuOpenId === ex.id
    return (
      <div key={ex.id}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }} onClick={() => isPairingTarget && handleSupersetPair(ex.id)}>
            <div style={{ width: 34, height: 34, borderRadius: 8, overflow: 'hidden', background: isPairingTarget ? 'rgba(124,106,255,0.3)' : 'rgba(124,106,255,0.15)', border: isPairingTarget ? '2px solid rgba(124,106,255,0.7)' : '1px solid rgba(124,106,255,0.3)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isPairingTarget ? 'pointer' : 'default', transition: 'all 0.2s' }}>
              {isPairingTarget ? <span style={{ color: 'var(--accent)', fontSize: 16, fontWeight: 700 }}>+</span>
                : ex.edbData?.imageUrl ? <img src={ex.edbData.imageUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 14 }}>💪</span>}
            </div>
            <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--accent)', cursor: isPairingTarget ? 'pointer' : 'default', opacity: supersetPickingFor && !isPairingTarget && supersetPickingFor !== ex.id ? 0.35 : 1 }}>
              {name}{isPairingTarget && <span style={{ fontSize: 11, marginLeft: 6, fontWeight: 400, color: 'var(--text-muted)' }}>click to pair</span>}
            </span>
          </div>
          <div style={{ position: 'relative' }}>
            <button onClick={() => !supersetPickingFor && setMenuOpenId(isMenuOpen ? null : ex.id)} style={{ background: isMenuOpen ? 'var(--bg-tertiary)' : 'none', border: 'none', borderRadius: 6, color: 'var(--text-muted)', fontSize: 18, padding: '4px 8px', cursor: 'pointer', opacity: supersetPickingFor && supersetPickingFor !== ex.id ? 0.3 : 1 }}>···</button>
            {isMenuOpen && <ExerciseMenu isInSuperset={isInSS} canPair={canPair} onStartPairing={() => setSupersetPickingFor(ex.id)} onDissolve={() => ex.superset_group && handleSupersetDissolve(ex.superset_group)} onReplace={() => setReplacingId(ex.id)} onRemove={() => removeExercise(ex.id)} onClose={() => setMenuOpenId(null)} />}
          </div>
        </div>
        <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr 28px', padding: '6px 10px', borderBottom: '1px solid var(--border)' }}>
            {['Set', 'kg', 'Reps', ''].map(h => <span key={h} style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', fontWeight: 500 }}>{h}</span>)}
          </div>
          {(ex.plan_sets ?? []).map((s, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr 28px', padding: '8px 10px', background: i % 2 === 1 ? 'var(--bg-card)' : 'transparent', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
              <span style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}>{s.set_number}</span>
              <input type="number" inputMode="decimal" placeholder="—" value={s.weight_kg ?? ''} onFocus={e => e.target.select()} onChange={e => updateSet(ex.id, i, 'weight_kg', e.target.value)} style={{ textAlign: 'center', width: '100%', fontSize: 13, fontWeight: 500, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontFamily: 'inherit' }} />
              <input type="number" inputMode="numeric" placeholder="—" value={s.reps ?? ''} onFocus={e => e.target.select()} onChange={e => updateSet(ex.id, i, 'reps', e.target.value)} style={{ textAlign: 'center', width: '100%', fontSize: 13, fontWeight: 500, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontFamily: 'inherit' }} />
              <button onClick={() => removeSet(ex.id, i)} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: 15, textAlign: 'center', padding: 0, cursor: 'pointer' }}>×</button>
            </div>
          ))}
          <button onClick={() => addSet(ex.id)} style={{ width: '100%', padding: '7px', background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>+ Add Set</button>
        </div>
      </div>
    )
  }

  const renderGroups = buildRenderGroups(exercises)

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px', background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)' }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--border-strong)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
      {supersetPickingFor && (
        <div style={{ background: 'var(--accent)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Click an exercise to create a superset</span>
          <button onClick={() => setSupersetPickingFor(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, padding: '3px 10px', color: '#fff', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
        </div>
      )}

      {/* Title & description */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Plan title" style={{ fontSize: 16, fontWeight: 700, width: '100%', background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontFamily: 'inherit' }} />
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" style={{ fontSize: 13, width: '100%', background: 'none', border: 'none', outline: 'none', color: 'var(--text-muted)', fontFamily: 'inherit' }} />
      </div>

      {/* Exercises */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {renderGroups.map(group => {
          if (group.type === 'single') return (
            <div key={group.ex.id} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
              {renderExBlock(group.ex)}
            </div>
          )
          return (
            <div key={group.groupId} style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 3, borderRadius: 3, background: 'linear-gradient(to bottom, var(--accent), rgba(124,106,255,0.2))', flexShrink: 0, marginTop: 6 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--accent)', background: 'rgba(124,106,255,0.1)', border: '1px solid rgba(124,106,255,0.25)', borderRadius: 20, padding: '2px 8px', alignSelf: 'flex-start' }}>SUPERSET</span>
                <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>{renderExBlock(group.exA)}</div>
                <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>{renderExBlock(group.exB)}</div>
              </div>
            </div>
          )
        })}

        <button onClick={() => setShowAddExercise(true)} style={{ width: '100%', padding: '12px', background: 'rgba(124,106,255,0.08)', border: '1px dashed rgba(124,106,255,0.35)', borderRadius: 12, color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          + Add Exercise
        </button>
      </div>

      {/* Save */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={handleSave} disabled={saving || !title.trim()} style={{ padding: '8px 20px', background: saved ? 'var(--success)' : title.trim() ? 'var(--accent)' : 'var(--bg-tertiary)', color: title.trim() ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: title.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'background 0.2s' }}>
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
        </button>
      </div>

      {showAddExercise && <AddExerciseModal onAdd={addExercise}     onClose={() => setShowAddExercise(false)} />}
      {replacingId      && <AddExerciseModal onAdd={replaceExercise} onClose={() => setReplacingId(null)}     />}
    </div>
  )
}

// ─── Plans Tab ───────────────────────────────────────────────────────────────

function PlansTab({ clientId, assignedPlans, ownPlans, trainerId }: {
  clientId: string
  assignedPlans: AssignedPlan[]
  ownPlans: OwnPlan[]
  trainerId: string
}) {
  const supabase = useMemo(() => createClient(), [])
  const [myPlans, setMyPlans] = useState<{ id: string; title: string }[]>([])
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [assigned, setAssigned] = useState<AssignedPlan[]>(assignedPlans)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [planMenuOpenId, setPlanMenuOpenId] = useState<string | null>(null)
  const [confirmDeletePlanId, setConfirmDeletePlanId] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('plans').select('id, title').eq('user_id', trainerId).order('created_at', { ascending: false })
      .then(({ data }) => setMyPlans(data ?? []))
  }, [trainerId])

  async function assignPlan(planId: string) {
    setAssigning(true)
    const { data } = await supabase.from('plan_assignments')
      .insert({ plan_id: planId, client_id: clientId, trainer_id: trainerId })
      .select('id').single()
    if (data) {
      const { data: plan } = await supabase.from('plans')
        .select('id, title, description, plan_exercises(count)').eq('id', planId).single()
      if (plan) {
        setAssigned(prev => [...prev, {
          assignment_id: data.id, plan_id: planId, title: plan.title,
          description: plan.description, exercise_count: (plan as any).plan_exercises?.[0]?.count ?? 0,
        }])
        setSelectedPlanId(planId)
      }
    }
    setAssigning(false)
    setShowAssignModal(false)
  }

  async function createAndAssign() {
    setAssigning(true)
    const { data: newPlan } = await supabase.from('plans')
      .insert({ user_id: trainerId, title: 'New Plan' }).select('id').single()
    if (newPlan) {
      const { data: asgn } = await supabase.from('plan_assignments')
        .insert({ plan_id: newPlan.id, client_id: clientId, trainer_id: trainerId })
        .select('id').single()
      if (asgn) {
        setAssigned(prev => [...prev, { assignment_id: asgn.id, plan_id: newPlan.id, title: 'New Plan', description: null, exercise_count: 0 }])
        setSelectedPlanId(newPlan.id)
      }
    }
    setAssigning(false)
  }

  async function deletePlan(assignmentId: string, planId: string) {
    await supabase.from('plan_assignments').delete().eq('id', assignmentId)
    await supabase.from('plan_exercises').delete().eq('plan_id', planId)
    await supabase.from('plans').delete().eq('id', planId)
    setAssigned(prev => prev.filter(p => p.assignment_id !== assignmentId))
    if (selectedPlanId === planId) setSelectedPlanId(null)
    setPlanMenuOpenId(null)
    setConfirmDeletePlanId(null)
  }

  const unassignedPlans = myPlans.filter(p => !assigned.some(a => a.plan_id === p.id))

  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      {/* Left: plan list */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Assigned Plans</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowAssignModal(true)} disabled={assigning || unassignedPlans.length === 0} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, background: 'var(--bg-card)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)', cursor: unassignedPlans.length === 0 ? 'not-allowed' : 'pointer', opacity: unassignedPlans.length === 0 ? 0.5 : 1, fontFamily: 'inherit' }}>
              + Add template
            </button>
            <button onClick={createAndAssign} disabled={assigning} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              {assigning ? '…' : '+ New'}
            </button>
          </div>
        </div>

        {assigned.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1px dashed var(--border-strong)', borderRadius: 12, padding: '32px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No plans assigned yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20 }}>
            {assigned.map(p => {
              const isSelected = selectedPlanId === p.plan_id
              const menuOpen = planMenuOpenId === p.assignment_id
              const confirmDelete = confirmDeletePlanId === p.assignment_id
              return (
                <div key={p.assignment_id} style={{ position: 'relative', display: 'flex', alignItems: 'stretch', borderRadius: 10, overflow: 'visible', background: isSelected ? 'rgba(124,106,255,0.1)' : 'var(--bg-card)', border: isSelected ? '1px solid rgba(124,106,255,0.4)' : '1px solid var(--border)', transition: 'all 0.15s' }}>
                  <button onClick={() => setSelectedPlanId(p.plan_id)} style={{ flex: 1, padding: '10px 14px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', background: 'none', border: 'none', minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.exercise_count} exercises{p.description ? ` · ${p.description}` : ''}</div>
                  </button>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', paddingRight: 8 }}>
                    <button
                      onClick={e => { e.stopPropagation(); setPlanMenuOpenId(menuOpen ? null : p.assignment_id); setConfirmDeletePlanId(null) }}
                      style={{ background: menuOpen ? 'var(--bg-tertiary)' : 'none', border: 'none', borderRadius: 6, color: 'var(--text-muted)', fontSize: 16, padding: '4px 7px', cursor: 'pointer', lineHeight: 1 }}
                    >···</button>
                    {menuOpen && (
                      <>
                        <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => { setPlanMenuOpenId(null); setConfirmDeletePlanId(null) }} />
                        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, minWidth: 160, background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 10, padding: 5, zIndex: 99, boxShadow: '0 12px 32px rgba(0,0,0,0.3)' }}>
                          <button
                            onClick={() => confirmDelete ? deletePlan(p.assignment_id, p.plan_id) : setConfirmDeletePlanId(p.assignment_id)}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: 'none', background: confirmDelete ? 'rgba(255,69,58,0.12)' : 'transparent', color: 'var(--danger)', fontSize: 13, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontWeight: confirmDelete ? 600 : 400 }}
                          >
                            {confirmDelete ? 'Confirm delete?' : 'Delete plan'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {ownPlans.length > 0 && (
          <>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client's own plans</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {ownPlans.map(p => (
                <div key={p.id} style={{ padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{p.exercise_count} exercises</div>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-subtle)', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 7px', whiteSpace: 'nowrap' }}>Read-only</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Right: plan editor */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {selectedPlanId ? (
          <PlanEditorPanel planId={selectedPlanId} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280, background: 'var(--bg-card)', border: '1px dashed var(--border-strong)', borderRadius: 14 }}>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Select a plan to edit</p>
          </div>
        )}
      </div>

      {/* Assign modal */}
      {showAssignModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => e.target === e.currentTarget && setShowAssignModal(false)}>
          <div style={{ width: '100%', maxWidth: 440, background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 20, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Assign a plan</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
              {unassignedPlans.map(p => (
                <button key={p.id} onClick={() => assignPlan(p.id)} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                  {p.title}
                </button>
              ))}
            </div>
            <button onClick={() => setShowAssignModal(false)} style={{ marginTop: 16, width: '100%', padding: '10px', borderRadius: 8, background: 'none', border: '1px solid var(--border-strong)', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Logbook session detail (right panel) ────────────────────────────────────

function LogbookSessionDetail({ session }: { session: Session }) {
  const supabase = useMemo(() => createClient(), [])
  const [exercises, setExercises] = useState<{ id: string; name: string; image_url: string | null }[]>([])
  const [sets, setSets] = useState<{ id: string; workout_exercise_id: string; set_number: number; weight_kg: number | null; reps: number | null; is_completed: boolean }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    async function load() {
      const [exRes, setRes] = await Promise.all([
        supabase.from('workout_exercises')
          .select('id, position, exercises(name, image_url)')
          .eq('workout_session_id', session.id).order('position'),
        supabase.from('sets')
          .select('id, workout_exercise_id, set_number, weight_kg, reps, is_completed')
          .eq('workout_session_id', session.id).order('set_number'),
      ])
      setExercises((exRes.data ?? []).map((e: any) => ({
        id: e.id, name: e.exercises?.name ?? 'Exercise', image_url: e.exercises?.image_url ?? null,
      })))
      setSets((setRes.data ?? []) as any)
      setLoading(false)
    }
    load()
  }, [session.id])

  const completedSets = sets.filter(s => s.is_completed)

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
      {/* Session title + date */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{session.title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {new Date(session.finished_at ?? session.started_at).toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
        {[
          { label: 'Duration', value: formatDuration(session.duration_seconds ?? 0) },
          { label: 'Volume', value: `${Math.round((session.total_volume_kg ?? 0) * 10) / 10} kg` },
          { label: 'Sets', value: session.total_sets ?? completedSets.length },
        ].map(stat => (
          <div key={stat.label} style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--accent)' }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Exercises */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '28px' }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--border-strong)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : exercises.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '28px', fontSize: 13, color: 'var(--text-muted)' }}>No exercises recorded</div>
      ) : (
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {exercises.map(ex => {
            const exSets = sets.filter(s => s.workout_exercise_id === ex.id)
            return (
              <div key={ex.id} style={{ background: 'var(--bg-tertiary)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, overflow: 'hidden', background: 'rgba(124,106,255,0.15)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {ex.image_url
                      ? <img src={ex.image_url} alt={ex.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 13 }}>💪</span>}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{ex.name}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
                    {exSets.filter(s => s.is_completed).length}/{exSets.length}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr', padding: '5px 10px', background: 'var(--bg-page)', borderBottom: '1px solid var(--border)' }}>
                  {['#', 'kg', 'Reps'].map(h => <span key={h} style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', fontWeight: 500 }}>{h}</span>)}
                </div>
                {exSets.length === 0
                  ? <div style={{ padding: '8px', fontSize: 12, color: 'var(--text-subtle)', textAlign: 'center' }}>No sets</div>
                  : exSets.map(s => (
                    <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr', padding: '7px 10px', borderBottom: '1px solid var(--border)', alignItems: 'center', background: s.is_completed ? 'rgba(62,207,142,0.05)' : 'transparent', opacity: s.is_completed ? 1 : 0.45 }}>
                      <span style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{s.set_number}</span>
                      <span style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-primary)' }}>{s.weight_kg ?? '—'}</span>
                      <span style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-primary)' }}>{s.reps ?? '—'}</span>
                    </div>
                  ))
                }
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Logbook Tab ─────────────────────────────────────────────────────────────

function LogbookTab({ sessions }: { sessions: Session[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(sessions[0]?.id ?? null)
  const selectedSession = sessions.find(s => s.id === selectedId) ?? null

  if (sessions.length === 0) return (
    <div style={{ background: 'var(--bg-card)', border: '1px dashed var(--border-strong)', borderRadius: 14, padding: '48px', textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>📓</div>
      <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No completed workouts yet.</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      {/* Left: session list */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {sessions.map(s => {
          const isSelected = selectedId === s.id
          return (
            <button
              key={s.id}
              onClick={() => setSelectedId(s.id)}
              style={{
                width: '100%', padding: '10px 12px', textAlign: 'left', cursor: 'pointer',
                fontFamily: 'inherit', borderRadius: 10, transition: 'all 0.15s',
                background: isSelected ? 'rgba(124,106,255,0.1)' : 'var(--bg-card)',
                border: isSelected ? '1px solid rgba(124,106,255,0.4)' : '1px solid var(--border)',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{s.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(s.finished_at ?? s.started_at)}</div>
              {(s.total_volume_kg != null || s.total_sets != null) && (
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  {s.total_volume_kg != null && <span style={{ fontSize: 10, color: 'var(--text-subtle)' }}>{Math.round(s.total_volume_kg * 10) / 10} kg</span>}
                  {s.total_sets != null && <span style={{ fontSize: 10, color: 'var(--text-subtle)' }}>{s.total_sets} sets</span>}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Right: detail */}
      {selectedSession && (
        <div style={{ flex: 1, minWidth: 0, maxWidth: '50%' }}>
          <LogbookSessionDetail session={selectedSession} />
        </div>
      )}
    </div>
  )
}

// ─── Journal Tab ─────────────────────────────────────────────────────────────

interface JournalEntry {
  id: string; week_label: string; year: number; week_number: number | null
  weight_kg: number | null; waist_cm: number | null; avg_score: number | null
  notes: string | null; submitted_at: string | null; status: string | null; template_id: string | null
}
interface JResponse { question_id: string; value_text: string | null; value_score: number | null }
interface JSection {
  id: string; type: 'heading' | 'scale' | 'text' | 'dropdown'
  title?: string; question?: string; min?: number; max?: number
  label_min?: string; label_max?: string; options?: string[]
}

function EntryDetail({ entry, supabase }: { entry: JournalEntry; supabase: ReturnType<typeof createClient> }) {
  const [responses, setResponses] = useState<JResponse[]>([])
  const [sections,  setSections]  = useState<JSection[]>([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    setLoading(true)
    async function load() {
      const [respRes, tmplRes] = await Promise.all([
        supabase.from('journal_responses').select('question_id, value_text, value_score').eq('entry_id', entry.id),
        entry.template_id
          ? supabase.from('journal_templates').select('sections').eq('id', entry.template_id).single()
          : Promise.resolve({ data: null }),
      ])
      setResponses((respRes.data ?? []) as JResponse[])
      setSections(((tmplRes as any).data?.sections ?? []) as JSection[])
      setLoading(false)
    }
    load()
  }, [entry.id])

  const rmap = new Map(responses.map(r => [r.question_id, r]))

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
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{entry.week_label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{entry.submitted_at ? new Date(entry.submitted_at).toLocaleDateString('de-CH', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</div>
      </div>

      {(entry.weight_kg != null || entry.waist_cm != null || entry.avg_score != null) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', padding: '12px 20px', borderBottom: '1px solid var(--border)', gap: 8 }}>
          {[
            { label: 'Gewicht',      value: entry.weight_kg  != null ? `${entry.weight_kg} kg`  : '—' },
            { label: 'Bauchumfang',  value: entry.waist_cm   != null ? `${entry.waist_cm} cm`   : '—' },
            { label: 'Ø Score',      value: entry.avg_score  != null ? `${Number(entry.avg_score).toFixed(1)}/10` : '—' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--accent)' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 28 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--border-strong)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : sections.length === 0 ? (
        <div style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>Keine Vorlage verknüpft</div>
      ) : (
        <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sections.map(section => {
            const resp = rmap.get(section.id)
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

function JournalTab({ clientId, trainerId }: { clientId: string; trainerId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [entries,    setEntries]    = useState<JournalEntry[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('journal_entries')
        .select('id, week_label, year, week_number, weight_kg, waist_cm, avg_score, notes, submitted_at, status, template_id')
        .eq('client_id', clientId).eq('pt_id', trainerId)
        .order('submitted_at', { ascending: false }).limit(100)
      const rows = (data ?? []) as JournalEntry[]
      setEntries(rows)
      if (rows.length > 0) setSelectedId(rows[0].id)
      setLoading(false)
    }
    load()
  }, [clientId, trainerId])

  const selected = entries.find(e => e.id === selectedId) ?? null

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--border-strong)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  if (entries.length === 0) return (
    <div style={{ background: 'var(--bg-card)', border: '1px dashed var(--border-strong)', borderRadius: 14, padding: '60px 40px', textAlign: 'center' }}>
      <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Noch keine Journal-Einreichungen.</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      {/* Left: entry list */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {entries.map(e => {
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

      {/* Right: detail */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {selected
          ? <EntryDetail entry={selected} supabase={supabase} />
          : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280, background: 'var(--bg-card)', border: '1px dashed var(--border-strong)', borderRadius: 14 }}>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Eintrag auswählen</p>
            </div>
        }
      </div>
    </div>
  )
}

// ─── Documents & Invoices shared types ───────────────────────────────────────

interface CFile {
  id: string; name: string; storage_path: string;
  size_bytes: number | null; section: string; subfolder: string | null; created_at: string;
}
interface CFolder { id: string; name: string; created_at: string }

function CFileRow({ file, onDownload, onDelete, dlId, delId, indent = false }: {
  file: CFile;
  onDownload: (f: CFile) => void; onDelete: (f: CFile) => void;
  dlId: string | null; delId: string | null; indent?: boolean;
}) {
  const ext  = file.name.split('.').pop()?.toLowerCase() ?? '';
  const icon = ['pdf'].includes(ext) ? '📄' : ['jpg','jpeg','png','gif','webp'].includes(ext) ? '🖼️' : ['xls','xlsx','csv'].includes(ext) ? '📊' : '📄';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: `11px ${indent ? 28 : 14}px`, borderTop: '1px solid var(--border)', background: indent ? 'rgba(124,106,255,0.04)' : 'transparent' }}>
      <span style={{ fontSize: 17, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 1 }}>
          {file.size_bytes ? `${(file.size_bytes / 1048576 < 1 ? (file.size_bytes / 1024).toFixed(0) + ' KB' : (file.size_bytes / 1048576).toFixed(1) + ' MB')} · ` : ''}
          {new Date(file.created_at).toLocaleDateString('de-CH', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button onClick={() => onDownload(file)} disabled={dlId === file.id} style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: 12, cursor: dlId === file.id ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: dlId === file.id ? 0.5 : 1 }}>
          {dlId === file.id ? '…' : '↓'}
        </button>
        <button onClick={() => onDelete(file)} disabled={delId === file.id} style={{ padding: '5px 9px', borderRadius: 7, border: '1px solid rgba(240,68,68,0.25)', background: 'rgba(240,68,68,0.06)', color: 'var(--danger)', fontSize: 12, cursor: delId === file.id ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: delId === file.id ? 0.5 : 1 }}>
          {delId === file.id ? '…' : '✕'}
        </button>
      </div>
    </div>
  )
}

function CFolderTree({ folders, allFiles, onDownload, onDelete, onUpload, onDeleteFolder, dlId, delId, uploading, showNewFolder, newFolderName, creatingFolder, setNewFolderName, setShowNewFolder, handleCreateFolder, onNewFolder }: {
  folders: CFolder[]; allFiles: CFile[];
  onDownload: (f: CFile) => void; onDelete: (f: CFile) => void;
  onUpload: (target: string | null) => void; onDeleteFolder: (f: CFolder) => void;
  dlId: string | null; delId: string | null; uploading: boolean;
  showNewFolder: boolean; newFolderName: string; creatingFolder: boolean;
  setNewFolderName: (v: string) => void; setShowNewFolder: (v: boolean) => void;
  handleCreateFolder: () => void; onNewFolder: () => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  function toggle(name: string) {
    setExpanded(p => { const n = new Set(p); n.has(name) ? n.delete(name) : n.add(name); return n })
  }
  const rootFiles = allFiles.filter(f => !f.subfolder)

  return (
    <div>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 6, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderBottom: rootFiles.length > 0 ? '1px solid var(--border)' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15 }}>📂</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Root</span>
            <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>({rootFiles.length})</span>
          </div>
          <button onClick={() => onUpload(null)} disabled={uploading} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>+ Upload</button>
        </div>
        {rootFiles.map(f => <CFileRow key={f.id} file={f} onDownload={onDownload} onDelete={onDelete} dlId={dlId} delId={delId} />)}
      </div>

      {folders.map(folder => {
        const isExpanded = expanded.has(folder.name)
        const folderFiles = allFiles.filter(f => f.subfolder === folder.name)
        return (
          <div key={folder.id} style={{ marginBottom: 6 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: isExpanded ? '10px 10px 0 0' : 10, display: 'flex', alignItems: 'center' }}>
              <button onClick={() => toggle(folder.name)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                <svg style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                <span style={{ fontSize: 17 }}>{isExpanded ? '📂' : '📁'}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{folder.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>({folderFiles.length})</span>
              </button>
              <button onClick={() => onUpload(folder.name)} disabled={uploading} style={{ padding: '10px 12px', background: 'none', border: 'none', borderLeft: '1px solid var(--border)', color: 'var(--accent)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>+ Upload</button>
              <button onClick={() => onDeleteFolder(folder)} style={{ padding: '10px 12px', background: 'none', border: 'none', borderLeft: '1px solid var(--border)', color: 'var(--danger)', fontSize: 13, cursor: 'pointer' }}>✕</button>
            </div>
            {isExpanded && (
              <div style={{ border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 10px 10px', background: 'var(--bg-card)', overflow: 'hidden' }}>
                {folderFiles.length === 0
                  ? <div style={{ padding: '18px', fontSize: 13, color: 'var(--text-subtle)', textAlign: 'center' }}>No files in this folder yet.</div>
                  : folderFiles.map(f => <CFileRow key={f.id} file={f} onDownload={onDownload} onDelete={onDelete} dlId={dlId} delId={delId} indent />)
                }
              </div>
            )}
          </div>
        )
      })}

      {showNewFolder ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateFolder()} placeholder="Folder name…" autoFocus style={{ flex: 1, padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
          <button onClick={handleCreateFolder} disabled={creatingFolder || !newFolderName.trim()} style={{ padding: '7px 14px', borderRadius: 8, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{creatingFolder ? '…' : 'Create'}</button>
          <button onClick={() => { setShowNewFolder(false); setNewFolderName('') }} style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
        </div>
      ) : (
        <button onClick={onNewFolder} style={{ width: '100%', marginTop: 8, padding: '8px', borderRadius: 10, background: 'none', border: '1px dashed var(--border-strong)', color: 'var(--accent)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
          + New folder
        </button>
      )}
    </div>
  )
}

// ─── Documents Tab ────────────────────────────────────────────────────────────

function ClientDocumentsTab({ clientId, trainerId }: { clientId: string; trainerId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [files,          setFiles]          = useState<CFile[]>([])
  const [folders,        setFolders]        = useState<CFolder[]>([])
  const [loading,        setLoading]        = useState(true)
  const [uploading,      setUploading]      = useState(false)
  const [dlId,           setDlId]           = useState<string | null>(null)
  const [delId,          setDelId]          = useState<string | null>(null)
  const [showNewFolder,  setShowNewFolder]  = useState(false)
  const [newFolderName,  setNewFolderName]  = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [uploadTarget,   setUploadTarget]   = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    setLoading(true)
    const [fr, fl] = await Promise.all([
      supabase.from('pt_files').select('id, name, storage_path, size_bytes, section, subfolder, created_at')
        .eq('trainer_id', trainerId).eq('client_id', clientId).eq('section', 'client_documents')
        .order('created_at', { ascending: false }),
      supabase.from('pt_client_folders').select('id, name, created_at')
        .eq('trainer_id', trainerId).eq('client_id', clientId).order('name'),
    ])
    setFiles((fr.data ?? []) as CFile[])
    setFolders((fl.data ?? []) as CFolder[])
    setLoading(false)
  }

  useEffect(() => { load() }, [clientId, trainerId])

  function triggerUpload(folder: string | null) {
    setUploadTarget(folder)
    setTimeout(() => fileRef.current?.click(), 0)
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    const ts = Date.now()
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const sub = uploadTarget
    const path = sub
      ? `${trainerId}/clients/${clientId}/documents/${sub}/${ts}_${safe}`
      : `${trainerId}/clients/${clientId}/documents/${ts}_${safe}`
    const { error } = await supabase.storage.from('ptone_drive').upload(path, file, { contentType: file.type || undefined })
    if (!error) {
      await supabase.from('pt_files').insert({ trainer_id: trainerId, client_id: clientId, name: file.name, storage_path: path, size_bytes: file.size, mime_type: file.type || null, section: 'client_documents', subfolder: sub })
      await load()
    }
    setUploading(false)
  }

  async function handleDownload(file: CFile) {
    setDlId(file.id)
    const { data } = await supabase.storage.from('ptone_drive').createSignedUrl(file.storage_path, 3600)
    if (data?.signedUrl) { const a = document.createElement('a'); a.href = data.signedUrl; a.download = file.name; a.click() }
    setDlId(null)
  }

  async function handleDelete(file: CFile) {
    if (!confirm(`Delete "${file.name}"?`)) return
    setDelId(file.id)
    await supabase.storage.from('ptone_drive').remove([file.storage_path])
    await supabase.from('pt_files').delete().eq('id', file.id)
    setFiles(p => p.filter(f => f.id !== file.id))
    setDelId(null)
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return
    setCreatingFolder(true)
    const { data } = await supabase.from('pt_client_folders').insert({ trainer_id: trainerId, client_id: clientId, name: newFolderName.trim() }).select('id, name, created_at').single()
    if (data) setFolders(p => [...p, data as CFolder].sort((a, b) => a.name.localeCompare(b.name)))
    setNewFolderName(''); setShowNewFolder(false); setCreatingFolder(false)
  }

  async function handleDeleteFolder(folder: CFolder) {
    if (!confirm(`Delete folder "${folder.name}" and all its files?`)) return
    const { data: ff } = await supabase.from('pt_files').select('storage_path').eq('trainer_id', trainerId).eq('client_id', clientId).eq('section', 'client_documents').eq('subfolder', folder.name)
    if (ff?.length) {
      await supabase.storage.from('ptone_drive').remove((ff as any[]).map(f => f.storage_path))
      await supabase.from('pt_files').delete().eq('trainer_id', trainerId).eq('client_id', clientId).eq('section', 'client_documents').eq('subfolder', folder.name)
    }
    await supabase.from('pt_client_folders').delete().eq('id', folder.id)
    setFolders(p => p.filter(f => f.id !== folder.id))
    setFiles(p => p.filter(f => f.subfolder !== folder.name))
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--border-strong)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  return (
    <>
      <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleFile} />
      <CFolderTree
        folders={folders} allFiles={files}
        onDownload={handleDownload} onDelete={handleDelete}
        onUpload={triggerUpload} onDeleteFolder={handleDeleteFolder}
        onNewFolder={() => setShowNewFolder(true)}
        dlId={dlId} delId={delId} uploading={uploading}
        showNewFolder={showNewFolder} newFolderName={newFolderName}
        setNewFolderName={setNewFolderName} setShowNewFolder={setShowNewFolder}
        creatingFolder={creatingFolder} handleCreateFolder={handleCreateFolder}
      />
    </>
  )
}

// ─── Invoices Tab ─────────────────────────────────────────────────────────────

function ClientInvoicesTab({ clientId, trainerId }: { clientId: string; trainerId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [files,     setFiles]     = useState<CFile[]>([])
  const [loading,   setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dlId,      setDlId]      = useState<string | null>(null)
  const [delId,     setDelId]     = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('pt_files').select('id, name, storage_path, size_bytes, section, subfolder, created_at')
      .eq('trainer_id', trainerId).eq('client_id', clientId).eq('section', 'client_invoices')
      .order('created_at', { ascending: false })
    setFiles((data ?? []) as CFile[])
    setLoading(false)
  }

  useEffect(() => { load() }, [clientId, trainerId])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    const ts = Date.now()
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    try {
      const pairs: [string, string][] = [
        [`${trainerId}/clients/${clientId}/invoices/${ts}_${safe}`, 'client_invoices'],
        [`${trainerId}/invoices/${clientId}_${ts}_${safe}`, 'pt_invoices'],
      ]
      for (const [path, section] of pairs) {
        const { error } = await supabase.storage.from('ptone_drive').upload(path, file, { contentType: file.type || undefined })
        if (!error) await supabase.from('pt_files').insert({ trainer_id: trainerId, client_id: clientId, name: file.name, storage_path: path, size_bytes: file.size, mime_type: file.type || null, section, subfolder: null })
      }
      await load()
    } catch (err) { console.error(err) }
    setUploading(false)
  }

  async function handleDownload(file: CFile) {
    setDlId(file.id)
    const { data } = await supabase.storage.from('ptone_drive').createSignedUrl(file.storage_path, 3600)
    if (data?.signedUrl) { const a = document.createElement('a'); a.href = data.signedUrl; a.download = file.name; a.click() }
    setDlId(null)
  }

  async function handleDelete(file: CFile) {
    if (!confirm(`Delete "${file.name}"?`)) return
    setDelId(file.id)
    await supabase.storage.from('ptone_drive').remove([file.storage_path])
    await supabase.from('pt_files').delete().eq('id', file.id)
    setFiles(p => p.filter(f => f.id !== file.id))
    setDelId(null)
  }

  return (
    <>
      <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleFile} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ padding: '7px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--accent)', color: '#fff', border: 'none', cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: uploading ? 0.7 : 1 }}>
          {uploading ? '…' : '+ Invoice'}
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--border-strong)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : files.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', border: '1px dashed var(--border-strong)', borderRadius: 14, padding: '60px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🧾</div>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No invoices yet. Upload one above.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {files.map(f => <CFileRow key={f.id} file={f} onDownload={handleDownload} onDelete={handleDelete} dlId={dlId} delId={delId} />)}
        </div>
      )}
    </>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: 'plans',     label: 'Plans'     },
  { id: 'logbook',   label: 'Logbook'   },
  { id: 'journal',   label: 'Journal'   },
  { id: 'documents', label: 'Documents' },
  { id: 'invoices',  label: 'Invoices'  },
]

export default function ClientDetailPage() {
  const router   = useRouter()
  const params   = useParams<{ id: string }>()
  const clientId = params.id
  const supabase = useMemo(() => createClient(), [])

  const [loading,       setLoading]       = useState(true)
  const [trainerId,     setTrainerId]     = useState<string>('')
  const [client,        setClient]        = useState<ClientProfile | null>(null)
  const [tab,           setTab]           = useState<Tab>('plans')
  const [assignedPlans, setAssignedPlans] = useState<AssignedPlan[]>([])
  const [ownPlans,      setOwnPlans]      = useState<OwnPlan[]>([])
  const [sessions,      setSessions]      = useState<Session[]>([])

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      const tid = session.user.id
      setTrainerId(tid)

      // Verify relation exists
      const { data: tc } = await supabase.from('trainer_clients')
        .select('id').eq('trainer_id', tid).eq('client_id', clientId).eq('status', 'active').maybeSingle()
      if (!tc) { router.replace('/clients'); return }

      const [profileRes, assignRes, ownRes, sessRes] = await Promise.all([
        supabase.from('profiles').select('id, first_name, last_name, display_name, email').eq('id', clientId).single(),
        supabase.from('plan_assignments')
          .select('id, plan_id, plans(id, title, description, plan_exercises(count))')
          .eq('client_id', clientId).eq('trainer_id', tid),
        supabase.from('plans')
          .select('id, title, description, plan_exercises(count)')
          .eq('user_id', clientId).order('created_at', { ascending: false }),
        supabase.from('workout_sessions')
          .select('id, title, source, started_at, finished_at, duration_seconds, total_volume_kg, total_sets')
          .eq('user_id', clientId).eq('status', 'completed')
          .order('finished_at', { ascending: false }).limit(100),
      ])

      setClient(profileRes.data as ClientProfile)
      setAssignedPlans((assignRes.data ?? []).map((a: any) => ({
        assignment_id: a.id, plan_id: a.plan_id,
        title: a.plans?.title ?? '', description: a.plans?.description ?? null,
        exercise_count: a.plans?.plan_exercises?.[0]?.count ?? 0,
      })))
      setOwnPlans((ownRes.data ?? []).map((p: any) => ({
        id: p.id, title: p.title, description: p.description,
        exercise_count: p.plan_exercises?.[0]?.count ?? 0,
      })))
      setSessions((sessRes.data ?? []) as Session[])
      setLoading(false)
    }
    load()
  }, [clientId])

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border-strong)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const initials = getInitials(client)
  const name = getDisplayName(client)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Sidebar />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <main style={{ flex: 1, marginLeft: 'var(--sidebar-width)', minHeight: '100vh', transition: 'margin-left 0.2s ease' }}>
        {/* Header */}
        <div style={{ borderBottom: '1px solid var(--border)', padding: '20px 40px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => router.push('/clients')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0, fontFamily: 'inherit', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            Clients
          </button>
          <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{name}</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 1 }}>{client?.email}</p>
          </div>
        </div>

        {/* Tab nav */}
        <div style={{ borderBottom: '1px solid var(--border)', padding: '0 40px', display: 'flex', gap: 0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '13px 18px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 14, fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1, transition: 'color 0.15s',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: '32px 40px', maxWidth: (tab === 'logbook' || tab === 'plans' || tab === 'journal') ? 'none' : 900 }}>
          {tab === 'plans' && (
            <PlansTab clientId={clientId} assignedPlans={assignedPlans} ownPlans={ownPlans} trainerId={trainerId} />
          )}
          {tab === 'logbook' && <LogbookTab sessions={sessions} />}
          {tab === 'journal' && <JournalTab clientId={clientId} trainerId={trainerId} />}
          {tab === 'documents' && <ClientDocumentsTab clientId={clientId} trainerId={trainerId} />}
          {tab === 'invoices'  && <ClientInvoicesTab clientId={clientId} trainerId={trainerId} />}
        </div>
      </main>
    </div>
  )
}
