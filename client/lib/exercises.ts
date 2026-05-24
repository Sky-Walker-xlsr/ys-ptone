import { createClient } from '@/lib/supabase/client'

export interface ExerciseItem {
  exerciseId: string
  name: string
  imageUrl: string
  imageUrl2?: string
  targetMuscles: string[]
  equipments: string[]
  source?: string
}

export async function getAllExercises(opts?: {
  muscle?: string
  equipment?: string
  limit?: number
  offset?: number
}): Promise<{ data: ExerciseItem[]; count: number }> {
  const supabase = createClient()
  const limit = opts?.limit ?? 50
  const offset = opts?.offset ?? 0

  let query = supabase
    .from('exercises')
    .select(`
      id, name, image_url, image_url_2, source,
      muscles!primary_muscle_id(name),
      equipment!equipment_id(name)
    `, { count: 'exact' })
    .eq('source', 'exercisedb')
    .order('name')
    .range(offset, offset + limit - 1)

  if (opts?.muscle) {
    query = query.eq('muscles.name', opts.muscle)
  }
  if (opts?.equipment) {
    query = query.eq('equipment.name', opts.equipment)
  }

  const { data, error, count } = await query
  if (error) console.error('getAllExercises:', error)

  return {
    data: (data ?? []).map((e: any) => ({
      exerciseId: e.id,
      name: e.name ?? '',
      imageUrl: e.image_url ?? '',
      imageUrl2: e.image_url_2 ?? undefined,
      targetMuscles: e.muscles?.name ? [e.muscles.name] : [],
      equipments: e.equipment?.name ? [e.equipment.name] : [],
      source: e.source,
    })),
    count: count ?? 0,
  }
}

export async function searchExercises(q: string): Promise<ExerciseItem[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exercises')
    .select(`
      id, name, image_url, image_url_2, source,
      muscles!primary_muscle_id(name),
      equipment!equipment_id(name)
    `)
    .ilike('name', `%${q}%`)
    .order('name')
    .limit(50)

  if (error) console.error('searchExercises:', error)

  return (data ?? []).map((e: any) => ({
    exerciseId: e.id,
    name: e.name ?? '',
    imageUrl: e.image_url ?? '',
    imageUrl2: e.image_url_2 ?? undefined,
    targetMuscles: e.muscles?.name ? [e.muscles.name] : [],
    equipments: e.equipment?.name ? [e.equipment.name] : [],
    source: e.source,
  }))
}

export async function getBodyParts(): Promise<string[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('muscles')
    .select('name')
    .order('name')
  return (data ?? []).map((m: any) => m.name).filter(Boolean)
}

export async function getEquipmentList(): Promise<string[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('equipment')
    .select('name')
    .order('name')
  return (data ?? []).map((e: any) => e.name).filter(Boolean)
}
