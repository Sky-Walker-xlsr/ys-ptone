'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/Sidebar'

interface WorkoutSession {
  id: string
  title: string
  started_at: string
  finished_at: string | null
  duration_seconds: number | null
  total_volume_kg: number | null
  total_sets: number | null
  source: string
}

interface WorkoutExercise {
  id: string
  position: number
  name: string
  image_url: string | null
}

interface WorkoutSet {
  id: string
  workout_exercise_id: string
  set_number: number
  weight_kg: number | null
  reps: number | null
  is_completed: boolean
}

interface ClientProfile {
  first_name: string | null
  last_name: string | null
  display_name: string | null
  email: string
}

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function formatDateLong(d: string) {
  return new Date(d).toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function getDisplayName(p: ClientProfile | null) {
  if (!p) return '—'
  return p.display_name || `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.email
}

export default function PTLogbookDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string; sessionId: string }>()
  const clientId = params.id
  const sessionId = params.sessionId
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<WorkoutSession | null>(null)
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [sets, setSets] = useState<WorkoutSet[]>([])
  const [client, setClient] = useState<ClientProfile | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      if (!authSession) { router.replace('/login'); return }

      const { data: tc } = await supabase.from('trainer_clients')
        .select('id').eq('trainer_id', authSession.user.id).eq('client_id', clientId).eq('status', 'active').maybeSingle()
      if (!tc) { router.replace('/clients'); return }

      const [sessionRes, profileRes, exRes, setRes] = await Promise.all([
        supabase.from('workout_sessions')
          .select('id, title, started_at, finished_at, duration_seconds, total_volume_kg, total_sets, source')
          .eq('id', sessionId).eq('user_id', clientId).single(),
        supabase.from('profiles')
          .select('first_name, last_name, display_name, email').eq('id', clientId).single(),
        supabase.from('workout_exercises')
          .select('id, position, exercises(name, image_url)')
          .eq('workout_session_id', sessionId).order('position'),
        supabase.from('sets')
          .select('id, workout_exercise_id, set_number, weight_kg, reps, is_completed')
          .eq('workout_session_id', sessionId).order('set_number'),
      ])

      if (!sessionRes.data || sessionRes.data.source === undefined) {
        router.replace(`/clients/${clientId}`)
        return
      }

      setSession(sessionRes.data as WorkoutSession)
      setClient(profileRes.data as ClientProfile)
      setExercises((exRes.data ?? []).map((e: any) => ({
        id: e.id, position: e.position,
        name: e.exercises?.name ?? 'Exercise',
        image_url: e.exercises?.image_url ?? null,
      })))
      setSets((setRes.data ?? []) as WorkoutSet[])
      setLoading(false)
    }
    load()
  }, [sessionId, clientId])

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border-strong)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!session) return null

  const completedSets = sets.filter(s => s.is_completed)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Sidebar />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <main style={{ flex: 1, marginLeft: 'var(--sidebar-width)', minHeight: '100vh', transition: 'margin-left 0.2s ease' }}>
        {/* Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'var(--bg-page)', borderBottom: '1px solid var(--border)', padding: '16px 40px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => router.push(`/clients/${clientId}`)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0, fontFamily: 'inherit', flexShrink: 0 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            {getDisplayName(client)}
          </button>
          <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{session.title}</h1>
        </div>

        <div style={{ padding: '32px 40px', maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Summary card */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              {formatDateLong(session.finished_at ?? session.started_at)}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                { label: 'Duration', value: formatDuration(session.duration_seconds ?? 0) },
                { label: 'Volume', value: `${Math.round((session.total_volume_kg ?? 0) * 10) / 10} kg` },
                { label: 'Sets', value: session.total_sets ?? completedSets.length },
              ].map(stat => (
                <div key={stat.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 22, color: 'var(--accent)' }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Exercises */}
          {exercises.length === 0 ? (
            <div style={{ background: 'var(--bg-card)', border: '1px dashed var(--border-strong)', borderRadius: 14, padding: '40px', textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No exercises recorded for this session.</p>
            </div>
          ) : exercises.map(ex => {
            const exSets = sets.filter(s => s.workout_exercise_id === ex.id)
            return (
              <div key={ex.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                {/* Exercise header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'rgba(124,106,255,0.15)', border: '1px solid rgba(124,106,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {ex.image_url
                      ? <img src={ex.image_url} alt={ex.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 18 }}>💪</span>}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{ex.name}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
                    {exSets.filter(s => s.is_completed).length}/{exSets.length} sets
                  </span>
                </div>

                {/* Sets header */}
                <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr', padding: '8px 16px', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)' }}>
                  {['Set', 'kg', 'Reps'].map(h => (
                    <span key={h} style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', fontWeight: 500 }}>{h}</span>
                  ))}
                </div>

                {/* Sets rows */}
                {exSets.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px', fontSize: 13, color: 'var(--text-muted)' }}>No sets recorded</div>
                ) : exSets.map(s => (
                  <div
                    key={s.id}
                    style={{
                      display: 'grid', gridTemplateColumns: '40px 1fr 1fr',
                      padding: '10px 16px', borderBottom: '1px solid var(--border)', alignItems: 'center',
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
        </div>
      </main>
    </div>
  )
}
