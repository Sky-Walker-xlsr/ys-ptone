import { NextResponse } from 'next/server'
import { getBodyParts, getEquipmentList } from '@/lib/exercisedb'

export async function GET() {
  try {
    const [bodyParts, equipments] = await Promise.all([getBodyParts(), getEquipmentList()])
    return NextResponse.json({ bodyParts, equipments })
  } catch (err) {
    console.error('exercises/filters error:', err)
    return NextResponse.json({ bodyParts: [], equipments: [] }, { status: 500 })
  }
}
