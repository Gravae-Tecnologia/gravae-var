import axios from 'axios'
import dayjs from 'dayjs'

interface ILinks {
  deleteVideo: string
  changeToUnread: string
  changeToRead: string
}

interface IDetails {
  type: string
  id: string
}

export interface ShinobiVideoModel {
  apiUrl: string
  mid: string
  ke: string
  href: string
  size: number
  time: Date
  end: Date
  status: number
  details: IDetails
  ext: string
  filename: string
  actionUrl: string
  links: ILinks
}

type VideosResponse = {
  ok: boolean
  msg?: string
  videos?: ShinobiVideoModel[]
}

enum StatusCode {
  'Disabled' = '0',
  'Starting' = '1',
  'Watching' = '2',
  'Recording' = '3',
  'Restarting' = '4',
  'Stopped' = '5',
  'Idle' = '6',
  'Died' = '7',
  'Stopping' = '8',
  'Started' = '9',
}

export interface IShinobiUser {
  ke: string // group_key
  uid: string
  auth: string
  mail: string
  apiUrl: string
}

export interface StreamsSortedByType {
  hls: string[]
}

export interface IShinobiMonitor {
  mid: string
  ke: string
  name: string
  shto: any
  shfr: any
  details: string
  type: string
  ext: string
  protocol: string
  host: string
  path: string
  port: number
  fps: number
  mode: string
  width: number
  height: number
  saveDir: any
  tags: string
  currentlyWatching: number
  status: keyof typeof StatusCode
  code: StatusCode
  streams: string[]
  streamsSortedByType: StreamsSortedByType
}

interface IShinobiUserAuth {
  $user: {
    auth_token: string
    ke: string
    uid: string
    mail: string
  }
}

interface IFetchShinobiUsers {
  apiKey: string
  apiUrl: string
}

export interface IShinobiCamera {
  ke: string
  mid: string
  name: string
  type: string
  ext: string
  protocol: string
  host: string
  path: string
  port: number
  mode: string
  details: {
    auto_host: string
  }
}

export interface IMonitorsResponse {
  apiKey: string
  apiUrl: string
  monitors: IShinobiMonitor[]
}

async function getUsers({
  apiKey,
  apiUrl,
}: IFetchShinobiUsers): Promise<IShinobiUser[]> {
  const users: IShinobiUser[] = []

  try {
    const response = await axios.get<{ users: IShinobiUser[] }>(
      `${apiUrl}/super/${apiKey}/accounts/list/admin`,
      {
        headers: { 'Accept-Encoding': 'identity' },
      },
    )

    const { data } = response

    const authenticatedUsers = data.users
      .filter((user) => !!user.auth)
      .map((user) => ({ ...user, apiUrl }))

    const usersNotAuthenticated = data.users.filter((user) => !user.auth)

    if (usersNotAuthenticated.length) {
      const usersAuthenticatedResponse = await Promise.all(
        usersNotAuthenticated.map(async (user) => {
          try {
            const userAuthResponse = await axios.post<IShinobiUserAuth>(
              `${apiUrl}`,
              {
                mail: user.mail,
                pass: process.env.SHINIBI_USER_PASSWORD,
                function: 'dash',
              },
              {
                params: {
                  json: true,
                },

                headers: { 'Accept-Encoding': 'identity' },
              },
            )
            const { $user } = userAuthResponse.data

            if ($user) {
              return {
                ke: $user.ke,
                uid: $user.uid,
                auth: $user.auth_token,
                mail: $user.mail,
                apiUrl,
              }
            }
          } catch (authError) {
            console.error(
              `Authentication error for user "${user.mail}":`,
              authError,
            )
            return undefined
          }
        }),
      )
      users.push(
        ...usersAuthenticatedResponse.filter((user) => user !== undefined),
      )
    }

    return authenticatedUsers
  } catch (err: any) {
    console.error(`Error fetching users from shinobi "${apiUrl}":`, err.cause)
  }

  return users
}

interface StreamProps {
  groupKey: string
  apiKey: string
  apiUrl: string
  cameraId: string
}

interface MonitorProps {
  groupKey: string
  apiKey: string
  apiUrl: string
}

interface EventsProps extends StreamProps {
  start: string
}

async function getCameraStream({
  apiKey,
  apiUrl,
  groupKey,
  cameraId,
}: StreamProps): Promise<string> {
  return new Promise((resolve, reject) => {
    // http://xxx.xxx.xxx.xxx/[API KEY]/hls/[GROUP KEY]/[MONITOR ID]/s.m3u8
    axios
      .get<IShinobiMonitor[]>(
        `${apiUrl}/${apiKey}/monitor/${groupKey}/${cameraId}`,
        {
          headers: { 'Accept-Encoding': 'identity' },
        },
      )
      .then((monitor) => {
        if (monitor.data.length <= 0) {
          reject()
          return
        }

        if (monitor.data[0].status !== 'Watching') {
          reject(JSON.stringify({ monitorStatus: monitor.data[0].status }))
          return
        }

        resolve(`${apiUrl}/${apiKey}/hls/${groupKey}/${cameraId}/s.m3u8`)
      })
      .catch(reject)
  })
}

async function getMonitors({
  apiKey,
  apiUrl,
  groupKey,
}: MonitorProps): Promise<IMonitorsResponse | undefined> {
  try {
    const { data } = await axios.get<IShinobiMonitor[]>(
      `${apiUrl}/${apiKey}/monitor/${groupKey}`,
      {
        headers: { 'Accept-Encoding': 'identity' },
      },
    )

    return {
      apiKey,
      apiUrl,
      monitors: data,
    }
  } catch {
    //
  }
}

// http://xxx.xxx.xxx.xxx/[API KEY]/events/[GROUP KEY]/[MONITOR ID]?start=YYYY-MM-DDTHH:mm:ss
async function getMonitorEvents({
  apiKey,
  apiUrl,
  groupKey,
  cameraId,
  start,
}: EventsProps): Promise<IShinobiCamera[] | undefined> {
  try {
    const { data } = await axios.get<IShinobiCamera[]>(
      `${apiUrl}/${apiKey}/events/${groupKey}/${cameraId}?start=${start}`,
      {
        headers: { 'Accept-Encoding': 'identity' },
      },
    )

    return data
  } catch {
    //
  }
}

interface SetMonitorModeProps {
  groupKey: string
  apiKey: string
  apiUrl: string
  cameraId: string
  mode: 'stop' | 'start' | 'record'
}

// http://xxx.xxx.xxx.xxx/[API KEY]/monitor/[GROUP KEY]/[MONITOR ID]/[MODE]
async function setMonitorMode({
  apiKey,
  apiUrl,
  groupKey,
  cameraId,
  mode,
}: SetMonitorModeProps): Promise<void> {
  try {
    const { data } = await axios.get<IShinobiCamera[]>(
      `${apiUrl}/${apiKey}/monitor/${groupKey}/${cameraId}/${mode}`,
      {
        headers: { 'Accept-Encoding': 'identity' },
      },
    )

    console.log(data)
  } catch {
    //
  }
}

interface GetVideosProps {
  groupKey: string
  apiKey: string
  apiUrl: string
  cameraId: string
  start: Date
}

// http://xxx.xxx.xxx.xxx/[API KEY]/videos/[GROUP KEY]/[MONITOR ID]?start=YYYY-MM-DDTHH:mm:ss
async function getVideos({
  apiKey,
  apiUrl,
  groupKey,
  cameraId,
  start,
}: GetVideosProps): Promise<VideosResponse | undefined> {
  try {
    const { data } = await axios.get<VideosResponse>(
      `${apiUrl}/${apiKey}/videos/${groupKey}/${cameraId}?start=${dayjs(start).format('YYYY-MM-DDTHH:mm:ss')}`,
      {
        headers: { 'Accept-Encoding': 'identity' },
      },
    )

    return data
  } catch {
    //
  }
}

export {
  getUsers,
  getVideos,
  getMonitors,
  getCameraStream,
  getMonitorEvents,
  setMonitorMode,
}
