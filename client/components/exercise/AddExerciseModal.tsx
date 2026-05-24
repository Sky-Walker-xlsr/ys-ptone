'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import CreateExerciseModal from './CreateExerciseModal'

export interface ExerciseOption {
  exerciseId: string
  name: string
  imageUrl: string
  imageUrl2?: string
  targetMuscles: string[]
  equipments: string[]
  source?: string
}

interface Props {
  onAdd: (exercise: ExerciseOption) => void
  onClose: () => void
}

function ExercisePreviewSheet({ ex, onClose, onAdd }: { ex: ExerciseOption; onClose: () => void; onAdd: (e: ExerciseOption) => void }) {
  const [showImg2, setShowImg2] = useState(false)
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'var(--bg-page)', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.2s ease' }}>
      <style>{`@keyframes slideUp { from { transform: translateY(40px); opacity:0 } to { transform:translateY(0); opacity:1 } }`}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 500, fontSize: 15, cursor: 'pointer' }}>← Back</button>
        <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>{ex.name}</span>
        <button onClick={() => { onAdd(ex); onClose() }} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Add</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {ex.imageUrl && (
          <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', background: 'var(--bg-card)' }}>
            <img src={showImg2 && ex.imageUrl2 ? ex.imageUrl2 : ex.imageUrl} alt={ex.name} style={{ width: '100%', height: 'auto', display: 'block' }} />
            {ex.imageUrl2 && (
              <button onClick={() => setShowImg2(p => !p)} style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20, padding: '4px 12px', fontSize: 11, color: 'rgba(255,255,255,0.85)', cursor: 'pointer' }}>
                {showImg2 ? '← Img 1' : 'Img 2 →'}
              </button>
            )}
          </div>
        )}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, textTransform: 'capitalize', color: 'var(--text-primary)' }}>{ex.name}</h2>
          {ex.targetMuscles.length > 0 && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Muscle: <span style={{ color: 'var(--accent)', fontWeight: 500, textTransform: 'capitalize' }}>{ex.targetMuscles.join(', ')}</span></div>}
          {ex.equipments.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ex.equipments.map(eq => (
                <span key={eq} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: 'rgba(124,106,255,0.1)', border: '1px solid rgba(124,106,255,0.25)', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{eq}</span>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => { onAdd(ex); onClose() }} style={{ width: '100%', padding: '13px', background: 'var(--accent)', border: 'none', borderRadius: 99, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
          Add Exercise
        </button>
      </div>
    </div>
  )
}

export default function AddExerciseModal({ onAdd, onClose }: Props) {
  const [exercises,           setExercises]           = useState<ExerciseOption[]>([])
  const [customExercises,     setCustomExercises]     = useState<ExerciseOption[]>([])
  const [searchQuery,         setSearchQuery]         = useState('')
  const [searchResults,       setSearchResults]       = useState<ExerciseOption[]>([])
  const [searching,           setSearching]           = useState(false)
  const [loading,             setLoading]             = useState(true)
  const [loadingMore,         setLoadingMore]         = useState(false)
  const [cursor,              setCursor]              = useState<string>('0')
  const [hasMore,             setHasMore]             = useState(true)
  const [bodyParts,           setBodyParts]           = useState<string[]>([])
  const [equipments,          setEquipments]          = useState<string[]>([])
  const [selectedBodyPart,    setSelectedBodyPart]    = useState<string | null>(null)
  const [selectedEquipment,   setSelectedEquipment]   = useState<string | null>(null)
  const [showBodyPartFilter,  setShowBodyPartFilter]  = useState(false)
  const [showEquipmentFilter, setShowEquipmentFilter] = useState(false)
  const [showCreate,          setShowCreate]          = useState(false)
  const [previewEx,           setPreviewEx]           = useState<ExerciseOption | null>(null)

  const listRef       = useRef<HTMLDivElement>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fetchingRef   = useRef(false)

  // Load custom exercises from same supabase
  useEffect(() => {
    const sb = createClient()
    sb.from('exercises')
      .select('id, name, source, muscles!primary_muscle_id(name), equipment!equipment_id(name)')
      .eq('source', 'custom')
      .then(({ data }) => {
        if (!data) return
        setCustomExercises(data.map((e: any) => ({
          exerciseId: e.id,
          name: e.name ?? 'Custom',
          imageUrl: '',
          targetMuscles: e.muscles?.name ? [e.muscles.name] : [],
          equipments: e.equipment?.name ? [e.equipment.name] : [],
          source: 'custom',
        })))
      })
  }, [])

  useEffect(() => {
    fetch('/api/exercises/filters')
      .then(r => r.json())
      .then((d: any) => { setBodyParts(d.bodyParts ?? []); setEquipments(d.equipments ?? []) })
  }, [])

  const loadExercises = useCallback(async (reset = false) => {
    if (!reset && fetchingRef.current) return
    fetchingRef.current = true
    const currentCursor = reset ? '0' : cursor
    if (reset) { setLoading(true); setExercises([]); setCursor('0') } else setLoadingMore(true)

    const params = new URLSearchParams({ cursor: currentCursor })
    if (selectedBodyPart)  params.set('muscle',    selectedBodyPart)
    if (selectedEquipment) params.set('equipment', selectedEquipment)

    try {
      const res  = await fetch(`/api/exercises/list?${params}`)
      const json = await res.json() as any
      setExercises(prev => {
        if (reset) return json.data
        const seen = new Set(prev.map((e: ExerciseOption) => e.exerciseId))
        return [...prev, ...(json.data as ExerciseOption[]).filter(e => !seen.has(e.exerciseId))]
      })
      setHasMore(json.meta.hasNextPage)
      setCursor(json.meta.nextCursor ?? '0')
    } catch {}

    setLoading(false)
    setLoadingMore(false)
    fetchingRef.current = false
  }, [cursor, selectedBodyPart, selectedEquipment])

  useEffect(() => { loadExercises(true) }, [selectedBodyPart, selectedEquipment])

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (!searchQuery.trim()) { setSearchResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/exercises/search?q=${encodeURIComponent(searchQuery)}`)
        setSearchResults(await res.json())
      } catch {}
      setSearching(false)
    }, 350)
  }, [searchQuery])

  const handleScroll = useCallback(() => {
    if (!listRef.current || loadingMore || !hasMore || searchQuery) return
    const { scrollTop, scrollHeight, clientHeight } = listRef.current
    if (scrollHeight - scrollTop - clientHeight < 200) loadExercises(false)
  }, [loadingMore, hasMore, searchQuery, loadExercises])

  function groupByLetter(list: ExerciseOption[]) {
    const sorted = [...list].sort((a, b) => a.name.localeCompare(b.name))
    const groups: { letter: string; items: ExerciseOption[] }[] = []
    let cur = ''
    for (const ex of sorted) {
      const l = (ex.name[0] ?? '#').toUpperCase()
      if (l !== cur) { cur = l; groups.push({ letter: l, items: [] }) }
      groups[groups.length - 1].items.push(ex)
    }
    return groups
  }

  function handleCustomCreated(exercise: { id: string; name: string; source: string }) {
    const newEx: ExerciseOption = { exerciseId: exercise.id, name: exercise.name, imageUrl: '', targetMuscles: [], equipments: [], source: 'custom' }
    setCustomExercises(p => [...p, newEx])
    onAdd(newEx)
  }

  let filteredCustom = customExercises
  if (searchQuery) filteredCustom = filteredCustom.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
  if (selectedBodyPart) filteredCustom = filteredCustom.filter(e => e.targetMuscles.some(m => m.toLowerCase() === selectedBodyPart.toLowerCase()))
  if (selectedEquipment) filteredCustom = filteredCustom.filter(e => e.equipments.some(eq => eq.toLowerCase() === selectedEquipment.toLowerCase()))

  const edbList   = searchQuery ? searchResults : exercises
  const allDisplay = [...filteredCustom, ...edbList.filter(e => e.source !== 'custom')]
  const groups     = groupByLetter(allDisplay)

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', zIndex: 200 }}>
        <div style={{ flex: 1, marginTop: 60, background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          {previewEx && <ExercisePreviewSheet ex={previewEx} onClose={() => setPreviewEx(null)} onAdd={onAdd} />}

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 500, fontSize: 15, cursor: 'pointer' }}>Cancel</button>
            <span style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)' }}>Add Exercise</span>
            <button onClick={() => setShowCreate(true)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 500, fontSize: 15, cursor: 'pointer' }}>Create</button>
          </div>

          {/* Search */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: 99, padding: '10px 14px', gap: 8, alignItems: 'center', border: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>🔍</span>
              <input placeholder="Search exercises…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ fontSize: 14, flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)' }} />
              {searchQuery && <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 16, padding: 0, cursor: 'pointer' }}>✕</button>}
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, padding: '8px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0, position: 'relative' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <button onClick={() => { setShowBodyPartFilter(p => !p); setShowEquipmentFilter(false) }}
                style={{ width: '100%', padding: '8px 12px', background: selectedBodyPart ? 'rgba(124,106,255,0.18)' : 'var(--bg-tertiary)', border: selectedBodyPart ? '1px solid rgba(124,106,255,0.5)' : '1px solid var(--border)', borderRadius: 99, color: selectedBodyPart ? 'var(--accent)' : 'var(--text-muted)', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                💪 {selectedBodyPart ?? 'Muscle'}
                {selectedBodyPart && <span onClick={e => { e.stopPropagation(); setSelectedBodyPart(null) }} style={{ marginLeft: 4, opacity: 0.7 }}>✕</span>}
              </button>
              {showBodyPartFilter && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, maxHeight: 200, overflowY: 'auto', zIndex: 10, marginTop: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                  {bodyParts.map(bp => (
                    <button key={bp} onClick={() => { setSelectedBodyPart(bp); setShowBodyPartFilter(false) }}
                      style={{ width: '100%', padding: '10px 16px', background: selectedBodyPart === bp ? 'rgba(124,106,255,0.18)' : 'none', border: 'none', borderBottom: '1px solid var(--border)', color: selectedBodyPart === bp ? 'var(--accent)' : 'var(--text-primary)', textAlign: 'left', fontSize: 14, textTransform: 'capitalize', cursor: 'pointer' }}>
                      {bp}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ position: 'relative', flex: 1 }}>
              <button onClick={() => { setShowEquipmentFilter(p => !p); setShowBodyPartFilter(false) }}
                style={{ width: '100%', padding: '8px 12px', background: selectedEquipment ? 'rgba(124,106,255,0.18)' : 'var(--bg-tertiary)', border: selectedEquipment ? '1px solid rgba(124,106,255,0.5)' : '1px solid var(--border)', borderRadius: 99, color: selectedEquipment ? 'var(--accent)' : 'var(--text-muted)', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                🏋️ {selectedEquipment ?? 'Equipment'}
                {selectedEquipment && <span onClick={e => { e.stopPropagation(); setSelectedEquipment(null) }} style={{ marginLeft: 4, opacity: 0.7 }}>✕</span>}
              </button>
              {showEquipmentFilter && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, maxHeight: 200, overflowY: 'auto', zIndex: 10, marginTop: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                  {equipments.map(eq => (
                    <button key={eq} onClick={() => { setSelectedEquipment(eq); setShowEquipmentFilter(false) }}
                      style={{ width: '100%', padding: '10px 16px', background: selectedEquipment === eq ? 'rgba(124,106,255,0.18)' : 'none', border: 'none', borderBottom: '1px solid var(--border)', color: selectedEquipment === eq ? 'var(--accent)' : 'var(--text-primary)', textAlign: 'left', fontSize: 14, textTransform: 'capitalize', cursor: 'pointer' }}>
                      {eq}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* List */}
          <div ref={listRef} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto' }}>
            {loading && customExercises.length === 0
              ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading exercises…</div>
              : searching
              ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Searching…</div>
              : groups.length === 0
              ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No exercises found</div>
              : (
                <>
                  {groups.map(group => (
                    <div key={group.letter}>
                      <div style={{ padding: '5px 16px', background: 'rgba(124,106,255,0.07)', borderBottom: '1px solid var(--border)', borderTop: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{group.letter}</span>
                      </div>
                      {group.items.map(ex => (
                        <div key={ex.exerciseId} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                          <button onClick={() => onAdd(ex)}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'none', border: 'none', color: 'var(--text-primary)', textAlign: 'left', cursor: 'pointer', minWidth: 0 }}>
                            {ex.imageUrl
                              ? <img src={ex.imageUrl} alt={ex.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                              : <div style={{ width: 44, height: 44, borderRadius: 8, background: ex.source === 'custom' ? 'rgba(124,106,255,0.25)' : 'rgba(124,106,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, border: ex.source === 'custom' ? '1px solid rgba(124,106,255,0.4)' : 'none' }}>
                                  {ex.source === 'custom' ? '⭐' : '💪'}
                                </div>
                            }
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 500, fontSize: 14, textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</div>
                              <div style={{ fontSize: 12, color: ex.source === 'custom' ? 'var(--accent)' : 'var(--text-muted)', marginTop: 2, textTransform: 'capitalize' }}>
                                {ex.source === 'custom' ? 'Custom' : `${ex.targetMuscles[0] ?? ''}${ex.equipments[0] ? ` · ${ex.equipments[0]}` : ''}`}
                              </div>
                            </div>
                          </button>
                          {ex.source !== 'custom' && (
                            <button onClick={() => setPreviewEx(ex)}
                              style={{ flexShrink: 0, width: 44, alignSelf: 'stretch', background: 'none', border: 'none', borderLeft: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                  {loadingMore && <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>Loading more…</div>}
                  {!hasMore && !searchQuery && <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-subtle)', fontSize: 12 }}>All exercises loaded</div>}
                </>
              )
            }
          </div>
        </div>
      </div>

      {showCreate && <CreateExerciseModal onCreated={handleCustomCreated} onClose={() => setShowCreate(false)} />}
    </>
  )
}
