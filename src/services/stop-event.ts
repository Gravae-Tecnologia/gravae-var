import { env } from '@/constants/env'
import { prisma } from '@/db'
import { createServerFn } from '@tanstack/react-start'
import z from 'zod'
import { getUsers, getVideos, setMonitorMode } from './shinobi.service'
import axios from 'axios'

const stopEventSchema = z.object({
  eventId: z.number(),
})

export const stopEvent = createServerFn({
  method: 'POST',
})
  .inputValidator(stopEventSchema)
  .handler(async ({ data }) => {
    // 1) Finaliza o evento e já traz os monitors + monitor
    const event = await prisma.event.update({
      where: {
        id: data.eventId,
      },
      data: {
        status: 'FINISHED',
      },
      include: {
        monitors: {
          include: {
            monitor: true,
          },
        },
      },
    })

    if (!event) {
      throw new Error(`Evento ${data.eventId} não encontrado`)
    }

    // 2) Pega usuário do Shinobi (estou assumindo que é o primeiro)
    const users = await getUsers({
      apiUrl: env.SHINOBI_URL,
      apiKey: env.SHINOBI_API_KEY,
    })

    const shinobiUser = users[0]
    if (!shinobiUser?.auth) {
      throw new Error('Nenhum usuário válido retornado pelo Shinobi')
    }

    // 3) Volta todos os monitores para "modo normal" no Shinobi
    await Promise.all(
      event.monitors.map((em) =>
        setMonitorMode({
          apiKey: shinobiUser.auth,
          apiUrl: env.SHINOBI_URL,
          cameraId: em.monitor.monitorId,
          groupKey: env.SHINOBI_GROUP_KEY,
          mode: 'start', // mantendo sua lógica original
        }),
      ),
    )

    // 4) Atualiza mode local dos Monitors para WATCH_ONLY
    await prisma.monitor.updateMany({
      where: {
        eventMonitors: {
          some: {
            eventId: event.id,
          },
        },
      },
      data: {
        mode: 'WATCH_ONLY',
      },
    })

    // 5) Busca os vídeos no Shinobi para cada monitor
    const responseEventVideos = await Promise.all(
      event.monitors.map((em) =>
        getVideos({
          apiKey: shinobiUser.auth,
          apiUrl: env.SHINOBI_URL,
          cameraId: em.monitor.monitorId,
          groupKey: env.SHINOBI_GROUP_KEY,
          start: em.createdAt, // início = createdAt do EventMonitor
        }),
      ),
    )

    const eventVideos = responseEventVideos
      .flatMap((res) => res?.videos ?? [])
      .filter((video) => video.status === 1)

    // 6) Atualiza cada EventMonitor com a URL correta do vídeo
    await Promise.all(
      event.monitors.map((em) => {
        const video = eventVideos.find((v) => v.mid === em.monitor.monitorId)

        // Se não achou vídeo, mantém null
        const videoUrl = video ? `${env.SHINOBI_URL}${video.href}` : null

        console.log('[stopEvent] Linkando vídeo ao eventMonitor:', {
          eventMonitorId: em.id,
          monitorId: em.monitor.monitorId,
          videoUrl,
        })

        return prisma.eventMonitor.update({
          where: { id: em.id },
          data: { videoUrl },
        })
      }),
    )

    // 7) Marca todos esses vídeos como "lidos" no Shinobi
    await Promise.all(
      eventVideos.map((video) =>
        axios.get(`${env.SHINOBI_URL}${video.links.changeToRead}`),
      ),
    )

    // 8) Retorna o evento atualizado com os EventMonitors já com videoUrl
    const eventWithVideos = await prisma.event.findUnique({
      where: { id: event.id },
      include: {
        monitors: true,
      },
    })

    return eventWithVideos
  })
