import { NextRequest, NextResponse } from 'next/server'
import { getAllExercises } from '@/lib/exercisedb'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const bodyPart  = searchParams.get('bodyPart')  ?? undefined
  const equipment = searchParams.get('equipment') ?? undefined
  const offset    = parseInt(searchParams.get('cursor') ?? '0')
  const limit     = 50

  try {
    const { data, count } = await getAllExercises({ bodyPart, equipment, limit, offset })
    const formatted = data.map(ex => ({
      exerciseId:    ex.id,
      name:          ex.name,
      imageUrl:      ex.image_url,
      imageUrl2:     ex.image_url_2,
      targetMuscles: ex.primary_muscles,
      equipments:    ex.equipment ? [ex.equipment] : [],
      source:        'exercisedb',
    }))
    return NextResponse.json({
      data: formatted,
      meta: { hasNextPage: offset + limit < (count ?? 0), nextCursor: String(offset + limit), total: count },
    })
  } catch (err) {
    console.error('exercises/list error:', err)
    return NextResponse.json({ data: [], meta: { hasNextPage: false } }, { status: 500 })
  }
}
