import { app } from 'electron'
import { execFile, spawn } from 'node:child_process'
import { access, constants } from 'node:fs/promises'
import { promisify } from 'node:util'
import { settings } from '../datastores/handlers/base'
import { isFreeTubeUrl } from './utils'

const execFileAsync = promisify(execFile)

const ID_REGEX = /^[\w-]+$/

/**
 * @param {string} path
 * @returns {Promise<boolean>}
 */
async function isExecutable(path) {
  try {
    await access(path, constants.X_OK)
    return true
  } catch {
    return false
  }
}

/**
 * @param {string} name
 * @returns {Promise<string | null>}
 */
export async function findExecutableOnPath(name) {
  try {
    const { stdout } = process.platform === 'win32'
      ? await execFileAsync('where', [name])
      : await execFileAsync('which', [name])

    return stdout.split(/\r?\n/)[0].trim() || null
  } catch {
    return null
  }
}

/**
 * @param {string} name
 * @param {string} currentPath
 * @returns {Promise<string | null>}
 */
export async function resolveExecutable(name, currentPath) {
  if (currentPath.length > 0 && await isExecutable(currentPath)) {
    return currentPath
  }

  return findExecutableOnPath(name)
}

/**
 * @param {string} executable
 * @param {string[]} versionArgs
 * @returns {Promise<string | null>}
 */
async function getVersion(executable, versionArgs) {
  if (executable.length === 0 || !await isExecutable(executable)) {
    return null
  }

  try {
    const { stdout } = await execFileAsync(executable, versionArgs)
    return stdout.split(/\r?\n/)[0].trim() || null
  } catch {
    return null
  }
}

/**
 * @param {string} ytdlpExecutable
 * @param {string} ffmpegExecutable
 * @returns {Promise<{ ytdlp: string | null, ffmpeg: string | null }>}
 */
export async function getExecutableVersions(ytdlpExecutable, ffmpegExecutable) {
  const [ytdlp, ffmpeg] = await Promise.all([
    getVersion(ytdlpExecutable, ['--version']),
    getVersion(ffmpegExecutable, ['-version'])
  ])

  const ffmpegVersion = ffmpeg?.match(/ffmpeg version (\S+)/)?.[1] ?? ffmpeg

  return { ytdlp, ffmpeg: ffmpegVersion }
}

/**
 * Terminal emulators to try on Linux, in order, along with how each one
 * expects the command to run to be passed.
 * @type {{ name: string, buildArgs: (executable: string, args: string[]) => string[] }[]}
 */
const LINUX_TERMINALS = [
  { name: 'x-terminal-emulator', buildArgs: (executable, args) => ['-e', executable, ...args] },
  { name: 'gnome-terminal', buildArgs: (executable, args) => ['--', executable, ...args] },
  { name: 'konsole', buildArgs: (executable, args) => ['-e', executable, ...args] },
  { name: 'xfce4-terminal', buildArgs: (executable, args) => ['-x', executable, ...args] },
  { name: 'kitty', buildArgs: (executable, args) => [executable, ...args] },
  { name: 'alacritty', buildArgs: (executable, args) => ['-e', executable, ...args] },
  { name: 'xterm', buildArgs: (executable, args) => ['-e', executable, ...args] },
]

/**
 * @returns {Promise<{ name: string, buildArgs: (executable: string, args: string[]) => string[] } | null>}
 */
async function findLinuxTerminal() {
  for (const terminal of LINUX_TERMINALS) {
    if (await findExecutableOnPath(terminal.name)) {
      return terminal
    }
  }

  return null
}

/**
 * @typedef {'ok' | 'invalid' | 'not-configured' | 'error'} DownloadVideoResult
 */

/**
 * @param {import('electron').IpcMainInvokeEvent} event
 * @param {{ videoId: string, mode: 'video' | 'audio', startTime: number | null | undefined, endTime: number | null | undefined }} payload
 * @returns {Promise<DownloadVideoResult>}
 */
export async function handleDownloadVideo(event, payload) {
  if (!isFreeTubeUrl(event.senderFrame.url) || !event.sender.isFocused()) {
    return 'invalid'
  }

  const { videoId, mode, startTime, endTime } = payload ?? {}

  if (typeof videoId !== 'string' || videoId.length !== 11 || !ID_REGEX.test(videoId)) {
    return 'invalid'
  }

  if (mode !== 'video' && mode !== 'audio') {
    return 'invalid'
  }

  const hasValidStartTime = typeof startTime === 'number' && startTime >= 0
  const hasValidEndTime = typeof endTime === 'number' && endTime > 0

  /** @type {string} */
  const executable = (await settings._findOne('ytdlpExecutable'))?.value || ''

  if (executable.length === 0) {
    return 'not-configured'
  }

  /** @type {string} */
  const outputDirectory = (await settings._findOne('ytdlpOutputDirectory'))?.value || app.getPath('downloads')

  /** @type {string} */
  const ffmpegExecutable = (await settings._findOne('ffmpegExecutable'))?.value || ''

  const customArgsSettingId = mode === 'audio' ? 'ytdlpAudioCustomArgs' : 'ytdlpVideoCustomArgs'

  /** @type {string} */
  const customArgs = (await settings._findOne(customArgsSettingId))?.value || ''

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`

  const args = ['-o', `${outputDirectory}/%(title)s.%(ext)s`]

  if (ffmpegExecutable.length > 0) {
    args.push('--ffmpeg-location', ffmpegExecutable)
  }

  if (hasValidStartTime || hasValidEndTime) {
    const start = hasValidStartTime ? startTime : 0
    const end = hasValidEndTime ? endTime : 'inf'
    args.push('--download-sections', `*${start}-${end}`)
  }

  if (mode === 'audio') {
    args.push('-x')
  }

  if (customArgs.trim().length > 0) {
    args.push(...customArgs.trim().split(/\s+/))
  }

  args.push(videoUrl)

  if (process.platform === 'win32') {
    // cmd /k only strips quotes if they enclose the whole string, so wrap it twice
    const innerCommand = [executable, ...args].map(part => `"${part.replaceAll('"', '""')}"`).join(' ')

    return spawnAndAwait('cmd.exe', ['/c', 'start', '""', '/wait', 'cmd.exe', '/k', `"${innerCommand}"`], {
      windowsVerbatimArguments: true
    })
  }

  if (process.platform === 'darwin') {
    return spawnAndAwait('open', ['-a', 'Terminal', '-n', '--args', executable, ...args])
  }

  const terminal = await findLinuxTerminal()

  if (!terminal) {
    return 'error'
  }

  return spawnAndAwait(terminal.name, terminal.buildArgs(executable, args))
}

/**
 * @param {string} command
 * @param {string[]} args
 * @param {import('node:child_process').SpawnOptionsWithoutStdio} [extraOptions]
 * @returns {Promise<DownloadVideoResult>}
 */
function spawnAndAwait(command, args, extraOptions) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { detached: true, stdio: 'ignore', ...extraOptions })

    child.once('error', () => {
      resolve('error')
    })

    child.once('spawn', () => {
      child.unref()
      resolve('ok')
    })
  })
}
