import { Suspense } from 'react'
import WorkoutClient from './WorkoutClient'

export default function WorkoutPage() {
  return (
    <Suspense>
      <WorkoutClient />
    </Suspense>
  )
}
