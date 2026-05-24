import { Suspense } from 'react'
import PlanEditClient from './PlanEditClient'

export default async function PlanEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <Suspense>
      <PlanEditClient planId={id} />
    </Suspense>
  )
}
