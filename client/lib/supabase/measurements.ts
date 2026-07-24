import type { SupabaseClient } from '@supabase/supabase-js'

export async function upsertWeight(
  supabase: SupabaseClient,
  userId: string,
  weightKg: number
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)
  await supabase
    .from('measurements')
    .upsert(
      { user_id: userId, recorded_at: today, weight_kg: weightKg, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,recorded_at' }
    )
}

export async function getLatestWeight(
  supabase: SupabaseClient,
  userId: string
): Promise<{ weight_kg: number; recorded_at: string } | null> {
  const { data } = await supabase
    .from('measurements')
    .select('weight_kg, recorded_at')
    .eq('user_id', userId)
    .not('weight_kg', 'is', null)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data ?? null
}

export async function getWeightHistory(
  supabase: SupabaseClient,
  userId: string
): Promise<{ weight_kg: number; recorded_at: string }[]> {
  const { data } = await supabase
    .from('measurements')
    .select('weight_kg, recorded_at')
    .eq('user_id', userId)
    .not('weight_kg', 'is', null)
    .order('recorded_at', { ascending: false })
  return data ?? []
}
