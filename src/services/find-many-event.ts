import { prisma } from '@/db'
import { createServerFn } from '@tanstack/react-start'
import { getUsers, getMonitors as getShinobiMonitors } from './shinobi.service'
import { env } from '@/constants/env'

const getEvents = createServerFn({
  method: 'GET',
}).handler(async () => {
  return await prisma.event.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      monitors: {
        include: {
          monitor: true,
        },
      },
    },
  })
})

export async function findManyEvent() {
  {
    const events = await getEvents()

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
      console.log(monitor)

      events.forEach((event) => {
        event.monitors.forEach(({ monitor: m }) => {
          if (m.monitorId === monitor.mid) {
            m.url = `${env.SHINOBI_URL}${monitor.streams[0]}`
          }
        })
      })
    })

    return events
  }
}
