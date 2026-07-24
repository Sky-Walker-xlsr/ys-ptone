'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/Sidebar'
import AddExerciseModal, { type EDBExercise } from '@/components/exercise/AddExerciseModal'
import { pairSuperset, dissolveSuperset } from '@/lib/supabase/sessions'
import { useTranslation } from '@/locales'
import ExerciseVideoManager from '@/components/exercise/ExerciseVideoManager'
import { getExerciseFields, getFieldHeader, getFieldInputMode, getBodyweightModifier, type ExerciseField } from '@/lib/exerciseType'
import { getExercisesByIds } from '@/lib/exercisedb'

interface PlanSet {
  id?: string
  set_number: number
  weight_kg?: number | null
  reps?: number | null
  duration_seconds?: number | null
  distance_km?: number | null
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
  edbData?: { name: string; imageUrl: string | null; exercise_type_name?: string | null; exercise_type_fields?: string[] | null; targetMuscles: string[] }
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

function ExerciseMenu({ isInSuperset, canPair, onStartPairing, onDissolve, onReplace, onRemove, onVideos, onClose }: {
  isInSuperset: boolean; canPair: boolean
  onStartPairing: () => void; onDissolve: () => void; onReplace: () => void; onRemove: () => void
  onVideos: () => void; onClose: () => void
}) {
  const { lang } = useTranslation()
  const de = lang === 'de'
  const item = (danger = false, disabled = false): React.CSSProperties => ({ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: 'none', background: 'transparent', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 13, textAlign: 'left', color: disabled ? 'var(--text-subtle)' : danger ? 'var(--danger)' : 'var(--text-primary)', opacity: disabled ? 0.4 : 1, fontFamily: 'inherit' })
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={onClose} />
      <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, minWidth: 200, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 6, zIndex: 99, boxShadow: '0 12px 32px rgba(0,0,0,0.3)' }}>
        <button onClick={() => { onVideos(); onClose() }} style={item()}>📹 {de ? 'Videos verwalten' : 'Manage videos'}</button>
        <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
        {isInSuperset
          ? <button onClick={() => { onDissolve(); onClose() }} style={{ ...item(), color: 'var(--warning)' }}>{de ? 'Superset auflösen' : 'Dissolve Superset'}</button>
          : <button onClick={() => { if (canPair) { onStartPairing(); onClose() } }} disabled={!canPair} style={item(false, !canPair)}>{de ? 'Zu Superset hinzufügen' : 'Add to Superset'}</button>
        }
        <button onClick={() => { onReplace(); onClose() }} style={item()}>{de ? 'Übung ersetzen' : 'Replace Exercise'}</button>
        <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
        <button onClick={() => { onRemove(); onClose() }} style={item(true)}>{de ? 'Übung entfernen' : 'Remove Exercise'}</button>
      </div>
    </>
  )
}

export default function ClientPlanEditPage() {
  const router   = useRouter()
  const params   = useParams<{ id: string; planId: string }>()
  const clientId = params.id
  const planId   = params.planId
  const supabase = useMemo(() => createClient(), [])

  const [title,              setTitle]              = useState('')
  const [description,        setDescription]        = useState('')
  const [exercises,          setExercises]          = useState<PlanExercise[]>([])
  const [loading,            setLoading]            = useState(true)
  const [saving,             setSaving]             = useState(false)
  const [showAddExercise,    setShowAddExercise]    = useState(false)
  const [supersetPickingFor, setSupersetPickingFor] = useState<string | null>(null)
  const [menuOpenId,         setMenuOpenId]         = useState<string | null>(null)
  const [replacingId,        setReplacingId]        = useState<string | null>(null)
  const [clientName,         setClientName]         = useState('')
  const [videoManagerEx,     setVideoManagerEx]     = useState<PlanExercise | null>(null)
  const [ptId,               setPtId]               = useState('')

  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => { if (session) setPtId(session.user.id) })
  }, [])

  useEffect(() => {
    async function load() {
      const [planRes, profileRes] = await Promise.all([
        supabase.from('plans').select('id, title, description').eq('id', planId).single(),
        supabase.from('profiles').select('first_name, last_name, display_name').eq('id', clientId).single(),
      ])
      if (!planRes.data) { router.replace(`/clients/${clientId}`); return }
      setTitle(planRes.data.title)
      setDescription(planRes.data.description ?? '')
      const p = profileRes.data
      setClientName(p ? (p.display_name || `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()) : '')

      const { data: exs } = await supabase
        .from('plan_exercises')
        .select('*, exercises(id, external_id, name, source), plan_sets(*)')
        .eq('plan_id', planId).order('position')

      const mapped = (exs ?? []).map((ex: any) => ({
        ...ex,
        plan_sets: ex.plan_sets?.length
          ? [...ex.plan_sets].sort((a: any, b: any) => a.set_number - b.set_number)
          : [{ set_number: 1, weight_kg: null, reps: null, isNew: true }],
      }))

      // Enrich with ExerciseDB type fields
      const extIds = mapped.map((ex: any) => ex.exercises?.external_id).filter(Boolean) as string[]
      if (extIds.length > 0) {
        const edbRows = await getExercisesByIds(extIds)
        const byId = Object.fromEntries(edbRows.map(r => [r.id, r]))
        setExercises(mapped.map((ex: any) => {
          const edb = byId[ex.exercises?.external_id ?? '']
          if (!edb) return ex
          return {
            ...ex,
            edbData: {
              ...(ex.edbData ?? {}),
              name: edb.name ?? ex.edbData?.name,
              imageUrl: ex.edbData?.imageUrl || edb.image_url || null,
              exercise_type_name:   edb.exercise_type_name,
              exercise_type_fields: edb.exercise_type_fields,
              targetMuscles: edb.primary_muscles ?? [],
            },
          }
        }))
      } else {
        setExercises(mapped)
      }
      setLoading(false)
    }
    load()
  }, [planId, clientId])

  function updateSet(exId: string, si: number, field: string, value: string) {
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
      const fields = getExerciseFields(ex.exercises ?? {}); const vals: Partial<PlanSet> = {}; for (const f of fields) (vals as any)[f] = (ls as any)?.[f] ?? null
      return { ...ex, plan_sets: [...s, { set_number: s.length + 1, ...vals, isNew: true }] }
    }))
  }
  function removeSet(exId: string, si: number) {
    setExercises(p => p.map(ex => {
      if (ex.id !== exId) return ex
      const s = (ex.plan_sets ?? []).filter((_, i) => i !== si).map((x, i) => ({ ...x, set_number: i + 1 }))
      return { ...ex, plan_sets: s }
    }))
  }

  async function resolveExerciseId(edbExercise: EDBExercise): Promise<string | undefined> {
    if (edbExercise.source === 'custom') return edbExercise.exerciseId
    const { data: existing } = await supabase.from('exercises').select('id').eq('external_id', edbExercise.exerciseId).eq('source', 'exercisedb').maybeSingle()
    if (existing?.id) return existing.id
    const { data: created } = await supabase.from('exercises').insert({ external_id: edbExercise.exerciseId, source: 'exercisedb', name: edbExercise.name }).select('id').single()
    return created?.id
  }

  async function addExercise(edbExercise: EDBExercise) {
    const exerciseId = await resolveExerciseId(edbExercise)
    if (!exerciseId) return
    const { data: pe } = await supabase.from('plan_exercises')
      .insert({ plan_id: planId, exercise_id: exerciseId, position: exercises.length, default_sets: 3 })
      .select('*, exercises(id, external_id, name, source)').single()
    if (pe) {
      const rawF = edbExercise.exercise_type_fields
      const parsedF = Array.isArray(rawF) ? rawF as string[]
        : typeof rawF === 'string' ? (() => { try { const p = JSON.parse(rawF); return Array.isArray(p) ? p : null } catch { return null } })()
        : null
      const blankSet = (n: number): PlanSet => { const s: PlanSet = { set_number: n, isNew: true }; for (const f of (parsedF ?? ['weight_kg','reps'])) (s as any)[f]=null; return s }
      setExercises(prev => [...prev, {
        ...pe,
        plan_sets: [blankSet(1), blankSet(2), blankSet(3)],
        edbData: { name: edbExercise.name, imageUrl: edbExercise.imageUrl, exercise_type_name: edbExercise.exercise_type_name ?? null, exercise_type_fields: parsedF, targetMuscles: edbExercise.targetMuscles },
      }])
      setShowAddExercise(false)
    }
  }

  async function replaceExercise(edbExercise: EDBExercise) {
    if (!replacingId) return
    const exerciseId = await resolveExerciseId(edbExercise)
    if (!exerciseId) return
    await supabase.from('plan_exercises').update({ exercise_id: exerciseId }).eq('id', replacingId)
    setExercises(prev => prev.map(ex => ex.id === replacingId
      ? { ...ex, exercise_id: exerciseId, edbData: { name: edbExercise.name, imageUrl: edbExercise.imageUrl, targetMuscles: edbExercise.targetMuscles }, exercises: undefined }
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
      if (sets.length > 0) {
        const exFields = getExerciseFields(ex.exercises ?? {}); await supabase.from('plan_sets').insert(sets.map(s => { const row: Record<string,unknown> = { plan_exercise_id: ex.id, set_number: s.set_number }; for (const f of exFields) row[f] = (s as any)[f] ?? null; return row }))
      }
    }))
    setSaving(false)
    router.push(`/clients/${clientId}`)
  }

  const renderGroups = buildRenderGroups(exercises)

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
            <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', background: isPairingTarget ? 'rgba(124,106,255,0.3)' : 'rgba(124,106,255,0.15)', border: isPairingTarget ? '2px solid rgba(124,106,255,0.7)' : '1px solid rgba(124,106,255,0.3)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isPairingTarget ? 'pointer' : 'default', transition: 'all 0.2s' }}>
              {isPairingTarget ? <span style={{ color: 'var(--accent)', fontSize: 18, fontWeight: 700 }}>+</span>
                : ex.edbData?.imageUrl ? <img src={ex.edbData.imageUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 16 }}>💪</span>}
            </div>
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--accent)', cursor: isPairingTarget ? 'pointer' : 'default', opacity: supersetPickingFor && !isPairingTarget && supersetPickingFor !== ex.id ? 0.35 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
              {name}
              {isPairingTarget && <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>click to pair</span>}
              {(()=>{const m=getBodyweightModifier({exercise_type_name:ex.edbData?.exercise_type_name,name:ex.edbData?.name??ex.exercises?.name});if(!m)return null;const isW=m==='weighted';return(<span style={{fontSize:'10px',fontWeight:700,color:isW?'var(--success)':'var(--danger)',background:isW?'rgba(62,207,142,0.15)':'rgba(240,68,68,0.15)',border:`1px solid ${isW?'rgba(62,207,142,0.35)':'rgba(240,68,68,0.35)'}`,borderRadius:4,padding:'1px 5px',flexShrink:0}}>{isW?'+W':'-W'}</span>)})()}
            </span>
          </div>
          <div style={{ position: 'relative' }}>
            <button onClick={() => !supersetPickingFor && setMenuOpenId(isMenuOpen ? null : ex.id)} style={{ background: isMenuOpen ? 'var(--bg-tertiary)' : 'none', border: 'none', borderRadius: 6, color: 'var(--text-muted)', fontSize: 18, padding: '4px 8px', cursor: 'pointer', opacity: supersetPickingFor && supersetPickingFor !== ex.id ? 0.3 : 1 }}>···</button>
            {isMenuOpen && <ExerciseMenu isInSuperset={isInSS} canPair={canPair} onStartPairing={() => setSupersetPickingFor(ex.id)} onDissolve={() => ex.superset_group && handleSupersetDissolve(ex.superset_group)} onReplace={() => setReplacingId(ex.id)} onRemove={() => removeExercise(ex.id)} onVideos={() => setVideoManagerEx(ex)} onClose={() => setMenuOpenId(null)} />}
          </div>
        </div>
        {(()=>{
          const exFields = getExerciseFields({}, { exercise_type_fields: ex.edbData?.exercise_type_fields })
          const modifier = getBodyweightModifier({ exercise_type_name: ex.edbData?.exercise_type_name, name: ex.edbData?.name ?? ex.exercises?.name })
          const colH = (f: ExerciseField) => f==='weight_kg'&&modifier==='weighted'?'+kg':f==='weight_kg'&&modifier==='assisted'?'-kg':getFieldHeader(f)
          return (
        <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `32px ${exFields.map(()=>'1fr').join(' ')} 32px`, padding: '7px 12px', borderBottom: '1px solid var(--border)' }}>
            {['Set', ...exFields.map(colH), ''].map((h,i) => <span key={i} style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', fontWeight: 500 }}>{h}</span>)}
          </div>
          {(ex.plan_sets ?? []).map((s, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: `32px ${exFields.map(()=>'1fr').join(' ')} 32px`, padding: '9px 12px', background: i % 2 === 1 ? 'var(--bg-card)' : 'transparent', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
              <span style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, fontWeight: 600 }}>{s.set_number}</span>
              {exFields.map(f => (
                <input key={f} type="number" inputMode={getFieldInputMode(f)} placeholder="—"
                  value={(s as any)[f] ?? ''} onFocus={e => e.target.select()}
                  onChange={e => updateSet(ex.id, i, f, e.target.value)}
                  style={{ textAlign: 'center', width: '100%', fontSize: 14, fontWeight: 500, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontFamily: 'inherit' }} />
              ))}
              <button onClick={() => removeSet(ex.id, i)} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: 16, textAlign: 'center', padding: 0, cursor: 'pointer' }}>×</button>
            </div>
          ))}
          <button onClick={() => addSet(ex.id)} style={{ width: '100%', padding: '8px', background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>+ Add Set</button>
        </div>
        )})()}
      </div>
    )
  }

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

      {supersetPickingFor && (
        <div style={{ position: 'fixed', top: 0, left: 'var(--sidebar-width)', right: 0, zIndex: 150, background: 'var(--accent)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Click an exercise to create a superset</span>
          <button onClick={() => setSupersetPickingFor(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, padding: '4px 12px', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
        </div>
      )}

      <main style={{ flex: 1, marginLeft: 'var(--sidebar-width)', padding: '28px 40px', minHeight: '100vh', transition: 'margin-left 0.2s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => router.push(`/clients/${clientId}`)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 500, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0, fontFamily: 'inherit' }}>
              ← {clientName || 'Client'}
            </button>
            {clientName && <><span style={{ color: 'var(--border-strong)' }}>·</span><span style={{ fontSize: 13, color: 'var(--text-subtle)' }}>Plans</span></>}
          </div>
          <button onClick={handleSave} disabled={saving || !title.trim()} style={{ padding: '9px 20px', background: title.trim() ? 'var(--accent)' : 'var(--bg-tertiary)', color: title.trim() ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: title.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Plan title" style={{ fontSize: 18, fontWeight: 700, width: '100%', background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontFamily: 'inherit' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" style={{ fontSize: 14, width: '100%', background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontFamily: 'inherit' }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
          {renderGroups.map(group => {
            if (group.type === 'single') return (
              <div key={group.ex.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px' }}>
                {renderExBlock(group.ex)}
              </div>
            )
            return (
              <div key={group.groupId} style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 3, borderRadius: 3, background: 'linear-gradient(to bottom, var(--accent), rgba(124,106,255,0.2))', flexShrink: 0, marginTop: 6 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--accent)', background: 'rgba(124,106,255,0.1)', border: '1px solid rgba(124,106,255,0.25)', borderRadius: 20, padding: '2px 8px', alignSelf: 'flex-start' }}>SUPERSET</span>
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px' }}>{renderExBlock(group.exA)}</div>
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px' }}>{renderExBlock(group.exB)}</div>
                </div>
              </div>
            )
          })}
        </div>

        <button onClick={() => setShowAddExercise(true)} style={{ width: '100%', padding: '14px', background: 'rgba(124,106,255,0.08)', border: '1px dashed rgba(124,106,255,0.35)', borderRadius: 14, color: 'var(--accent)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          + Add Exercise
        </button>
      </main>

      {showAddExercise && <AddExerciseModal onAdd={addExercise}     onClose={() => setShowAddExercise(false)} />}
      {replacingId      && <AddExerciseModal onAdd={replaceExercise} onClose={() => setReplacingId(null)}     />}
      {videoManagerEx && ptId && (
        <ExerciseVideoManager
          exerciseId={videoManagerEx.exercise_id}
          exerciseName={videoManagerEx.edbData?.name ?? videoManagerEx.exercises?.name ?? 'Exercise'}
          ptId={ptId}
          onClose={() => setVideoManagerEx(null)}
        />
      )}
    </div>
  )
}
