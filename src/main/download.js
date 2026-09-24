import { app, BrowserWindow, dialog } from 'electron'
import { execFile, spawn } from 'node:child_process'
import { access, constants } from 'node:fs/promises'
import { normalize } from 'node:path'
import { promisify } from 'node:util'
import { settings } from '../datastores/handlers/base'
import { isFreeTubeUrl } from './utils'

const execFileAsync = promisify(execFile)

// Linux terminal emulators to try in order, with the arguments that go before `sh -c <command>`
const LINUX_TERMINALS = [
  ['x-terminal-emulator', '-e'],
  ['gnome-terminal', '--'],
  ['konsole', '-e'],
  ['xfce4-terminal', '-x'],
  ['kitty'],
  ['alacritty', '-e'],
  ['xterm', '-e'],
]

/**
 * @typedef {'ok' | 'invalid' | 'not-configured' | 'disabled' | 'cancelled' | 'error'} DownloadVideoResult
 */

/**
 * @param {string} settingId
 */
async function getSetting(settingId) {
  return (await settings._findOne(settingId))?.value || ''
}

/**
 * @param {string} path
 * @param {number} mode
 */
async function hasAccess(path, mode) {
  try {
    await access(path, mode)
    return true
  } catch {
    return false
  }
}

/**
 * @param {string} command
 * @param {string[]} args
 * @returns {Promise<string | null>} the first line of the output, or null if the command failed
 */
async function getFirstOutputLine(command, args) {
  try {
    const { stdout } = await execFileAsync(command, args)
    return stdout.split(/\r?\n/)[0].trim() || null
  } catch {
    return null
  }
}

/**
 * @param {string} name
 */
function findExecutableOnPath(name) {
  return getFirstOutputLine(process.platform === 'win32' ? 'where' : 'which', [name])
}

/**
 * @param {string} name
 * @param {string} currentPath
 */
export async function resolveExecutable(name, currentPath) {
  return currentPath && await hasAccess(currentPath, constants.X_OK) ? currentPath : findExecutableOnPath(name)
}

/**
 * @param {string} executable
 */
export async function getVersion(executable) {
  return executable && await hasAccess(executable, constants.X_OK) ? getFirstOutputLine(executable, ['--version']) : null
}

/**
 * @param {import('electron').WebContents} webContents
 * @param {boolean} directory
 * @param {string} currentPath
 * @returns {Promise<string | null>}
 */
export async function choosePath(webContents, directory, currentPath) {
  const dialogOptions = {
    defaultPath: currentPath || (directory ? app.getPath('downloads') : undefined),
    properties: [directory ? 'openDirectory' : 'openFile'],
    ...(!directory && process.platform === 'win32' && {
      filters: [
        { name: 'Executables', extensions: ['exe'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
  }

  const window = BrowserWindow.fromWebContents(webContents)
  const result = window
    ? await dialog.showOpenDialog(window, dialogOptions)
    : await dialog.showOpenDialog(dialogOptions)

  return result.canceled ? null : result.filePaths[0]
}

/**
 * @param {import('electron').IpcMainInvokeEvent} event
 * @param {{ videoId: string, mode: 'video' | 'audio', startTime?: number | null, endTime?: number | null }} payload
 * @returns {Promise<DownloadVideoResult>}
 */
export async function handleDownloadVideo(event, payload) {
  const { videoId, mode, startTime, endTime } = payload ?? {}

  if (
    !isFreeTubeUrl(event.senderFrame.url) || !event.sender.isFocused() ||
    typeof videoId !== 'string' || !/^[\w-]{11}$/.test(videoId) ||
    (mode !== 'video' && mode !== 'audio')
  ) {
    return 'invalid'
  }

  if (!await getSetting('ytdlpDownloadEnabled')) {
    return 'disabled'
  }

  const executable = await getSetting('ytdlpExecutable')

  if (!executable) {
    return 'not-configured'
  }

  // Prompt if set to always ask, or if the saved folder is unset or no longer writable
  // (e.g. a Flatpak-portal-granted folder that got revoked)
  const savedDirectory = await getSetting('ytdlpOutputDirectory')
  const useSavedDirectory = savedDirectory && await getSetting('ytdlpDownloadMode') === 'default_folder' &&
    await hasAccess(normalize(savedDirectory), constants.W_OK)

  const outputDirectory = useSavedDirectory ? savedDirectory : await choosePath(event.sender, true, savedDirectory)

  if (!outputDirectory) {
    return 'cancelled'
  }

  const args = ['-o', `${outputDirectory}/%(title)s.%(ext)s`]

  const hasStartTime = typeof startTime === 'number' && startTime >= 0
  const hasEndTime = typeof endTime === 'number' && endTime > 0

  if (hasStartTime || hasEndTime) {
    args.push('--download-sections', `*${hasStartTime ? startTime : 0}-${hasEndTime ? endTime : 'inf'}`)
  }

  if (mode === 'audio') {
    args.push('-x')
  }

  const customArgs = (await getSetting(mode === 'audio' ? 'ytdlpAudioCustomArgs' : 'ytdlpVideoCustomArgs')).trim()

  if (customArgs) {
    args.push(...customArgs.split(/\s+/))
  }

  const command = [executable, ...args, `https://www.youtube.com/watch?v=${videoId}`]

  if (process.platform === 'win32') {
    // echo doesn't parse quotes, so the displayed command is only quoted where a part has a space
    const displayCommand = command.map(part => part.includes(' ') ? `"${part}"` : part).join(' ')
    const runCommand = command.map(part => `"${part.replaceAll('"', '""')}"`).join(' ')

    // cmd /k only strips quotes if they enclose the whole string, so wrap it once more
    return spawnDetached('cmd.exe', ['/c', 'start', '""', '/wait', 'cmd.exe', '/k', `"echo ${displayCommand} && ${runCommand}"`], {
      windowsVerbatimArguments: true
    })
  }

  const quotedCommand = command.map(part => `'${part.replaceAll("'", "'\\''")}'`).join(' ')
  const shellCommand = `echo ${quotedCommand} && exec ${quotedCommand}`

  if (process.platform === 'darwin') {
    const appleScriptString = shellCommand.replaceAll('\\', '\\\\').replaceAll('"', '\\"')
    return spawnDetached('osascript', ['-e', `tell application "Terminal" to do script "${appleScriptString}"`])
  }

  for (const [terminal, ...terminalArgs] of LINUX_TERMINALS) {
    if (await findExecutableOnPath(terminal)) {
      return spawnDetached(terminal, [...terminalArgs, 'sh', '-c', shellCommand])
    }
  }

  return 'error'
}

/**
 * @param {string} command
 * @param {string[]} args
 * @param {import('node:child_process').SpawnOptions} [extraOptions]
 * @returns {Promise<DownloadVideoResult>}
 */
function spawnDetached(command, args, extraOptions) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { detached: true, stdio: 'ignore', ...extraOptions })

    child.once('error', () => resolve('error'))
    child.once('spawn', () => {
      child.unref()
      resolve('ok')
    })
  })
}
