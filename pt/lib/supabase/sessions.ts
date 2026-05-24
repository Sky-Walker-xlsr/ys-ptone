import { createClient } from '@/lib/supabase/client'

export async function pairSuperset(
  idA: string,
  idB: string,
  table: 'workout_exercises' | 'plan_exercises'
): Promise<string> {
  const supabase = createClient()
  const groupId  = crypto.randomUUID()
  await supabase.from(table).update({ superset_group: groupId }).in('id', [idA, idB])
  return groupId
}

export async function dissolveSuperset(
  groupId: string,
  table: 'workout_exercises' | 'plan_exercises'
): Promise<void> {
  const supabase = createClient()
  await supabase.from(table).update({ superset_group: null }).eq('superset_group', groupId)
}
