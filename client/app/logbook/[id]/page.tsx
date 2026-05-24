import { Suspense } from 'react'
import LogbookDetailClient from './LogbookDetailClient'

export default async function LogbookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <Suspense>
      <LogbookDetailClient sessionId={id} />
    </Suspense>
  )
}
