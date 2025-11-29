import { Multiselect } from '@/components/Multiselect'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { VideoPlayer } from '@/components/VideoPlayer'
import { env } from '@/constants/env'
import { prisma } from '@/db'
import { cn } from '@/lib/utils'
import { findManyMonitor } from '@/services/find-many-monitor'
import { getUsers, setMonitorMode } from '@/services/shinobi.service'
import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import z from 'zod'

export const Route = createFileRoute('/_app/event/')({
  component: App,
  loader: async () => await findManyMonitor(),
})

const formSchema = z.object({
  name: z
    .string()
    .min(1, 'minimo 1 caracteres.')
    .max(100, 'máximo 100 caracteres.'),
  monitors: z
    .array(
      z.object({
        label: z.string(),
        value: z.number(),
      }),
    )
    .min(1, 'Selecione uma câmera'),
})

type FormValues = z.infer<typeof formSchema>

const createEvent = createServerFn({
  method: 'POST',
})
  .inputValidator(formSchema)
  .handler(async ({ data }) => {
    const event = await prisma.event.create({
      data: {
        name: data.name,
        monitors: {
          createMany: {
            data: data.monitors.map((monitor) => ({
              monitorId: monitor.value,
            })),
          },
        },
      },
      include: {
        monitors: {
          include: {
            monitor: true,
          },
        },
      },
    })

    const user = await getUsers({
      apiUrl: env.SHINOBI_URL,
      apiKey: env.SHINOBI_API_KEY,
    })

    await Promise.all(
      event.monitors.map((monitor) =>
        setMonitorMode({
          apiKey: user[0].auth,
          apiUrl: env.SHINOBI_URL,
          cameraId: monitor.monitor.monitorId,
          groupKey: env.SHINOBI_GROUP_KEY,
          mode: 'record',
        }),
      ),
    )

    await prisma.monitor.updateMany({
      where: {
        eventMonitors: {
          some: {
            event: {
              id: event.id,
            },
          },
        },
      },
      data: {
        mode: 'RECORD',
      },
    })

    return event
  })

function App() {
  const [isCreatingEvent, setIsCreatingEvent] = useState(false)
  const router = useRouter()
  const monitors = Route.useLoaderData()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      monitors: [],
    },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      setIsCreatingEvent(true)
      await createEvent({
        data: values,
      })
      await router.invalidate()
      await router.navigate({
        from: '/',
        reloadDocument: true,
      })
    } finally {
      setIsCreatingEvent(false)
    }
  }

  const cameras = form.watch('monitors')

  const options = useMemo(
    () =>
      monitors
        .filter((monitor) => monitor.mode === 'WATCH_ONLY')
        .map((monitor) => ({
          label: monitor.name,
          value: monitor.id,
        })),
    [monitors],
  )

  return (
    <div className="flex gap-4 flex-wrap max-md:flex-col">
      <div
        className={cn(
          'grid flex-1 gap-4 duration-300 max-md:flex-full max-md:order-2',
          cameras.length > 1 ? 'grid-cols-2' : 'grid-cols-1',
          'max-lg:grid-cols-1!',
        )}
      >
        {cameras.map((camera) => (
          <div
            key={camera.value}
            className="flex-1 aspect-video bg-gray-900 duration-300 transition-all ease-in-out"
          >
            <VideoPlayer
              src={
                monitors.find((monitor) => monitor.id === camera.value)?.url ||
                ''
              }
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 md:basis-[340px] sticky top-4 max-md:order-1 bg-gray-800 pb-4">
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="event-form-name">Nome da prova</FieldLabel>
              <Input
                {...field}
                id="event-form-name"
                aria-invalid={fieldState.invalid}
                placeholder="Login button not working on mobile"
                autoComplete="off"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="monitors"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="event-form-monitor">Câmeras</FieldLabel>

              <Multiselect
                {...field}
                options={options}
                id="event-form-monitor"
                aria-invalid={fieldState.invalid}
                placeholder="Login button not working on mobile"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Button
          disabled={isCreatingEvent}
          variant={'destructive'}
          size={'lg'}
          className="mt-4"
          onClick={form.handleSubmit(onSubmit)}
        >
          Iniciar gravação
        </Button>
      </div>
    </div>
  )
}
