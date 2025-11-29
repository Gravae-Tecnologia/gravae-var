import PageHeader from '@/components/PageHeader'
import { findEvent } from '@/services/find-event'
import { stopEvent } from '@/services/stop-event'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { StopEventDialog } from '../_components/stop-event-dialog'
import { useState } from 'react'
import { VideoPlayer } from '@/components/VideoPlayer'

export const Route = createFileRoute('/_app/event/$eventId')({
  component: RouteComponent,
  loader: async ({ params: { eventId } }) =>
    await findEvent({
      data: {
        eventId: Number(eventId),
      },
    }),
})

function RouteComponent() {
  const router = useRouter()
  const event = Route.useLoaderData()

  const [isStopEvent, setIsStopEvent] = useState(false)

  const handleStopEvent = async () => {
    if (!event) return

    try {
      setIsStopEvent(true)
      await stopEvent({
        data: {
          eventId: event.id,
        },
      })
      router.invalidate()
    } catch {
      setIsStopEvent(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Acompanhar eventos"
        subTitle="Acompanhe os eventos e gerencie as gravações."
      >
        {event?.status !== 'FINISHED' && (
          <StopEventDialog
            onConfirm={handleStopEvent}
            isDisabled={isStopEvent}
          />
        )}
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 mt-4 max-md:grid-cols-1">
        {event?.monitors.map((monitor) => (
          <div className="aspect-video relative" key={monitor.id}>
            <span className="absolute z-99 bg-green-400 p-2 rounded-full right-2 top-2">
              {monitor.monitor.name}
            </span>
            <VideoPlayer src={monitor.videoUrl || monitor.monitor.url || ''} />
          </div>
        ))}
      </div>
    </>
  )
}
