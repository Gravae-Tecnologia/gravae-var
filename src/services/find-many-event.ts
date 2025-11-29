import { prisma } from '@/db'
import { createServerFn } from '@tanstack/react-start'
import { getUsers, getMonitors as getShinobiMonitors } from './shinobi.service'
import { env } from '@/constants/env'

export const findManyEvent = createServerFn({
  method: 'GET',
}).handler(async () => {
  // 1) Busca eventos no banco
  const events = await prisma.event.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      monitors: {
        include: {
          monitor: true,
        },
      },
    },
  })

  // 2) Busca usuário do Shinobi
  const users = await getUsers({
    apiUrl: env.SHINOBI_URL,
    apiKey: env.SHINOBI_API_KEY,
  })

  if (!Array.isArray(users) || !users[0]?.auth) {
    console.error('[findManyEvent] getUsers não retornou auth válido:', users)
    throw new Error(
      'Não foi possível autenticar no Shinobi. Verifique SHINOBI_URL e SHINOBI_API_KEY.',
    )
  }

  const shinobiApiKey = users[0].auth

  // 3) Busca monitores no Shinobi
  const shinobiMonitors = await getShinobiMonitors({
    apiUrl: env.SHINOBI_URL,
    apiKey: shinobiApiKey,
    groupKey: env.SHINOBI_GROUP_KEY,
  })

  // 4) Enriquecer eventos com URL HLS do Shinobi
  shinobiMonitors?.monitors.forEach((monitor) => {
    console.log('[findManyEvent] shinobi monitor:', monitor)

    events.forEach((event) => {
      event.monitors.forEach(({ monitor: m }) => {
        if (m.monitorId === monitor.mid && monitor.streams?.[0]) {
          m.url = `${env.SHINOBI_URL}${monitor.streams[0]}`
        }
      })
    })
  })

  return events
})
