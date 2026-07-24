'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AddExerciseModal, { type ExerciseOption } from '@/components/exercise/AddExerciseModal'
import { getExerciseFields, getFieldHeader, getFieldInputMode, getBodyweightModifier, type ExerciseField } from '@/lib/exerciseType'
import { getExercisesByIds } from '@/lib/exercisedb'

// ─── Types ────────────────────────────────────────────────────────────────────
interface PlanSet {
  id?: string
  set_number: number
  weight_kg?: number | null
  reps?: number | null
  duration_seconds?: number | null
  distance_km?: number | null
}

interface PlanExercise {
  id: string
  plan_id: string
  exercise_id: string
  position: number
  superset_group: string | null
  default_sets: number | null
  exercises?: { id: string; name: string | null; image_url: string | null; source: string; external_id?: string | null }
  plan_sets?: PlanSet[]
  exercise_type_name?: string | null
  exercise_type_fields?: string[] | null
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
    seen.add(ex.id)
    groups.push({ type: 'single', ex })
  })
  return groups
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function SSIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h8M8 12h8M8 18h8M3 6h.01M3 12h.01M3 18h.01" /></svg>
}
function ReplaceIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
}
function TrashIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
}

// ─── Exercise Menu ─────────────────────────────────────────────────────────────
function ExerciseMenu({ isInSuperset, canPair, onStartPairing, onDissolve, onReplace, onRemove, onClose }: {
  isInSuperset: boolean; canPair: boolean
  onStartPairing: () => void; onDissolve: () => void
  onReplace: () => void; onRemove: () => void; onClose: () => void
}) {
  const itemStyle = (danger = false, disabled = false): React.CSSProperties => ({
    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 10px', borderRadius: 8, border: 'none', background: 'transparent',
    cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 14, textAlign: 'left',
    color: disabled ? 'var(--text-subtle)' : danger ? 'var(--danger)' : 'var(--text-primary)',
    fontFamily: 'inherit',
  })
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={onClose} />
      <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, minWidth: 220, background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 14, padding: 6, zIndex: 99, boxShadow: '0 12px 32px rgba(0,0,0,0.4)' }}>
        {isInSuperset
          ? <button onClick={() => { onDissolve(); onClose() }} style={{ ...itemStyle(), color: 'var(--warning)' }}><SSIcon /> Dissolve Superset</button>
          : <button onClick={() => { if (canPair) { onStartPairing(); onClose() } }} disabled={!canPair} style={itemStyle(false, !canPair)}><SSIcon /> Add to Superset</button>
        }
        <button onClick={() => { onReplace(); onClose() }} style={itemStyle()}><ReplaceIcon /> Replace Exercise</button>
        <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
        <button onClick={() => { onRemove(); onClose() }} style={itemStyle(true)}><TrashIcon /> Remove Exercise</button>
      </div>
    </>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function PlanEditClient({ planId }: { planId: string }) {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [exercises, setExercises] = useState<PlanExercise[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [replacingExerciseId, setReplacingExerciseId] = useState<string | null>(null)
  const [supersetPickingFor, setSupersetPickingFor] = useState<string | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [dragState, setDragState] = useState<{ exerciseId: string; exerciseIndex: number; startY: number; currentY: number; targetIndex: number } | null>(null)

  const exerciseRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressFired = useRef(false)
  const longPressStart = useRef({ y: 0 })
  const dragStateRef = useRef(dragState)
  const exercisesRef = useRef(exercises)
  useEffect(() => { dragStateRef.current = dragState }, [dragState])
  useEffect(() => { exercisesRef.current = exercises }, [exercises])

  useEffect(() => {
    async function load() {
      const [planRes, exRes] = await Promise.all([
        supabase.from('plans').select('id, title, description').eq('id', planId).single(),
        supabase.from('plan_exercises')
          .select('*, exercises(id, name, image_url, source, external_id), plan_sets(id, set_number, weight_kg, reps, duration_seconds, distance_km)')
          .eq('plan_id', planId)
          .order('position'),
      ])

      if (!planRes.data) { router.replace('/dashboard'); return }
      setTitle(planRes.data.title)
      setDescription(planRes.data.description ?? '')

      const mapped = (exRes.data ?? []).map(ex => ({
        ...ex,
        plan_sets: ex.plan_sets?.length
          ? [...ex.plan_sets].sort((a, b) => a.set_number - b.set_number)
          : [{ set_number: 1, weight_kg: null, reps: null }],
      }))

      // Enrich with ExerciseDB type fields
      const extIds = mapped.map((ex: any) => ex.exercises?.external_id).filter(Boolean) as string[]
      if (extIds.length > 0) {
        const edbRows = await getExercisesByIds(extIds)
        const byId = Object.fromEntries(edbRows.map(r => [r.id, r]))
        setExercises(mapped.map((ex: any) => {
          const edb = byId[ex.exercises?.external_id ?? '']
          if (!edb) return ex
          const rawF = edb.exercise_type_fields
          const parsedF = Array.isArray(rawF) ? rawF as string[]
            : typeof rawF === 'string' ? (() => { try { const p = JSON.parse(rawF); return Array.isArray(p) ? p : null } catch { return null } })()
            : null
          return {
            ...ex,
            exercise_type_name:   edb.exercise_type_name,
            exercise_type_fields: parsedF,
            exercises: { ...ex.exercises, image_url: ex.exercises?.image_url || edb.image_url || null },
          }
        }))
      } else {
        setExercises(mapped)
      }
      setLoading(false)
    }
    load()
  }, [planId])

  // ─── Drag reorder ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!dragState) return
    function onMove(e: TouchEvent) {
      e.preventDefault()
      const cy = e.touches[0].clientY
      const ds = dragStateRef.current
      if (!ds) return
      const others = exercisesRef.current.filter(ex => ex.id !== ds.exerciseId)
      let ti = others.length
      for (let i = 0; i < others.length; i++) {
        const el = exerciseRefs.current.get(others[i].id)
        if (!el) continue
        const r = el.getBoundingClientRect()
        if (cy < r.top + r.height / 2) { ti = i; break }
      }
      setDragState(prev => prev ? { ...prev, currentY: cy, targetIndex: ti } : null)
    }
    async function onEnd() {
      const ds = dragStateRef.current
      if (!ds) return
      const exs = exercisesRef.current
      if (ds.targetIndex !== ds.exerciseIndex) {
        const n = [...exs]
        const [m] = n.splice(ds.exerciseIndex, 1)
        n.splice(ds.targetIndex, 0, m)
        const updated = n.map((ex, i) => ({ ...ex, position: i }))
        setExercises(updated)
        await Promise.all(updated.map(ex => supabase.from('plan_exercises').update({ position: ex.position }).eq('id', ex.id)))
      }
      setDragState(null)
    }
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => { window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd) }
  }, [!!dragState])

  function handleNameTouchStart(e: React.TouchEvent, exerciseId: string, index: number) {
    longPressFired.current = false
    longPressStart.current = { y: e.touches[0].clientY }
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true
      navigator.vibrate?.(40)
      setDragState({ exerciseId, exerciseIndex: index, startY: longPressStart.current.y, currentY: longPressStart.current.y, targetIndex: index })
    }, 500)
  }
  function handleNameTouchMove(e: React.TouchEvent) {
    if (longPressFired.current) return
    if (Math.abs(e.touches[0].clientY - longPressStart.current.y) > 10) clearTimeout(longPressTimer.current!)
  }
  function handleNameTouchEnd() { if (!longPressFired.current) clearTimeout(longPressTimer.current!) }

  function getInsertionLineIndex() {
    if (!dragState) return -1
    const others = exercises.filter(ex => ex.id !== dragState.exerciseId)
    const target = others[dragState.targetIndex]
    if (!target) return exercises.length
    return exercises.findIndex(ex => ex.id === target.id)
  }
  const insertionLineAt = getInsertionLineIndex()

  // ─── Set helpers ───────────────────────────────────────────────────────────
  function updateSet(exId: string, si: number, field: string, value: string) {
    const nv = value === '' ? null : parseFloat(value)
    setExercises(p => p.map(ex => {
      if (ex.id !== exId) return ex
      const s = [...(ex.plan_sets ?? [])]
      s[si] = { ...s[si], [field]: nv }
      return { ...ex, plan_sets: s }
    }))
  }
  function addSet(exId: string) {
    setExercises(p => p.map(ex => {
      if (ex.id !== exId) return ex
      const s = ex.plan_sets ?? []
      const last = s[s.length - 1]
      const fields = getExerciseFields({}, { exercise_type_fields: ex.exercise_type_fields }); const vals: Partial<PlanSet> = {}; for (const f of fields) (vals as any)[f] = (last as any)?.[f] ?? null; return { ...ex, plan_sets: [...s, { set_number: s.length + 1, ...vals }] }
    }))
  }
  function removeSet(exId: string, si: number) {
    setExercises(p => p.map(ex => {
      if (ex.id !== exId) return ex
      const s = (ex.plan_sets ?? []).filter((_, i) => i !== si).map((x, i) => ({ ...x, set_number: i + 1 }))
      return { ...ex, plan_sets: s }
    }))
  }

  // ─── Exercise helpers ──────────────────────────────────────────────────────
  async function resolveExerciseId(opt: ExerciseOption): Promise<string | undefined> {
    if (opt.source === 'custom') return opt.exerciseId
    const { data: existing } = await supabase
      .from('exercises').select('id')
      .eq('external_id', opt.exerciseId).eq('source', 'exercisedb')
      .maybeSingle()
    if (existing?.id) return existing.id
    const { data: created } = await supabase
      .from('exercises')
      .insert({ external_id: opt.exerciseId, source: 'exercisedb', name: opt.name })
      .select('id').single()
    return created?.id
  }

  async function addExercise(opt: ExerciseOption) {
    const exerciseId = await resolveExerciseId(opt)
    if (!exerciseId) return
    const { data: pe } = await supabase
      .from('plan_exercises')
      .insert({ plan_id: planId, exercise_id: exerciseId, position: exercises.length, default_sets: 3 })
      .select('*, exercises(id, name, image_url, source)')
      .single()
    if (pe) {
      const rawFields = opt.exercise_type_fields
      const parsedFields = Array.isArray(rawFields) ? rawFields as string[]
        : typeof rawFields === 'string' ? (() => { try { const p = JSON.parse(rawFields); return Array.isArray(p) ? p : null } catch { return null } })()
        : null
      const blankSet = (n: number): PlanSet => {
        const s: PlanSet = { set_number: n }
        for (const f of (parsedFields ?? ['weight_kg', 'reps'])) (s as any)[f] = null
        return s
      }
      setExercises(p => [...p, {
        ...pe,
        exercise_type_name:   opt.exercise_type_name ?? null,
        exercise_type_fields: parsedFields,
        exercises: { ...(pe as any).exercises, image_url: (pe as any).exercises?.image_url || opt.imageUrl || null },
        plan_sets: [blankSet(1), blankSet(2), blankSet(3)],
      }])
      setShowAddExercise(false)
    }
  }

  async function replaceExercise(opt: ExerciseOption) {
    if (!replacingExerciseId) return
    const reid = replacingExerciseId
    const exerciseId = await resolveExerciseId(opt)
    if (!exerciseId) return
    await supabase.from('plan_exercises').update({ exercise_id: exerciseId }).eq('id', reid)
    const { data: exRow } = await supabase.from('exercises').select('id, name, image_url, source').eq('id', exerciseId).single()
    setExercises(prev => prev.map(ex => ex.id === reid
      ? { ...ex, exercise_id: exerciseId, exercises: exRow ?? { id: exerciseId, name: opt.name, image_url: opt.imageUrl, source: opt.source ?? 'exercisedb' } }
      : ex
    ))
    setReplacingExerciseId(null)
  }

  async function removeExercise(id: string) {
    const ex = exercises.find(e => e.id === id)
    if (ex?.superset_group) {
      await supabase.from('plan_exercises').update({ superset_group: null }).eq('superset_group', ex.superset_group)
      setExercises(p => p.map(e => e.superset_group === ex.superset_group ? { ...e, superset_group: null } : e))
    }
    await supabase.from('plan_exercises').delete().eq('id', id)
    setExercises(p => p.filter(e => e.id !== id))
  }

  async function handleSupersetPair(targetId: string) {
    if (!supersetPickingFor) return
    const groupId = crypto.randomUUID()
    await supabase.from('plan_exercises').update({ superset_group: groupId }).in('id', [supersetPickingFor, targetId])
    setExercises(p => p.map(ex => ex.id === supersetPickingFor || ex.id === targetId ? { ...ex, superset_group: groupId } : ex))
    setSupersetPickingFor(null)
  }

  async function handleSupersetDissolve(groupId: string) {
    await supabase.from('plan_exercises').update({ superset_group: null }).eq('superset_group', groupId)
    setExercises(p => p.map(ex => ex.superset_group === groupId ? { ...ex, superset_group: null } : ex))
  }

  // ─── Save ─────────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true)
    await supabase.from('plans').update({ title: title.trim(), description: description.trim() || null }).eq('id', planId)
    await Promise.all(exercises.map(async (ex, index) => {
      await supabase.from('plan_exercises').update({ position: index }).eq('id', ex.id)
      const sets = ex.plan_sets ?? []
      await supabase.from('plan_sets').delete().eq('plan_exercise_id', ex.id)
      if (sets.length > 0) {
        const exFields = getExerciseFields({}, { exercise_type_fields: ex.exercise_type_fields })
        await supabase.from('plan_sets').insert(sets.map(s => {
          const row: Record<string,unknown> = { plan_exercise_id: ex.id, set_number: s.set_number }
          for (const f of exFields) row[f] = (s as any)[f] ?? null
          return row
        }))
      }
    }))
    setSaving(false)
    router.push('/dashboard')
  }

  // ─── Render helpers ────────────────────────────────────────────────────────
  const renderGroups = buildRenderGroups(exercises)

  function renderExBlock(ex: PlanExercise, index: number) {
    const name = ex.exercises?.name ?? 'Exercise'
    const imageUrl = ex.exercises?.image_url ?? null
    const isInSS = !!ex.superset_group
    const isPairingTarget = !!supersetPickingFor && supersetPickingFor !== ex.id && !isInSS
    const canPair = !isInSS && exercises.filter(e => !e.superset_group && e.id !== ex.id).length > 0
    const isDragging = dragState?.exerciseId === ex.id
    const isMenuOpen = menuOpenId === ex.id

    return (
      <div
        key={ex.id}
        ref={el => { if (el) exerciseRefs.current.set(ex.id, el); else exerciseRefs.current.delete(ex.id) }}
        style={{ opacity: isDragging ? 0.4 : 1, transition: 'opacity 0.15s' }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}
            onClick={() => isPairingTarget && handleSupersetPair(ex.id)}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
              background: isPairingTarget ? 'rgba(124,106,255,0.3)' : 'rgba(124,106,255,0.15)',
              border: isPairingTarget ? '2px solid rgba(124,106,255,0.8)' : '1px solid rgba(124,106,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: isPairingTarget ? 'pointer' : 'default', transition: 'all 0.2s',
            }}>
              {isPairingTarget
                ? <span style={{ color: 'var(--accent)', fontSize: 20, fontWeight: 700 }}>+</span>
                : imageUrl
                  ? <img src={imageUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 16 }}>💪</span>
              }
            </div>
            <button
              onTouchStart={e => !supersetPickingFor && handleNameTouchStart(e, ex.id, index)}
              onTouchMove={handleNameTouchMove}
              onTouchEnd={handleNameTouchEnd}
              onContextMenu={e => e.preventDefault()}
              style={{
                background: 'none', border: 'none', padding: 0, textAlign: 'left',
                color: 'var(--accent)', fontWeight: 600, fontSize: 15, fontFamily: 'inherit',
                cursor: isPairingTarget ? 'pointer' : dragState ? 'grabbing' : 'grab',
                WebkitUserSelect: 'none', userSelect: 'none',
                opacity: supersetPickingFor && !isPairingTarget && supersetPickingFor !== ex.id ? 0.35 : 1,
                transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {name}
              {isPairingTarget && <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>tap to pair</span>}
              {(()=>{const m=getBodyweightModifier({exercise_type_name:ex.exercise_type_name,name:ex.exercises?.name});if(!m)return null;const isW=m==='weighted';return(<span style={{fontSize:'10px',fontWeight:700,color:isW?'var(--success)':'var(--danger)',background:isW?'rgba(62,207,142,0.15)':'rgba(240,68,68,0.15)',border:`1px solid ${isW?'rgba(62,207,142,0.35)':'rgba(240,68,68,0.35)'}`,borderRadius:4,padding:'1px 5px',flexShrink:0}}>{isW?'+W':'-W'}</span>)})()}
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => !supersetPickingFor && setMenuOpenId(isMenuOpen ? null : ex.id)}
              style={{
                background: isMenuOpen ? 'rgba(124,106,255,0.12)' : 'none', border: 'none',
                borderRadius: 8, color: 'var(--text-muted)', fontSize: 18, padding: '4px 8px',
                cursor: 'pointer', opacity: supersetPickingFor && supersetPickingFor !== ex.id ? 0.3 : 1,
                transition: 'all 0.15s',
              }}
            >···</button>
            {isMenuOpen && (
              <ExerciseMenu
                isInSuperset={isInSS}
                canPair={canPair}
                onStartPairing={() => setSupersetPickingFor(ex.id)}
                onDissolve={() => ex.superset_group && handleSupersetDissolve(ex.superset_group)}
                onReplace={() => setReplacingExerciseId(ex.id)}
                onRemove={() => removeExercise(ex.id)}
                onClose={() => setMenuOpenId(null)}
              />
            )}
          </div>
        </div>

        {/* Sets table */}
        {(()=>{
          const exFields = getExerciseFields({}, { exercise_type_fields: ex.exercise_type_fields })
          const modifier = getBodyweightModifier({ exercise_type_name: ex.exercise_type_name })
          const colH = (f: ExerciseField) => f==='weight_kg'&&modifier==='weighted'?'+kg':f==='weight_kg'&&modifier==='assisted'?'-kg':getFieldHeader(f)
          return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `32px ${exFields.map(()=>'1fr').join(' ')} 32px`, padding: '8px 14px', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)' }}>
            {['Set', ...exFields.map(colH), ''].map((h, i) => (
              <span key={i} style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', fontWeight: 500 }}>{h}</span>
            ))}
          </div>
          {(ex.plan_sets ?? []).map((s, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: `32px ${exFields.map(()=>'1fr').join(' ')} 32px`, padding: '10px 14px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
              <span style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{s.set_number}</span>
              {exFields.map(f => (
                <input key={f}
                  type="number" inputMode={getFieldInputMode(f)} placeholder="0"
                  value={(s as any)[f] ?? ''}
                  onFocus={e => e.target.select()}
                  onChange={e => updateSet(ex.id, i, f, e.target.value)}
                  style={{ textAlign: 'center', fontSize: 15, fontWeight: 500, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontFamily: 'inherit', width: '100%' }}
                />
              ))}
              <button
                onClick={() => removeSet(ex.id, i)}
                style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: 18, padding: 0, cursor: 'pointer', textAlign: 'center' }}
              >×</button>
            </div>
          ))}
          <button
            onClick={() => addSet(ex.id)}
            style={{ width: '100%', padding: '9px', background: 'rgba(124,106,255,0.08)', border: 'none', color: 'var(--accent)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
          >+ Add Set</button>
        </div>
        )})()}
      </div>
    )
  }

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--border-strong)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-page)', paddingBottom: 40 }}>
      {/* Superset picking banner */}
      {supersetPickingFor && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 150, background: 'var(--accent)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Choose an exercise for the superset</span>
          <button onClick={() => setSupersetPickingFor(null)} style={{ background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: 8, padding: '4px 12px', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
        </div>
      )}

      {/* Sticky header */}
      <header style={{
        position: 'sticky', top: supersetPickingFor ? 44 : 0, zIndex: 100,
        background: 'var(--bg-page)', borderBottom: '1px solid var(--border)',
        padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'top 0.2s',
      }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 500, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
        <span style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)' }}>Edit Plan</span>
        <button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          style={{ background: 'none', border: 'none', fontWeight: 600, fontSize: 15, cursor: title.trim() ? 'pointer' : 'default', color: title.trim() ? 'var(--accent)' : 'var(--text-subtle)', fontFamily: 'inherit' }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </header>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Title + description */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 500 }}>Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Plan title"
              style={{ fontSize: 16, fontWeight: 600, width: '100%', background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontFamily: 'inherit' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 500 }}>Description</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional description"
              style={{ fontSize: 15, width: '100%', background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        {exercises.length > 1 && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', opacity: 0.7, margin: 0 }}>Hold exercise name to reorder</p>
        )}

        {/* Exercise blocks */}
        {renderGroups.map(group => {
          if (group.type === 'single') {
            const isDragging = dragState?.exerciseId === group.ex.id
            const idx = exercises.findIndex(e => e.id === group.ex.id)
            return (
              <div key={group.ex.id}>
                {dragState && !isDragging && insertionLineAt === idx && (
                  <div style={{ height: 2, borderRadius: 2, margin: '0 0 8px', background: 'var(--accent)' }} />
                )}
                {renderExBlock(group.ex, idx)}
              </div>
            )
          }
          const idxA = exercises.findIndex(e => e.id === group.exA.id)
          return (
            <div key={group.groupId} style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 3, borderRadius: 3, background: 'linear-gradient(to bottom, var(--accent), rgba(124,106,255,0.2))', flexShrink: 0, marginTop: 6 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
                <div style={{ marginBottom: -10 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--accent)', background: 'rgba(124,106,255,0.1)', border: '1px solid rgba(124,106,255,0.25)', borderRadius: 20, padding: '2px 8px' }}>SUPERSET</span>
                </div>
                {renderExBlock(group.exA, idxA)}
                {renderExBlock(group.exB, idxA + 1)}
              </div>
            </div>
          )
        })}

        {dragState && insertionLineAt === exercises.length && (
          <div style={{ height: 2, borderRadius: 2, background: 'var(--accent)' }} />
        )}

        <button
          onClick={() => setShowAddExercise(true)}
          style={{ width: '100%', padding: 14, background: 'rgba(124,106,255,0.08)', border: '1px solid rgba(124,106,255,0.3)', borderRadius: 14, color: 'var(--accent)', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          + Add Exercise
        </button>
      </div>

      {showAddExercise && <AddExerciseModal onAdd={addExercise} onClose={() => setShowAddExercise(false)} />}
      {replacingExerciseId && <AddExerciseModal onAdd={replaceExercise} onClose={() => setReplacingExerciseId(null)} />}
    </div>
  )
}
