'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AddExerciseModal, { type ExerciseOption } from '@/components/exercise/AddExerciseModal'

// ─── Types ────────────────────────────────────────────────────────────────────
interface WorkoutExercise {
  id: string
  workout_session_id: string
  exercise_id: string
  position: number
  superset_group: string | null
  exercises?: { id: string; name: string | null; image_url: string | null; source: string }
}

interface WorkoutSet {
  id: string
  workout_exercise_id: string
  set_number: number
  weight_kg: number | null
  reps: number | null
  is_completed: boolean
}

type PrevSet = { weight_kg: number | null; reps: number | null; set_number: number }

type RenderGroup =
  | { type: 'single'; ex: WorkoutExercise; index: number }
  | { type: 'superset'; exA: WorkoutExercise; exB: WorkoutExercise; indexA: number; indexB: number; groupId: string }

function buildRenderGroups(exercises: WorkoutExercise[]): RenderGroup[] {
  const groups: RenderGroup[] = []
  const seen = new Set<string>()
  exercises.forEach((ex, index) => {
    if (seen.has(ex.id)) return
    if (ex.superset_group) {
      const pi = exercises.findIndex(e => e.superset_group === ex.superset_group && e.id !== ex.id)
      if (pi !== -1) {
        const partner = exercises[pi]
        seen.add(ex.id); seen.add(partner.id)
        groups.push({ type: 'superset', exA: ex, exB: partner, indexA: index, indexB: pi, groupId: ex.superset_group })
        return
      }
    }
    seen.add(ex.id)
    groups.push({ type: 'single', ex, index })
  })
  return groups
}

// ─── Superset helpers ─────────────────────────────────────────────────────────
async function pairSuperset(supabase: ReturnType<typeof createClient>, idA: string, idB: string): Promise<string> {
  const groupId = crypto.randomUUID()
  await supabase.from('workout_exercises').update({ superset_group: groupId }).in('id', [idA, idB])
  return groupId
}

async function dissolveSuperset(supabase: ReturnType<typeof createClient>, groupId: string) {
  await supabase.from('workout_exercises').update({ superset_group: null }).eq('superset_group', groupId)
}

// ─── Note inline ──────────────────────────────────────────────────────────────
function NoteInline({ exerciseId, userId, initialNote, supabase }: {
  exerciseId: string; userId: string; initialNote: string
  supabase: ReturnType<typeof createClient>
}) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(initialNote)
  const [saved, setSaved] = useState(false)
  const lastSaved = useRef(initialNote)

  async function save() {
    if (text === lastSaved.current) return
    lastSaved.current = text
    setSaved(true)
    await supabase.from('exercise_notes').upsert(
      { user_id: userId, exercise_id: exerciseId, note: text, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,exercise_id' }
    )
    setTimeout(() => setSaved(false), 1500)
  }

  if (!open) return (
    <button onClick={() => setOpen(true)}
      style={{ background: 'none', border: 'none', padding: '2px 0 8px', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 5, opacity: text ? 0.8 : 0.4 }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      {text ? (text.length > 50 ? text.slice(0, 50) + '…' : text) : 'Add note'}
    </button>
  )

  return (
    <div style={{ paddingBottom: 8 }}>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Note for this exercise…" rows={2}
        style={{ width: '100%', background: 'rgba(124,106,255,0.08)', border: '1px solid rgba(124,106,255,0.25)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.4, padding: '8px 10px', resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
        <button onClick={() => { save(); setOpen(false) }}
          style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>Save</button>
        {saved && <span style={{ fontSize: 11, color: 'var(--success)' }}>✓ Saved</span>}
      </div>
    </div>
  )
}

// ─── Swipeable set row ────────────────────────────────────────────────────────
function SwipeableSetRow({ s, i, isCompleted, isHighlighted, prevValue, onComplete, onUpdate, onDelete }: {
  s: WorkoutSet; i: number; isCompleted: boolean; isHighlighted: boolean
  prevValue: string; onComplete: () => void; onUpdate: (f: string, v: string) => void; onDelete: () => void
}) {
  const rowRef = useRef<HTMLDivElement>(null)
  const bgRef  = useRef<HTMLDivElement>(null)
  const cbRef  = useRef(onDelete)
  useEffect(() => { cbRef.current = onDelete }, [onDelete])

  useEffect(() => {
    const row = rowRef.current; if (!row) return
    const el = row as HTMLDivElement
    let sx = 0, sy = 0, dir: 'h' | 'v' | null = null, off = 0
    function apply(val: number, anim = false) {
      off = val
      el.style.transition = anim ? 'transform 0.25s ease' : 'none'
      el.style.transform = `translateX(${val}px)`
      if (bgRef.current) bgRef.current.style.opacity = String(Math.min(1, Math.abs(val) / 60))
    }
    function ts(e: TouchEvent) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; dir = null }
    function tm(e: TouchEvent) {
      const dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy
      if (!dir) { if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return; dir = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v' }
      if (dir === 'v') return
      if (dx > 0) { apply(0, true); return }
      e.preventDefault(); apply(Math.max(dx, -100))
    }
    function te() {
      if (dir === 'h' && off < -60) { apply(-110, true); setTimeout(() => cbRef.current(), 220) }
      else apply(0, true)
    }
    el.addEventListener('touchstart', ts, { passive: true })
    el.addEventListener('touchmove', tm, { passive: false })
    el.addEventListener('touchend', te, { passive: true })
    return () => { el.removeEventListener('touchstart', ts); el.removeEventListener('touchmove', tm); el.removeEventListener('touchend', te) }
  }, [])

  const rowBg = isHighlighted
    ? 'rgba(124,106,255,0.18)'
    : isCompleted
    ? 'rgba(62,207,142,0.1)'
    : i % 2 === 1 ? 'var(--bg-tertiary)' : 'var(--bg-card)'

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <div ref={bgRef} style={{ position: 'absolute', inset: 0, opacity: 0, background: 'rgba(240,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 20, pointerEvents: 'none' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f04444" strokeWidth="1.8" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      </div>
      <div ref={rowRef} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr 1fr 36px', padding: '10px 14px', background: rowBg, borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center', position: 'relative', zIndex: 1, willChange: 'transform', outline: isHighlighted ? '1px solid rgba(124,106,255,0.5)' : 'none' }}>
        <span style={{ textAlign: 'center', fontWeight: 600, fontSize: 12, color: isCompleted ? 'var(--success)' : 'var(--text-muted)' }}>{s.set_number}</span>
        <span style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, opacity: prevValue === '—' ? 0.3 : 0.7 }}>{prevValue}</span>
        <input type="number" inputMode="decimal" placeholder="0" value={s.weight_kg ?? ''} onFocus={e => e.target.select()} onChange={e => onUpdate('weight_kg', e.target.value)} disabled={isCompleted}
          style={{ textAlign: 'center', width: '100%', fontSize: 16, fontWeight: 500, opacity: isCompleted ? 0.5 : 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontFamily: 'inherit' }} />
        <input type="number" inputMode="numeric" placeholder="0" value={s.reps ?? ''} onFocus={e => e.target.select()} onChange={e => onUpdate('reps', e.target.value)} disabled={isCompleted}
          style={{ textAlign: 'center', width: '100%', fontSize: 16, fontWeight: 500, opacity: isCompleted ? 0.5 : 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontFamily: 'inherit' }} />
        <button onClick={onComplete}
          style={{ width: 28, height: 28, borderRadius: '50%', border: isCompleted ? '2px solid var(--success)' : '2px solid rgba(255,255,255,0.2)', background: isCompleted ? 'rgba(62,207,142,0.3)' : 'transparent', color: isCompleted ? 'var(--success)' : 'transparent', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          {isCompleted ? '✓' : ''}
        </button>
      </div>
    </div>
  )
}

// ─── Exercise menu ────────────────────────────────────────────────────────────
function ExerciseMenu({ isInSuperset, canPair, onStartPairing, onDissolve, onRemove, onReplace, onClose }: {
  isInSuperset: boolean; canPair: boolean
  onStartPairing: () => void; onDissolve: () => void; onRemove: () => void; onReplace: () => void; onClose: () => void
}) {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={onClose} />
      <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, minWidth: 210, background: 'var(--bg-card)', border: '1px solid rgba(124,106,255,0.2)', borderRadius: 14, padding: 6, zIndex: 99, boxShadow: '0 12px 32px rgba(0,0,0,0.5)' }}>
        {isInSuperset
          ? <MenuItem onClick={() => { onDissolve(); onClose() }} color="var(--warning)">Dissolve Superset</MenuItem>
          : <MenuItem onClick={() => { if (canPair) { onStartPairing(); onClose() } }} disabled={!canPair}>Add to Superset</MenuItem>
        }
        <MenuItem onClick={() => { onReplace(); onClose() }}>Replace Exercise</MenuItem>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '6px 0' }} />
        <MenuItem onClick={() => { onRemove(); onClose() }} color="var(--danger)">Remove Exercise</MenuItem>
      </div>
    </>
  )
}

function MenuItem({ children, onClick, color, disabled }: { children: React.ReactNode; onClick: () => void; color?: string; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width: '100%', display: 'flex', alignItems: 'center', padding: '9px 10px', borderRadius: 8, border: 'none', background: 'transparent', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 14, textAlign: 'left', color: disabled ? 'rgba(255,255,255,0.2)' : color ?? 'var(--text-primary)', fontFamily: 'inherit' }}>
      {children}
    </button>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function WorkoutClient() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const sessionId    = searchParams.get('session')
  const supabase     = useRef(createClient()).current

  const [loading,          setLoading]          = useState(true)
  const [userId,           setUserId]           = useState('')
  const [title,            setTitle]            = useState('')
  const [editingTitle,     setEditingTitle]     = useState(false)
  const [titleDraft,       setTitleDraft]       = useState('')
  const [startedAt,        setStartedAt]        = useState<string | null>(null)
  const [exercises,        setExercises]        = useState<WorkoutExercise[]>([])
  const [sets,             setSets]             = useState<WorkoutSet[]>([])
  const [previousSets,     setPreviousSets]     = useState<Record<string, PrevSet[]>>({})
  const [initialNotes,     setInitialNotes]     = useState<Record<string, string>>({})
  const [elapsed,          setElapsed]          = useState(0)
  const [completedSets,    setCompletedSets]    = useState<Set<string>>(new Set())
  const [showDelete,       setShowDelete]       = useState(false)
  const [showAddExercise,  setShowAddExercise]  = useState(false)
  const [menuOpenId,       setMenuOpenId]       = useState<string | null>(null)
  const [highlightSetId,   setHighlightSetId]   = useState<string | null>(null)
  const [supersetPickingFor,  setSupersetPickingFor]  = useState<string | null>(null)
  const [replacingExerciseId, setReplacingExerciseId] = useState<string | null>(null)
  const [dragState,        setDragState]        = useState<{ exerciseId: string; exerciseIndex: number; startY: number; currentY: number; targetIndex: number } | null>(null)

  const exerciseRefs    = useRef<Map<string, HTMLDivElement>>(new Map())
  const longPressTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressFired  = useRef(false)
  const longPressStart  = useRef({ y: 0 })
  const dragStateRef    = useRef(dragState)
  const exercisesRef    = useRef(exercises)
  const completedRef    = useRef(completedSets)
  const setsRef         = useRef(sets)
  const titleRef        = useRef(title)

  useEffect(() => { dragStateRef.current = dragState }, [dragState])
  useEffect(() => { exercisesRef.current = exercises }, [exercises])
  useEffect(() => { completedRef.current = completedSets }, [completedSets])
  useEffect(() => { setsRef.current = sets }, [sets])
  useEffect(() => { titleRef.current = title }, [title])

  // Load session data
  useEffect(() => {
    if (!sessionId) { router.replace('/dashboard'); return }

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      setUserId(user.id)

      const { data: session } = await supabase
        .from('workout_sessions')
        .select('id, title, started_at, status, user_id')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single()

      if (!session || session.status !== 'active') { router.replace('/dashboard'); return }
      setTitle(session.title)
      setTitleDraft(session.title)
      setStartedAt(session.started_at)

      const [exRes, setRes] = await Promise.all([
        supabase.from('workout_exercises')
          .select('*, exercises(id, name, image_url, source)')
          .eq('workout_session_id', sessionId)
          .order('position'),
        supabase.from('sets')
          .select('*')
          .eq('workout_session_id', sessionId)
          .order('set_number'),
      ])

      const exs = (exRes.data ?? []) as WorkoutExercise[]
      setExercises(exs)
      setSets((setRes.data ?? []) as WorkoutSet[])

      // Restore completed sets from localStorage
      try {
        const saved = localStorage.getItem(`ptone_completed_${sessionId}`)
        if (saved) setCompletedSets(new Set(JSON.parse(saved)))
      } catch {}

      // Previous sets
      const exerciseIds = exs.map(e => e.exercise_id)
      if (exerciseIds.length > 0) {
        const { data: prevData } = await supabase
          .from('workout_exercises')
          .select(`exercise_id, sets(weight_kg, reps, set_number), workout_sessions!inner(finished_at, status, user_id)`)
          .eq('workout_sessions.user_id', user.id)
          .eq('workout_sessions.status', 'completed')
          .neq('workout_session_id', sessionId)
          .in('exercise_id', exerciseIds)
          .order('workout_sessions(finished_at)', { ascending: false })

        if (prevData) {
          const prev: Record<string, PrevSet[]> = {}
          for (const we of prevData) {
            if (!prev[we.exercise_id] && (we.sets as any[])?.length > 0) {
              prev[we.exercise_id] = (we.sets as any[]).sort((a: any, b: any) => a.set_number - b.set_number)
            }
          }
          setPreviousSets(prev)
        }

        // Exercise notes
        const { data: notesData } = await supabase
          .from('exercise_notes')
          .select('exercise_id, note')
          .eq('user_id', user.id)
          .in('exercise_id', exerciseIds)
        const notes: Record<string, string> = {}
        notesData?.forEach((n: any) => { notes[n.exercise_id] = n.note })
        setInitialNotes(notes)
      }

      setLoading(false)
    }
    load()
  }, [sessionId])

  // Timer
  useEffect(() => {
    if (!startedAt) return
    const start = new Date(startedAt).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt])

  // Persist completed sets
  useEffect(() => {
    if (!sessionId) return
    try { localStorage.setItem(`ptone_completed_${sessionId}`, JSON.stringify([...completedSets])) } catch {}
  }, [completedSets, sessionId])

  // Drag reorder
  useEffect(() => {
    if (!dragState) return
    function onMove(e: TouchEvent) {
      e.preventDefault()
      const cy = e.touches[0].clientY
      const ds = dragStateRef.current; if (!ds) return
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
      const ds = dragStateRef.current; if (!ds) return
      const exs = exercisesRef.current
      if (ds.targetIndex !== ds.exerciseIndex) {
        const n = [...exs]; const [m] = n.splice(ds.exerciseIndex, 1); n.splice(ds.targetIndex, 0, m)
        const u = n.map((ex, i) => ({ ...ex, position: i }))
        setExercises(u)
        await Promise.all(u.map(ex => supabase.from('workout_exercises').update({ position: ex.position }).eq('id', ex.id)))
      }
      setDragState(null)
    }
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => { window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd) }
  }, [!!dragState])

  function formatTime(s: number) {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const totalVolume = sets.reduce((a, s) => s.weight_kg && s.reps ? a + s.weight_kg * s.reps : a, 0)
  const totalSets   = sets.length

  async function addSet(weid: string) {
    const es = sets.filter(s => s.workout_exercise_id === weid).sort((a, b) => a.set_number - b.set_number)
    const ls = es[es.length - 1]
    const { data: ns } = await supabase.from('sets').insert({
      workout_session_id: sessionId, workout_exercise_id: weid,
      set_number: es.length + 1, weight_kg: ls?.weight_kg ?? null, reps: ls?.reps ?? null,
    }).select().single()
    if (ns) setSets(p => [...p, ns as WorkoutSet])
  }

  async function removeSet(sid: string, weid: string) {
    await supabase.from('sets').delete().eq('id', sid)
    setSets(prev => {
      const remaining = prev.filter(s => s.id !== sid)
      const exSets = remaining.filter(s => s.workout_exercise_id === weid).sort((a, b) => a.set_number - b.set_number)
      const renumbered = new Map(exSets.map((s, i) => [s.id, i + 1]))
      renumbered.forEach((newNum, id) => { supabase.from('sets').update({ set_number: newNum }).eq('id', id) })
      return remaining.map(s => renumbered.has(s.id) ? { ...s, set_number: renumbered.get(s.id)! } : s)
    })
    setCompletedSets(prev => { const n = new Set(prev); n.delete(sid); return n })
  }

  async function updateSet(sid: string, field: string, value: string) {
    const nv = value === '' ? null : parseFloat(value)
    setSets(prev => prev.map(s => s.id === sid ? { ...s, [field]: nv } : s))
    await supabase.from('sets').update({ [field]: nv, updated_at: new Date().toISOString() }).eq('id', sid)
  }

  function handleSetComplete(setId: string, exerciseId: string) {
    const nowCompleted = !completedSets.has(setId)
    setCompletedSets(p => { const n = new Set(p); n.has(setId) ? n.delete(setId) : n.add(setId); return n })
    if (!nowCompleted) return
    // In a superset, highlight next partner set
    const ex = exercisesRef.current.find(e => e.id === exerciseId); if (!ex?.superset_group) return
    const partner = exercisesRef.current.find(e => e.superset_group === ex.superset_group && e.id !== exerciseId); if (!partner) return
    const thisSet = setsRef.current.find(s => s.id === setId); if (!thisSet) return
    const nextSet = setsRef.current.filter(s => s.workout_exercise_id === partner.id).find(s => s.set_number === thisSet.set_number && !completedRef.current.has(s.id))
    if (nextSet) {
      setHighlightSetId(nextSet.id)
      exerciseRefs.current.get(partner.id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      setTimeout(() => setHighlightSetId(null), 1800)
    }
  }

  async function resolveExerciseId(option: ExerciseOption): Promise<string | undefined> {
    if (option.source === 'custom') return option.exerciseId
    const { data: existing } = await supabase
      .from('exercises').select('id')
      .eq('external_id', option.exerciseId).eq('source', 'exercisedb')
      .maybeSingle()
    if (existing?.id) return existing.id
    const { data: created } = await supabase
      .from('exercises')
      .insert({ external_id: option.exerciseId, source: 'exercisedb', name: option.name })
      .select('id').single()
    return created?.id
  }

  async function addExercise(option: ExerciseOption) {
    const exerciseId = await resolveExerciseId(option)
    if (!exerciseId) return
    const { data: we } = await supabase.from('workout_exercises').insert({
      workout_session_id: sessionId, exercise_id: exerciseId, position: exercises.length,
    }).select('*, exercises(id, name, image_url, source)').single()
    if (we) {
      setExercises(p => [...p, we as WorkoutExercise])
      setShowAddExercise(false)
      setReplacingExerciseId(null)
    }
  }

  async function replaceExercise(option: ExerciseOption) {
    if (!replacingExerciseId) return
    const weid = replacingExerciseId
    const exerciseId = await resolveExerciseId(option)
    if (!exerciseId) return
    await supabase.from('workout_exercises').update({ exercise_id: exerciseId }).eq('id', weid)
    const { data: exRow } = await supabase.from('exercises').select('id, name, image_url, source').eq('id', exerciseId).single()
    setExercises(prev => prev.map(ex => ex.id === weid ? { ...ex, exercise_id: exerciseId, exercises: exRow as any } : ex))
    setReplacingExerciseId(null)
  }

  async function removeExercise(weid: string) {
    const ex = exercises.find(e => e.id === weid)
    if (ex?.superset_group) {
      await dissolveSuperset(supabase, ex.superset_group)
      setExercises(p => p.map(e => e.superset_group === ex.superset_group ? { ...e, superset_group: null } : e))
    }
    await supabase.from('workout_exercises').delete().eq('id', weid)
    setSets(p => p.filter(s => s.workout_exercise_id !== weid))
    setExercises(p => p.filter(e => e.id !== weid))
  }

  async function handleSupersetPair(targetId: string) {
    if (!supersetPickingFor) return
    const groupId = await pairSuperset(supabase, supersetPickingFor, targetId)
    setExercises(p => p.map(ex => ex.id === supersetPickingFor || ex.id === targetId ? { ...ex, superset_group: groupId } : ex))
    setSupersetPickingFor(null)
  }

  async function handleSupersetDissolve(groupId: string) {
    await dissolveSuperset(supabase, groupId)
    setExercises(p => p.map(ex => ex.superset_group === groupId ? { ...ex, superset_group: null } : ex))
  }

  async function saveTitle() {
    const trimmed = titleDraft.trim(); setEditingTitle(false)
    if (!trimmed || trimmed === title) return
    setTitle(trimmed)
    await supabase.from('workout_sessions').update({ title: trimmed }).eq('id', sessionId)
  }

  function handleNameTouchStart(e: React.TouchEvent, exerciseId: string, index: number) {
    longPressFired.current = false; longPressStart.current = { y: e.touches[0].clientY }
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true; navigator.vibrate?.(40)
      setDragState({ exerciseId, exerciseIndex: index, startY: longPressStart.current.y, currentY: longPressStart.current.y, targetIndex: index })
    }, 500)
  }
  function handleNameTouchMove(e: React.TouchEvent) { if (!longPressFired.current && Math.abs(e.touches[0].clientY - longPressStart.current.y) > 10) clearTimeout(longPressTimer.current!) }
  function handleNameTouchEnd() { if (!longPressFired.current) clearTimeout(longPressTimer.current!) }

  async function finishWorkout() {
    const { error } = await supabase.from('workout_sessions').update({
      status: 'completed', finished_at: new Date().toISOString(),
      duration_seconds: elapsed, total_volume_kg: totalVolume, total_sets: totalSets,
    }).eq('id', sessionId)
    if (error) { console.error('finishWorkout error:', error); return }
    try { localStorage.removeItem(`ptone_completed_${sessionId}`) } catch {}
    router.push('/dashboard')
  }

  async function deleteWorkout() {
    await supabase.from('workout_sessions').delete().eq('id', sessionId)
    try { localStorage.removeItem(`ptone_completed_${sessionId}`) } catch {}
    router.push('/dashboard')
  }

  function renderExBlock(ex: WorkoutExercise, index: number) {
    const name       = ex.exercises?.name ?? '…'
    const imageUrl   = ex.exercises?.image_url ?? ''
    const exSets     = sets.filter(s => s.workout_exercise_id === ex.id)
    const isDragging = dragState?.exerciseId === ex.id
    const isMenuOpen = menuOpenId === ex.id
    const isInSS     = !!ex.superset_group
    const isPairingTarget = !!supersetPickingFor && supersetPickingFor !== ex.id && !isInSS
    const canPair    = !isInSS && exercises.filter(e => !e.superset_group && e.id !== ex.id).length > 0

    return (
      <div key={ex.id}
        ref={el => { if (el) exerciseRefs.current.set(ex.id, el); else exerciseRefs.current.delete(ex.id) }}
        style={{ opacity: isDragging ? 0.4 : 1, transition: 'opacity 0.15s' }}>

        {/* Exercise header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            <div onClick={() => isPairingTarget && handleSupersetPair(ex.id)}
              style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: isPairingTarget ? 'rgba(124,106,255,0.3)' : 'rgba(124,106,255,0.15)', border: isPairingTarget ? '2px solid var(--accent)' : '1px solid rgba(124,106,255,0.3)', cursor: isPairingTarget ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isPairingTarget ? <span style={{ color: 'var(--accent)', fontSize: 18, fontWeight: 700 }}>+</span>
                : imageUrl ? <img src={imageUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 16 }}>💪</span>}
            </div>
            <button
              onClick={() => isPairingTarget ? handleSupersetPair(ex.id) : undefined}
              onTouchStart={e => !supersetPickingFor && handleNameTouchStart(e, ex.id, index)}
              onTouchMove={handleNameTouchMove} onTouchEnd={handleNameTouchEnd}
              onContextMenu={e => e.preventDefault()}
              style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', color: 'var(--accent)', fontWeight: 600, fontSize: 15, cursor: isPairingTarget ? 'pointer' : dragState ? 'grabbing' : 'grab', WebkitUserSelect: 'none', userSelect: 'none', opacity: supersetPickingFor && !isPairingTarget && supersetPickingFor !== ex.id ? 0.35 : 1, transition: 'opacity 0.2s', textTransform: 'capitalize' }}>
              {name}
              {isPairingTarget && <span style={{ fontSize: 11, marginLeft: 6, fontWeight: 400, color: 'var(--text-muted)' }}>tap to pair</span>}
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <button onClick={() => !supersetPickingFor && setMenuOpenId(isMenuOpen ? null : ex.id)}
              style={{ background: isMenuOpen ? 'rgba(124,106,255,0.12)' : 'none', border: 'none', borderRadius: 8, color: 'var(--text-muted)', fontSize: 18, padding: '4px 8px', cursor: 'pointer', opacity: supersetPickingFor && supersetPickingFor !== ex.id ? 0.3 : 1 }}>···</button>
            {isMenuOpen && <ExerciseMenu isInSuperset={isInSS} canPair={canPair} onStartPairing={() => setSupersetPickingFor(ex.id)} onDissolve={() => ex.superset_group && handleSupersetDissolve(ex.superset_group)} onRemove={() => removeExercise(ex.id)} onReplace={() => setReplacingExerciseId(ex.id)} onClose={() => setMenuOpenId(null)} />}
          </div>
        </div>

        {/* Note */}
        <div style={{ paddingLeft: 46 }}>
          <NoteInline exerciseId={ex.exercise_id} userId={userId} initialNote={initialNotes[ex.exercise_id] ?? ''} supabase={supabase} />
        </div>

        {/* Sets */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr 1fr 36px', padding: '8px 14px', background: 'var(--bg-tertiary)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {['Set', 'Prev', 'kg', 'Reps', ''].map(h => (
              <span key={h} style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', fontWeight: 500 }}>{h}</span>
            ))}
          </div>
          {exSets.map((s, si) => (
            <SwipeableSetRow key={s.id} s={s} i={si}
              isCompleted={completedSets.has(s.id)} isHighlighted={highlightSetId === s.id}
              prevValue={(() => {
                const prev = previousSets[ex.exercise_id]?.[si]
                if (!prev) return '—'
                if (prev.weight_kg != null && prev.reps != null) return `${prev.weight_kg}×${prev.reps}`
                if (prev.weight_kg != null) return `${prev.weight_kg}kg`
                if (prev.reps != null) return `${prev.reps}`
                return '—'
              })()}
              onComplete={() => handleSetComplete(s.id, ex.id)}
              onUpdate={(f, v) => updateSet(s.id, f, v)}
              onDelete={() => removeSet(s.id, ex.id)}
            />
          ))}
          <button onClick={() => addSet(ex.id)}
            style={{ width: '100%', padding: '9px', background: 'rgba(124,106,255,0.08)', border: 'none', color: 'var(--accent)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Add Set
          </button>
        </div>
      </div>
    )
  }

  if (loading) return (
    <div style={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--border-strong)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  const renderGroups = buildRenderGroups(exercises)
  function getInsertionIndex() {
    if (!dragState) return -1
    const others = exercises.filter(ex => ex.id !== dragState.exerciseId)
    const target  = others[dragState.targetIndex]
    if (!target) return exercises.length
    return exercises.findIndex(ex => ex.id === target.id)
  }
  const insertionLineAt = getInsertionIndex()

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-page)' }}>
      {/* Superset banner */}
      {supersetPickingFor && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 150, background: 'var(--accent)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Tap an exercise to pair as superset</span>
          <button onClick={() => setSupersetPickingFor(null)} style={{ background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: 8, padding: '4px 12px', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
        </div>
      )}

      {/* Header */}
      <div style={{ position: 'sticky', top: supersetPickingFor ? 44 : 0, zIndex: 100, background: 'var(--bg-page)', borderBottom: '1px solid var(--border)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'top 0.2s' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, padding: 4, cursor: 'pointer' }}>↓</button>
        <div style={{ textAlign: 'center', flex: 1 }}>
          {editingTitle
            ? <input autoFocus value={titleDraft} onChange={e => setTitleDraft(e.target.value)} onBlur={saveTitle} onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setTitleDraft(title); setEditingTitle(false) } }}
                style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(124,106,255,0.6)', color: 'var(--text-primary)', fontWeight: 600, fontSize: 15, textAlign: 'center', width: 180, outline: 'none', padding: '2px 4px', fontFamily: 'inherit' }} />
            : <button onClick={() => { setTitleDraft(title); setEditingTitle(true) }}
                style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontWeight: 600, fontSize: 15, cursor: 'text', padding: '4px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 5, margin: '0 auto' }}>
                {title}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.4 }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
          }
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setShowDelete(true)} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: 13, fontWeight: 500, padding: '4px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
          <button onClick={finishWorkout} style={{ background: 'var(--accent)', border: 'none', borderRadius: 99, color: '#fff', fontSize: 13, fontWeight: 600, padding: '6px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>Finish</button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        {[{ label: 'Duration', value: formatTime(elapsed) }, { label: 'Volume', value: `${totalVolume.toFixed(0)} kg` }, { label: 'Sets', value: String(totalSets) }].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Exercise list */}
      <div style={{ padding: '16px 16px 120px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {exercises.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40, fontSize: 14 }}>No exercises yet — add one below</div>
        )}
        {renderGroups.map(group => {
          if (group.type === 'single') {
            const isDragging = dragState?.exerciseId === group.ex.id
            return (
              <div key={group.ex.id}>
                {dragState && !isDragging && insertionLineAt === group.index && (
                  <div style={{ height: 2, borderRadius: 2, background: 'var(--accent)', boxShadow: '0 0 6px rgba(124,106,255,0.6)', marginBottom: 8 }} />
                )}
                {renderExBlock(group.ex, group.index)}
              </div>
            )
          }
          return (
            <div key={group.groupId} style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 3, borderRadius: 3, background: 'linear-gradient(to bottom, var(--accent), rgba(124,106,255,0.2))', flexShrink: 0, marginTop: 6 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
                <div style={{ marginBottom: -12 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--accent)', background: 'rgba(124,106,255,0.12)', border: '1px solid rgba(124,106,255,0.3)', borderRadius: 99, padding: '2px 8px' }}>SUPERSET</span>
                </div>
                {renderExBlock(group.exA, group.indexA)}
                {renderExBlock(group.exB, group.indexB)}
              </div>
            </div>
          )
        })}
        {dragState && insertionLineAt === exercises.length && (
          <div style={{ height: 2, borderRadius: 2, background: 'var(--accent)', boxShadow: '0 0 6px rgba(124,106,255,0.6)' }} />
        )}
        <button onClick={() => setShowAddExercise(true)}
          style={{ width: '100%', padding: 14, background: 'rgba(124,106,255,0.1)', border: '1px solid rgba(124,106,255,0.3)', borderRadius: 14, color: 'var(--accent)', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          + Add Exercise
        </button>
      </div>

      {/* Delete confirm */}
      {showDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 320, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center' }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>Delete workout?</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>This session will be permanently deleted.</p>
            <button onClick={deleteWorkout} style={{ width: '100%', padding: 13, background: 'var(--danger)', border: 'none', borderRadius: 99, color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
            <button onClick={() => setShowDelete(false)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          </div>
        </div>
      )}

      {showAddExercise && <AddExerciseModal onAdd={addExercise} onClose={() => setShowAddExercise(false)} />}
      {replacingExerciseId && <AddExerciseModal onAdd={replaceExercise} onClose={() => setReplacingExerciseId(null)} />}
    </div>
  )
}
