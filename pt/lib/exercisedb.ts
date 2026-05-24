import { createClient } from '@supabase/supabase-js'

const exerciseDb = createClient(
  process.env.NEXT_PUBLIC_EXERCISE_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_EXERCISE_SUPABASE_ANON_KEY!
)

export interface Exercise {
  id: string
  name: string
  category: string | null
  equipment: string | null
  primary_muscles: string[]
  secondary_muscles: string[]
  instructions: string[]
  image_url: string | null
  image_url_2: string | null
  level: string | null
  force: string | null
  mechanic: string | null
}

export async function searchExercises(query: string): Promise<Exercise[]> {
  const { data } = await exerciseDb
    .from('exercises')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(50)
  return data ?? []
}

export async function getExerciseById(id: string): Promise<Exercise | null> {
  const { data } = await exerciseDb
    .from('exercises')
    .select('*')
    .eq('id', id)
    .single()
  return data ?? null
}

export async function getAllExercises(opts?: {
  bodyPart?: string
  equipment?: string
  limit?: number
  offset?: number
}): Promise<{ data: Exercise[]; count: number }> {
  let query = exerciseDb
    .from('exercises')
    .select('*', { count: 'exact' })
    .order('name')

  if (opts?.bodyPart)  query = query.contains('primary_muscles', [opts.bodyPart.toLowerCase()])
  if (opts?.equipment) query = query.ilike('equipment', opts.equipment)

  const limit  = opts?.limit  ?? 50
  const offset = opts?.offset ?? 0
  query = query.range(offset, offset + limit - 1)

  const { data, count } = await query
  return { data: data ?? [], count: count ?? 0 }
}

export async function getBodyParts(): Promise<string[]> {
  const { data } = await exerciseDb.from('exercises').select('primary_muscles')
  if (!data) return []
  return [...new Set(data.flatMap(e => e.primary_muscles ?? []))].sort()
}

export async function getEquipmentList(): Promise<string[]> {
  const { data } = await exerciseDb.from('exercises').select('equipment')
  if (!data) return []
  return [...new Set(data.map(e => e.equipment).filter(Boolean))].sort() as string[]
}
