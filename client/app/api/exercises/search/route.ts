import { NextRequest, NextResponse } from 'next/server'
import { searchExercises } from '@/lib/exercisedb'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? ''
  if (!q.trim()) return NextResponse.json([])

  try {
    const data = await searchExercises(q)
    const formatted = data.map(ex => ({
      exerciseId:    ex.id,
      name:          ex.name,
      imageUrl:      ex.image_url,
      imageUrl2:     ex.image_url_2,
      targetMuscles: ex.primary_muscles,
      equipments:    ex.equipment ? [ex.equipment] : [],
      source:        'exercisedb',
    }))
    return NextResponse.json(formatted)
  } catch (err) {
    console.error('exercises/search error:', err)
    return NextResponse.json([], { status: 500 })
  }
}
