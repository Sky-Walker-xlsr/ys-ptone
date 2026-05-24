'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface WorkoutSession {
  id: string
  title: string
  status: string
  source: string
  started_at: string
  finished_at: string | null
  duration_seconds: number | null
  total_volume_kg: number | null
  total_sets: number | null
  plan_id: string | null
}

interface WorkoutExercise {
  id: string
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

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function LogbookDetailClient({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const supabase = createClient()

  const [session, setSession] = useState<WorkoutSession | null>(null)
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [sets, setSets] = useState<WorkoutSet[]>([])
  const [loading, setLoading] = useState(true)
  const [repeating, setRepeating] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    async function load() {
      const [sessionRes, exRes, setRes] = await Promise.all([
        supabase.from('workout_sessions').select('*').eq('id', sessionId).single(),
        supabase.from('workout_exercises')
          .select('*, exercises(id, name, image_url, source)')
          .eq('workout_session_id', sessionId)
          .order('position'),
        supabase.from('sets')
          .select('*')
          .eq('workout_session_id', sessionId)
          .order('set_number'),
      ])

      if (!sessionRes.data || sessionRes.data.status !== 'completed') {
        router.replace('/dashboard')
        return
      }

      setSession(sessionRes.data)
      setExercises((exRes.data ?? []) as WorkoutExercise[])
      setSets((setRes.data ?? []) as WorkoutSet[])
      setLoading(false)
    }
    load()
  }, [sessionId])

  async function doAgain() {
    if (!session) return
    setRepeating(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setRepeating(false); return }

    const { data: newSession } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: user.id,
        title: session.title,
        status: 'active',
        source: session.source,
        plan_id: session.plan_id,
      })
      .select('id')
      .single()

    if (!newSession) { setRepeating(false); return }

    for (const ex of exercises) {
      const { data: newEx } = await supabase
        .from('workout_exercises')
        .insert({
          workout_session_id: newSession.id,
          exercise_id: ex.exercise_id,
          position: ex.position,
          superset_group: ex.superset_group,
        })
        .select('id')
        .single()
      if (!newEx) continue

      const exSets = sets.filter(s => s.workout_exercise_id === ex.id)
      const setsToInsert = exSets.length > 0
        ? exSets.map((s, i) => ({
            workout_session_id: newSession.id,
            workout_exercise_id: newEx.id,
            set_number: i + 1,
            weight_kg: s.weight_kg,
            reps: s.reps,
            is_completed: false,
          }))
        : [1, 2, 3].map(n => ({
            workout_session_id: newSession.id,
            workout_exercise_id: newEx.id,
            set_number: n,
            is_completed: false,
          }))

      await supabase.from('sets').insert(setsToInsert)
    }

    router.push(`/workout?session=${newSession.id}`)
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    await supabase.from('sets').delete().eq('workout_session_id', sessionId)
    await supabase.from('workout_exercises').delete().eq('workout_session_id', sessionId)
    await supabase.from('workout_sessions').delete().eq('id', sessionId)
    router.replace('/dashboard')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--border-strong)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!session) return null

  const completedSets = sets.filter(s => s.is_completed)

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-page)', paddingBottom: 100 }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 20, background: 'var(--bg-page)',
        borderBottom: '1px solid var(--border)', padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer' }}
        >←</button>
        <span style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)' }}>{session.title}</span>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setMenuOpen(o => !o); setConfirmDelete(false) }}
            style={{
              background: menuOpen ? 'rgba(124,106,255,0.12)' : 'none', border: 'none',
              borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <circle cx="10" cy="4" r="1.6" /><circle cx="10" cy="10" r="1.6" /><circle cx="10" cy="16" r="1.6" />
            </svg>
          </button>
          {menuOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 98 }} onClick={() => { setMenuOpen(false); setConfirmDelete(false) }} />
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 200,
                background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
                borderRadius: 14, padding: 6, zIndex: 99, boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
              }}>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px', borderRadius: 8, border: 'none',
                    background: confirmDelete ? 'rgba(255,69,58,0.12)' : 'transparent',
                    cursor: deleting ? 'not-allowed' : 'pointer', fontSize: 14,
                    color: 'var(--danger)', textAlign: 'left', fontFamily: 'inherit',
                  }}
                >
                  {deleting ? 'Deleting…' : confirmDelete ? 'Confirm delete?' : 'Delete workout'}
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Summary card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
            {formatDate(session.finished_at ?? session.started_at)}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Duration', value: formatDuration(session.duration_seconds ?? 0) },
              { label: 'Volume', value: `${Math.round((session.total_volume_kg ?? 0) * 10) / 10} kg` },
              { label: 'Sets', value: session.total_sets ?? completedSets.length },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--accent)' }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Exercises */}
        {exercises.map(ex => {
          const exSets = sets.filter(s => s.workout_exercise_id === ex.id)
          const name = ex.exercises?.name ?? 'Exercise'
          const imageUrl = ex.exercises?.image_url ?? null

          return (
            <div key={ex.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
              {/* Exercise header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'rgba(124,106,255,0.15)', border: '1px solid rgba(124,106,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {imageUrl
                    ? <img src={imageUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 16 }}>💪</span>
                  }
                </div>
                <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{name}</span>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
                  {exSets.filter(s => s.is_completed).length}/{exSets.length} sets
                </span>
              </div>

              {/* Sets header */}
              <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr', padding: '7px 14px', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)' }}>
                {['Set', 'kg', 'Reps'].map(h => (
                  <span key={h} style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', fontWeight: 500 }}>{h}</span>
                ))}
              </div>

              {/* Sets */}
              {exSets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '14px', fontSize: 13, color: 'var(--text-muted)' }}>No sets recorded</div>
              ) : exSets.map(s => (
                <div
                  key={s.id}
                  style={{
                    display: 'grid', gridTemplateColumns: '32px 1fr 1fr',
                    padding: '10px 14px', borderBottom: '1px solid var(--border)', alignItems: 'center',
                    background: s.is_completed ? 'rgba(62,207,142,0.06)' : 'transparent',
                    opacity: s.is_completed ? 1 : 0.5,
                  }}
                >
                  <span style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{s.set_number}</span>
                  <span style={{ textAlign: 'center', fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>{s.weight_kg ?? '—'}</span>
                  <span style={{ textAlign: 'center', fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>{s.reps ?? '—'}</span>
                </div>
              ))}
            </div>
          )
        })}

        {/* Do Again button */}
        <button
          onClick={doAgain}
          disabled={repeating}
          style={{
            width: '100%', padding: 14, background: 'rgba(124,106,255,0.1)', border: '1px solid rgba(124,106,255,0.3)',
            borderRadius: 14, color: 'var(--accent)', fontSize: 15, fontWeight: 600,
            cursor: repeating ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          }}
        >
          {repeating ? 'Starting…' : 'Do Again'}
        </button>
      </div>
    </div>
  )
}
