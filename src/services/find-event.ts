import { env } from '@/constants/env'
import { prisma } from '@/db'
import { createServerFn } from '@tanstack/react-start'
import z from 'zod'
import {
  getMonitors as getShinobiMonitors,
  getUsers,
  getVideos,
} from './shinobi.service'
import axios from 'axios'

const getEventSchema = z.object({
  eventId: z.number(),
})

const findEventServer = createServerFn({
  method: 'GET',
})
  .inputValidator(getEventSchema)
  .handler(async ({ data }) => {
    const event = await prisma.event.findFirst({
      where: { id: data.eventId },
      include: {
        monitors: {
          include: {
            videos: true,
            monitor: true,
          },
        },
      },
    })

    if (!event) return null

    const user = await getUsers({
      apiUrl: env.SHINOBI_URL,
      apiKey: env.SHINOBI_API_KEY,
    })

    const shinobiMonitors = await getShinobiMonitors({
      apiUrl: env.SHINOBI_URL,
      apiKey: user[0].auth,
      groupKey: env.SHINOBI_GROUP_KEY,
    })

    // Preenche URL HLS de cada monitor (live)
    event.monitors.forEach((em) => {
      const sm = shinobiMonitors?.monitors.find(
        (m) => m.mid === em.monitor.monitorId,
      )
      if (sm && sm.streams?.[0]) {
        em.monitor.url = `${env.SHINOBI_URL}${sm.streams[0]}`
      }
    })

    if (event.status === 'FINISHED') {
      // Monitors sem videoUrl gravado ainda
      const monitorsWithoutVideo = event.monitors.filter(
        (monitor) => monitor.videos.length <= 0,
      )

      if (monitorsWithoutVideo.length > 0) {
        // busca vídeos no Shinobi
        const responseEventVideos = await Promise.all(
          monitorsWithoutVideo.map((em) =>
            getVideos({
              apiKey: user[0].auth,
              apiUrl: env.SHINOBI_URL,
              cameraId: em.monitor.monitorId,
              groupKey: env.SHINOBI_GROUP_KEY,
              start: em.createdAt,
            }),
          ),
        )

        const eventVideos = responseEventVideos
          .flatMap((res) => res?.videos ?? [])
          .filter((v) => v.status === 1)

        // atualiza eventMonitor.videoUrl
        await Promise.all(
          event.monitors.map((em) => {
            const videos = eventVideos.filter(
              (v) => v.mid === em.monitor.monitorId,
            )

            console.log('[stopEvent] Linkando vídeo ao eventMonitor:', {
              eventMonitorId: em.id,
              monitorId: em.monitor.monitorId,
              videos,
            })

            return prisma.eventMonitor.update({
              where: { id: em.id },
              data: {
                videos: {
                  createMany: {
                    data: videos.map((video) => ({
                      filename: video.filename,
                      url: `${env.SHINOBI_URL}${video.href}`,
                      startAt: video.time,
                    })),
                  },
                },
              },
            })
          }),
        )

        // marca vídeos como lidos
        await Promise.all(
          eventVideos.map((video) =>
            axios.get(`${env.SHINOBI_URL}${video.links.changeToRead}`),
          ),
        )
      }
    }

    return event
  })

export { findEventServer as findEvent }
