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
  image_url: string | null
  image_url_2: string | null
  exercise_type_name:   string | null
  exercise_type_fields: string[] | null
}

export async function searchExercises(query: string): Promise<Exercise[]> {
  const { data } = await exerciseDb
    .from('exercises')
    .select('id, name, category, equipment, primary_muscles, image_url, image_url_2, exercise_type_name, exercise_type_fields')
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(50)
  return data ?? []
}

export async function getExercisesByIds(ids: string[]): Promise<Exercise[]> {
  if (ids.length === 0) return []
  const { data } = await exerciseDb
    .from('exercises')
    .select('id, name, category, equipment, primary_muscles, image_url, image_url_2, exercise_type_name, exercise_type_fields')
    .in('id', ids)
  return data ?? []
}

export async function getAllExercises(opts?: {
  bodyPart?: string
  equipment?: string
  limit?: number
  offset?: number
}): Promise<{ data: Exercise[]; count: number }> {
  let query = exerciseDb
    .from('exercises')
    .select('id, name, category, equipment, primary_muscles, image_url, image_url_2, exercise_type_name, exercise_type_fields', { count: 'exact' })
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
  return [...new Set(data.flatMap((e: any) => e.primary_muscles ?? []))].sort()
}

export async function getEquipmentList(): Promise<string[]> {
  const { data } = await exerciseDb.from('exercises').select('equipment')
  if (!data) return []
  return [...new Set(data.map((e: any) => e.equipment).filter(Boolean))].sort() as string[]
}
