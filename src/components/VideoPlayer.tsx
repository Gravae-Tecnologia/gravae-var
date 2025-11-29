import { cn } from '@/lib/utils'
import Hls from 'hls.js'
import {
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  useEffect,
  useRef,
  useState,
  ChangeEvent,
} from 'react'

type VarPlayerProps = {
  src: string // URL HLS (.m3u8) ou MP4
}

interface ActionButtonProps extends DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> {}

const ActionButton: React.FC<ActionButtonProps> = ({ className, ...rest }) => {
  return (
    <button
      {...rest}
      className={cn(
        'p-1 cursor-pointer duration-300 hover:bg-gray-550 rounded-md',
        className,
      )}
    />
  )
}

// util simples pra exibir 00:00 / 12:34
function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return '00:00'
  const total = Math.max(0, Math.floor(seconds))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function VideoPlayer({ src }: VarPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isHls, setIsHls] = useState(false)

  // Carrega HLS se for .m3u8, MP4 se não for
  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    setPlaybackRate(1)
    setIsPlaying(false)
    setDuration(0)
    setCurrentTime(0)

    const isHlsSource = /\.m3u8(\?|$)/i.test(src)
    setIsHls(isHlsSource)

    if (!isHlsSource || !Hls.isSupported()) {
      // MP4 / HLS nativo
      video.src = src
      return
    }

    let destroyed = false
    let networkRetries = 0
    let mediaRetries = 0

    const maxNetworkRetries = 5
    const maxMediaRetries = 3

    const hls = new Hls({
      manifestLoadingMaxRetry: 0,
      fragLoadingMaxRetry: 0,
    })

    const scheduleReload = () => {
      if (destroyed) return
      if (networkRetries >= maxNetworkRetries) {
        console.warn('[HLS] limite de tentativas de rede, destruindo.')
        hls.destroy()
        return
      }
      networkRetries++
      const delay = 2000 * Math.min(networkRetries, 10)
      console.warn(
        `[HLS] NETWORK_ERROR – tentativa #${networkRetries} em ${delay}ms...`,
      )
      setTimeout(() => {
        if (destroyed) return
        hls.startLoad()
      }, delay)
    }

    hls.attachMedia(video)
    hls.loadSource(src)

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      networkRetries = 0
      mediaRetries = 0
      video.muted = true
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.warn('Autoplay bloqueado:', err))
    })

    hls.on(Hls.Events.ERROR, (event, data) => {
      if (!data.fatal || destroyed) return

      console.warn('[HLS fatal error]', data)

      // erros de parse de manifest/level normalmente são definitivos
      const isParseError =
        data.details === 'manifestParsingError' ||
        data.details === 'levelParsingError'

      switch (data.type) {
        case Hls.ErrorTypes.NETWORK_ERROR:
          scheduleReload()
          break

        case Hls.ErrorTypes.MEDIA_ERROR:
          console.warn('[HLS] MEDIA_ERROR, tentando recoverMediaError...')
          if (mediaRetries >= maxMediaRetries || isParseError) {
            console.warn('[HLS] limite de MEDIA_ERROR, destruindo.')
            hls.destroy()
          } else {
            mediaRetries++
            hls.recoverMediaError()
          }
          break

        default:
          console.warn('[HLS] erro irreversível, destruindo.')
          hls.destroy()
          break
      }
    })

    return () => {
      destroyed = true
      hls.destroy()
    }
  }, [src])

  // Sincroniza estado isPlaying + duration + currentTime com o vídeo
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleLoadedMetadata = () => {
      const d = video.duration
      setDuration(Number.isFinite(d) ? d : 0)
    }
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handlePause)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handlePause)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [])

  const changeSpeed = (rate: number) => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = rate
    setPlaybackRate(rate)
  }

  const seekRelative = (deltaSeconds: number) => {
    const video = videoRef.current
    if (!video) return
    const next = Math.max(0, video.currentTime + deltaSeconds)
    video.currentTime = next
    setCurrentTime(next)
  }

  const handleSeekBarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return
    const newTime = Number(e.target.value)
    video.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handlePlay = async () => {
    const video = videoRef.current
    if (!video) return
    try {
      await video.play()
    } catch (err) {
      console.error('Erro ao dar play:', err)
    }
  }

  const handlePause = () => {
    const video = videoRef.current
    if (!video) return
    video.pause()
  }

  const togglePlayPause = () => {
    if (isPlaying) {
      handlePause()
    } else {
      void handlePlay()
    }
  }

  const handleVideoClick = () => {
    // só toggle VAR-style quando for MP4/VOD
    if (!isHls) togglePlayPause()
  }

  const safeDuration = duration || 0
  const safeCurrentTime =
    safeDuration > 0 ? Math.min(currentTime, safeDuration) : 0

  const showControls = !isHls // só mostra barra + botões quando NÃO for HLS

  return (
    <div className="w-full mx-auto">
      <div className="relative bg-black">
        <video
          key={src} // se o src mudar, força remount do <video>
          ref={videoRef}
          controls={isHls} // HLS usa os controles nativos
          className={cn('w-full block', !isHls && 'cursor-pointer')}
          onClick={handleVideoClick}
        />
      </div>

      {/* Controles estilo VAR – só aparece para MP4/VOD */}
      {showControls && (
        <div className="flex flex-col items-center gap-4 p-2">
          {/* Barra de progresso */}
          <div className="w-full max-w-xl flex items-center gap-2">
            <span className="text-xs text-gray-300 min-w-10 text-right">
              {formatTime(safeCurrentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={safeDuration || 0}
              step={0.04} // ~25 fps
              value={safeDuration ? safeCurrentTime : 0}
              onChange={handleSeekBarChange}
              className="flex-1 accent-green-400 cursor-pointer"
              disabled={!safeDuration}
            />
            <span className="text-xs text-gray-300 min-w-10">
              {formatTime(safeDuration)}
            </span>
          </div>

          {/* Play / Pause + voltar / avançar */}
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex gap-2">
              {/* <-- ÚNICO BOTÃO PLAY/PAUSE */}
              <ActionButton onClick={togglePlayPause}>
                {isPlaying ? '⏸ Pausar' : '▶️ Play'}
              </ActionButton>
            </div>

            <div className="flex gap-2">
              <ActionButton onClick={() => seekRelative(-5)}>
                ⏪ -5s
              </ActionButton>
              <ActionButton onClick={() => seekRelative(-1)}>
                ◀ -1s
              </ActionButton>
              <ActionButton onClick={() => seekRelative(1)}>+1s ▶</ActionButton>
              <ActionButton onClick={() => seekRelative(5)}>
                +5s ⏩
              </ActionButton>
            </div>
          </div>

          {/* Velocidades */}
          <div className="grid grid-cols-6 gap-2">
            {[0.25, 0.5, 1, 1.5, 2, 4].map((rate) => (
              <ActionButton
                key={rate}
                onClick={() => changeSpeed(rate)}
                className={cn(
                  'border border-gray-400',
                  playbackRate === rate && 'border-green-400 bg-green-400',
                )}
              >
                {rate}x
              </ActionButton>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
