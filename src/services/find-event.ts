import { env } from '@/constants/env'
import { prisma } from '@/db'
import { createServerFn } from '@tanstack/react-start'
import z from 'zod'
import { getMonitors as getShinobiMonitors, getUsers } from './shinobi.service'

const getEventSchema = z.object({
  eventId: z.number(),
})

const getEvent = createServerFn({
  method: 'GET',
})
  .inputValidator(getEventSchema)
  .handler(async ({ data }) => {
    return await prisma.event.findFirst({
      where: {
        id: data.eventId,
      },
      include: {
        monitors: {
          include: {
            monitor: true,
          },
        },
      },
    })
  })

export async function findEvent(props: z.infer<typeof getEventSchema>) {
  {
    const event = await getEvent({
      data: props,
    })

    const user = await getUsers({
      apiUrl: env.SHINOBI_URL,
      apiKey: env.SHINOBI_API_KEY,
    })

    const shinobiMonitors = await getShinobiMonitors({
      apiUrl: env.SHINOBI_URL,
      apiKey: user[0].auth,
      groupKey: env.SHINOBI_GROUP_KEY,
    })

    shinobiMonitors?.monitors.forEach((monitor) => {
      event?.monitors.forEach(({ monitor: m }) => {
        if (m.monitorId === monitor.mid) {
          m.url = `${env.SHINOBI_URL}${monitor.streams[0]}`
        }
      })
    })

    return event
  }
}
