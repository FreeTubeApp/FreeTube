import { spawn } from 'node:child_process'
import { settings } from '../datastores/handlers/base'
import { isFreeTubeUrl } from './utils'

const ID_REGEX = /^[\w-]+$/

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
  const outputDirectory = (await settings._findOne('ytdlpOutputDirectory'))?.value || ''

  /** @type {string} */
  const ffmpegExecutable = (await settings._findOne('ffmpegExecutable'))?.value || ''

  const customArgsSettingId = mode === 'audio' ? 'ytdlpAudioCustomArgs' : 'ytdlpVideoCustomArgs'

  /** @type {string} */
  const customArgs = (await settings._findOne(customArgsSettingId))?.value || ''

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`

  const args = []

  if (outputDirectory.length > 0) {
    args.push('-o', `${outputDirectory}/%(title)s.%(ext)s`)
  }

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

  return new Promise((resolve) => {
    let child

    if (process.platform === 'win32') {
      // cmd /k only strips quotes if they enclose the whole string, so wrap it twice
      const innerCommand = [executable, ...args].map(part => `"${part.replaceAll('"', '""')}"`).join(' ')
      child = spawn('cmd.exe', ['/c', 'start', '""', '/wait', 'cmd.exe', '/k', `"${innerCommand}"`], {
        detached: true,
        stdio: 'ignore',
        windowsVerbatimArguments: true
      })
    } else if (process.platform === 'darwin') {
      child = spawn('open', ['-a', 'Terminal', '-n', '--args', executable, ...args], {
        detached: true,
        stdio: 'ignore'
      })
    } else {
      child = spawn('x-terminal-emulator', ['-e', executable, ...args], {
        detached: true,
        stdio: 'ignore'
      })
    }

    child.once('error', () => {
      resolve('error')
    })

    child.once('spawn', () => {
      child.unref()
      resolve('ok')
    })
  })
}
