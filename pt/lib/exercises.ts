import { getExerciseById } from './exercisedb'

export async function loadEDBDataForExercises<T extends {
  exercises?: { external_id?: string | null } | null
  edbData?: unknown
}>(items: T[]): Promise<T[]> {
  return Promise.all(
    items.map(async item => {
      if (item.edbData) return item
      const externalId = item.exercises?.external_id
      if (!externalId) return item
      try {
        const data = await getExerciseById(externalId)
        if (data) {
          return {
            ...item,
            edbData: {
              exerciseId: data.id,
              name: data.name,
              imageUrl: data.image_url,
              imageUrl2: data.image_url_2,
              targetMuscles: data.primary_muscles,
              bodyParts: data.primary_muscles,
              equipments: data.equipment ? [data.equipment] : [],
            },
          }
        }
      } catch {}
      return item
    })
  )
}
