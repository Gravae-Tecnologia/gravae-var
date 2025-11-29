import { prisma } from '@/db'
import { createServerFn } from '@tanstack/react-start'
import { getUsers, getMonitors as getShinobiMonitors } from './shinobi.service'
import { env } from '@/constants/env'

// NÃO exporta mais um serverFn intermediário
export const findManyMonitor = createServerFn({
  method: 'GET',
}).handler(async () => {
  // 1) Busca monitores no banco
  const monitors = await prisma.monitor.findMany({
    orderBy: { createdAt: 'desc' },
  })

  // 2) Busca usuário do Shinobi
  const users = await getUsers({
    apiUrl: env.SHINOBI_URL,
    apiKey: env.SHINOBI_API_KEY,
  })

  if (!Array.isArray(users) || !users[0]?.auth) {
    console.error('[findManyMonitor] getUsers não retornou auth válido:', users)
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

  // 4) Enriquecer monitores do banco com a URL HLS do Shinobi
  shinobiMonitors?.monitors.forEach((monitor) => {
    monitors.forEach((m) => {
      if (m.monitorId === monitor.mid && monitor.streams?.[0]) {
        m.url = `${env.SHINOBI_URL}${monitor.streams[0]}`
      }
    })
  })

  return monitors
})
