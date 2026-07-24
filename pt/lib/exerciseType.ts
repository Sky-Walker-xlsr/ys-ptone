export type ExerciseField = 'weight_kg' | 'reps' | 'duration_seconds' | 'distance_km'

type EDBHint = {
  exercise_type_fields?: string[] | null
  equipments?: string[]
  category?: string | null
  name?: string | null
} | null | undefined

function inferFromEquipmentCategory(edb: EDBHint): ExerciseField[] | null {
  if (!edb) return null
  const equipment = (edb.equipments?.[0] ?? '').toLowerCase().trim()
  const category  = (edb.category ?? '').toLowerCase().trim()
  // Cardio: show both distance and duration so users can fill whichever applies
  if (category === 'cardio') return ['distance_km', 'duration_seconds']
  if (category === 'stretching') return ['duration_seconds']
  if (category === 'plyometrics') return ['reps']
  // "body only" is the actual ExerciseDB value for bodyweight exercises
  if (equipment === 'body only' || equipment === 'bodyweight' || equipment === 'body weight') return ['reps']
  if (equipment === 'foam roll') return ['duration_seconds']
  if (equipment && equipment !== 'other') return ['weight_kg', 'reps']
  return null
}

/**
 * Priority:
 *  1. exercise_type_fields on the exercise object (app DB column, when set)
 *  2. exercise_type_fields from EDB (fetched via loadEDBDataForExercises — most reliable)
 *  3. Inferred from EDB category + equipment (fallback)
 *  4. Default ['weight_kg', 'reps']
 */
export function getExerciseFields(
  exercise: object,
  edbHint?: EDBHint
): ExerciseField[] {
  // 1. App DB column (set after migration + CreateExerciseModal)
  const appFields = (exercise as Record<string, unknown>).exercise_type_fields as string[] | null | undefined
  if (appFields && appFields.length > 0) return appFields as ExerciseField[]

  // 2. ExerciseDB exercise_type_fields (authoritative, already fetched)
  // Parse defensively — jsonb may arrive as a string in some environments
  const rawEdb = edbHint?.exercise_type_fields
  const edbFields: string[] | null = Array.isArray(rawEdb) ? rawEdb
    : typeof rawEdb === 'string' ? (() => { try { const p = JSON.parse(rawEdb); return Array.isArray(p) ? p : null } catch { return null } })()
    : null
  if (edbFields && edbFields.length > 0) return edbFields as ExerciseField[]

  // 3. Infer from category + equipment
  const inferred = inferFromEquipmentCategory(edbHint)
  if (inferred) return inferred

  return ['weight_kg', 'reps']
}

export function isBodyweightExercise(
  exercise: object,
  edbHint?: EDBHint
): boolean {
  const fields = getExerciseFields(exercise, edbHint)
  return fields.includes('reps') && !fields.includes('weight_kg')
}

export type BodyweightModifier = 'weighted' | 'assisted' | null

/**
 * Returns whether this is a weighted or assisted bodyweight exercise.
 *
 * Priority:
 *  1. exercise_type_name from EDB ("Weighted Bodyweight" / "Assisted Bodyweight")
 *  2. Name-based inference when EDB type is null (e.g. "Band Assisted Pull-Up")
 */
export function getBodyweightModifier(
  edbHint?: { exercise_type_name?: string | null; name?: string | null } | null
): BodyweightModifier {
  // 1. Authoritative type name
  const typeName = edbHint?.exercise_type_name
  if (typeName === 'Weighted Bodyweight') return 'weighted'
  if (typeName === 'Assisted Bodyweight') return 'assisted'

  // 2. Infer from exercise name when EDB type_name is not populated
  const n = (edbHint?.name ?? '').toLowerCase()
  if (!n) return null
  if (n.includes('assisted')) return 'assisted'
  // "weighted" prefix on a bodyweight movement (pull-up, dip, chin-up, push-up, sit-up)
  if (n.includes('weighted') && /pull|dip|chin|push|sit.up|squat|lunge/.test(n)) return 'weighted'

  return null
}

export function getFieldLabel(field: ExerciseField): string {
  return { weight_kg: 'Weight', reps: 'Reps', duration_seconds: 'Duration', distance_km: 'Distance' }[field]
}

export function getFieldHeader(field: ExerciseField): string {
  return { weight_kg: 'kg', reps: 'Reps', duration_seconds: 'sec', distance_km: 'km' }[field]
}

export function getFieldUnit(field: ExerciseField): string {
  return { weight_kg: 'kg', reps: 'reps', duration_seconds: 's', distance_km: 'km' }[field]
}

export function getFieldStep(field: ExerciseField): string {
  return { weight_kg: '0.5', reps: '1', duration_seconds: '1', distance_km: '0.01' }[field]
}

export function getFieldInputMode(field: ExerciseField): 'decimal' | 'numeric' {
  return field === 'weight_kg' || field === 'distance_km' ? 'decimal' : 'numeric'
}
