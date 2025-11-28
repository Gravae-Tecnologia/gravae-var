import { prisma } from '@/db'
import { createServerFn } from '@tanstack/react-start'
import { getUsers, getMonitors as getShinobiMonitors } from './shinobi.service'
import { env } from '@/constants/env'

const getMonitors = createServerFn({
  method: 'GET',
}).handler(async () => {
  return await prisma.monitor.findMany({
    orderBy: { createdAt: 'desc' },
  })
})

export async function findManyMonitor() {
  {
    const monitors = await getMonitors()

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

      monitors.forEach((m) => {
        if (m.monitorId === monitor.mid) {
          m.url = `${env.SHINOBI_URL}${monitor.streams[0]}`
        }
      })
    })

    return monitors
  }
}
