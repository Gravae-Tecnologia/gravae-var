import PageHeader from '@/components/PageHeader'
import { findEvent } from '@/services/find-event'
import { stopEvent } from '@/services/stop-event'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { StopEventDialog } from '../_components/stop-event-dialog'
import { useMemo, useState } from 'react'
import { VideoPlayer } from '@/components/VideoPlayer'
import dayjs from 'dayjs'
import { Multiselect } from '@/components/Multiselect'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'

export const Route = createFileRoute('/_app/event/$eventId')({
  component: RouteComponent,
  loader: async ({ params: { eventId } }) =>
    await findEvent({
      data: {
        eventId: Number(eventId),
      },
    }),
})

interface MonitorOptions {
  label: string
  value: number
}

function RouteComponent() {
  const router = useRouter()
  const event = Route.useLoaderData()

  const [selectMonitor, setSelectMonitor] = useState<MonitorOptions>()

  const monitorOptions: MonitorOptions[] = event?.monitors.map((monitor) => ({
    value: monitor.id,
    label: monitor.monitor.name,
  })) as MonitorOptions[]

  const selectedMonitor = useMemo(
    () =>
      selectMonitor
        ? event?.monitors.find((monitor) => selectMonitor.value === monitor.id)
        : event?.monitors[0],
    [event, selectMonitor],
  )

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
      await router.invalidate()
    } catch {
      setIsStopEvent(false)
    }
  }

  return (
    <div className="flex flex-col -mt-4">
      <PageHeader
        title="Acompanhar eventos"
        subTitle="Acompanhe os eventos e gerencie as gravações."
        className="sticky top-0 bg-gray-800 py-4"
      >
        {event?.status === 'FINISHED' ? (
          <select
            className="bg-gray-700 p-4 rounded-xl cursor-pointer"
            defaultValue={selectedMonitor?.id}
            onChange={(e) => {
              setSelectMonitor(
                monitorOptions.find(
                  (option) => option.value === Number(e.target.value),
                ),
              )
              window.scrollTo(0, 0)
            }}
          >
            {monitorOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <StopEventDialog
            onConfirm={handleStopEvent}
            isDisabled={isStopEvent}
          />
        )}
      </PageHeader>

      {event?.status === 'RECORDING' ? (
        <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
          {event?.monitors.map((monitor) => (
            <div className="aspect-video relative" key={monitor.id}>
              <span className="absolute z-99 bg-green-400 p-2 rounded-full left-2 top-2">
                {monitor.monitor.name}
              </span>

              <VideoPlayer src={monitor.monitor.url || ''} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
          {selectedMonitor?.videos.map((monitor) => (
            <div className="aspect-video relative" key={monitor.id}>
              <span className="absolute z-99 bg-green-400 p-2 rounded-full left-2 top-2">
                {dayjs(monitor.startAt).format('DD/MM/YYYY HH:mm:ss')}
              </span>

              <VideoPlayer src={monitor.url} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
