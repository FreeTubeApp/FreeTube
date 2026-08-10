import { app, BrowserWindow, dialog } from 'electron'
import { execFile, spawn } from 'node:child_process'
import { access, constants } from 'node:fs/promises'
import { normalize } from 'node:path'
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
 * @returns {Promise<{ ytdlp: string | null }>}
 */
export async function getExecutableVersions(ytdlpExecutable) {
  const ytdlp = await getVersion(ytdlpExecutable, ['--version'])

  return { ytdlp }
}

/**
 * Terminal emulators to try on Linux, in order, along with how each one
 * expects the command to run to be passed.
 * @type {{ name: string, buildArgs: (shellCommand: string) => string[] }[]}
 */
const LINUX_TERMINALS = [
  { name: 'x-terminal-emulator', buildArgs: (shellCommand) => ['-e', 'sh', '-c', shellCommand] },
  { name: 'gnome-terminal', buildArgs: (shellCommand) => ['--', 'sh', '-c', shellCommand] },
  { name: 'konsole', buildArgs: (shellCommand) => ['-e', 'sh', '-c', shellCommand] },
  { name: 'xfce4-terminal', buildArgs: (shellCommand) => ['-x', 'sh', '-c', shellCommand] },
  { name: 'kitty', buildArgs: (shellCommand) => ['sh', '-c', shellCommand] },
  { name: 'alacritty', buildArgs: (shellCommand) => ['-e', 'sh', '-c', shellCommand] },
  { name: 'xterm', buildArgs: (shellCommand) => ['-e', 'sh', '-c', shellCommand] },
]

/**
 * @returns {Promise<{ name: string, buildArgs: (shellCommand: string) => string[] } | null>}
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
 * @param {string} path
 * @returns {Promise<boolean>}
 */
async function hasWriteAccess(path) {
  try {
    await access(path, constants.W_OK)
    return true
  } catch {
    return false
  }
}

/**
 * @param {import('electron').WebContents} webContents
 * @param {string | undefined} [defaultPath]
 * @returns {Promise<string | null>}
 */
async function promptForOutputDirectory(webContents, defaultPath) {
  const dialogOptions = {
    defaultPath: typeof defaultPath === 'string' && defaultPath.length > 0 ? defaultPath : app.getPath('downloads'),
    properties: ['openDirectory']
  }

  const window = BrowserWindow.fromWebContents(webContents)
  const result = window
    ? await dialog.showOpenDialog(window, dialogOptions)
    : await dialog.showOpenDialog(dialogOptions)

  if (result.canceled) {
    return null
  }

  return result.filePaths[0]
}

/**
 * @typedef {'ok' | 'invalid' | 'not-configured' | 'disabled' | 'cancelled' | 'error'} DownloadVideoResult
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

  /** @type {boolean} */
  const downloadEnabled = (await settings._findOne('ytdlpDownloadEnabled'))?.value || false

  if (!downloadEnabled) {
    return 'disabled'
  }

  const hasValidStartTime = typeof startTime === 'number' && startTime >= 0
  const hasValidEndTime = typeof endTime === 'number' && endTime > 0

  /** @type {string} */
  const executable = (await settings._findOne('ytdlpExecutable'))?.value || ''

  if (executable.length === 0) {
    return 'not-configured'
  }

  /** @type {string} */
  const downloadMode = (await settings._findOne('ytdlpDownloadMode'))?.value || 'prompt_folder'

  /** @type {string} */
  const storedOutputDirectory = (await settings._findOne('ytdlpOutputDirectory'))?.value || ''

  const canUseStoredDirectory = downloadMode === 'default_folder' && storedOutputDirectory.length > 0 &&
    await hasWriteAccess(normalize(storedOutputDirectory))

  // Either "always ask" mode, or the stored folder is unset/no longer writable
  // (e.g. a Flatpak-portal-granted folder that got revoked) - prompt for one.
  const outputDirectory = canUseStoredDirectory
    ? storedOutputDirectory
    : await promptForOutputDirectory(event.sender, storedOutputDirectory)

  if (!outputDirectory) {
    return 'cancelled'
  }

  const customArgsSettingId = mode === 'audio' ? 'ytdlpAudioCustomArgs' : 'ytdlpVideoCustomArgs'

  /** @type {string} */
  const customArgs = (await settings._findOne(customArgsSettingId))?.value || ''

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`

  const args = ['-o', `${outputDirectory}/%(title)s.%(ext)s`]

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

  const fullCommand = [executable, ...args]

  if (process.platform === 'win32') {
    // echo doesn't parse quotes, so the display line is only quoted where a part has a space
    const displayCommand = fullCommand.map(part => part.includes(' ') ? `"${part}"` : part).join(' ')
    // cmd /k only strips quotes if they enclose the whole string, so wrap it twice
    const runCommand = fullCommand.map(part => `"${part.replaceAll('"', '""')}"`).join(' ')
    const innerCommand = `echo ${displayCommand} && ${runCommand}`

    return spawnAndAwait('cmd.exe', ['/c', 'start', '""', '/wait', 'cmd.exe', '/k', `"${innerCommand}"`], {
      windowsVerbatimArguments: true
    })
  }

  const shellCommand = `echo ${quoteForShellDisplay(fullCommand)} && exec ${quoteForShell(fullCommand)}`

  if (process.platform === 'darwin') {
    const appleScript = `tell application "Terminal" to do script ${quoteForAppleScript(shellCommand)}`
    return spawnAndAwait('osascript', ['-e', appleScript])
  }

  const terminal = await findLinuxTerminal()

  if (!terminal) {
    return 'error'
  }

  return spawnAndAwait(terminal.name, terminal.buildArgs(shellCommand))
}

/**
 * @param {string[]} parts
 * @returns {string}
 */
function quoteForShell(parts) {
  return parts.map(part => `'${part.replaceAll("'", "'\\''")}'`).join(' ')
}

/**
 * @param {string[]} parts
 * @returns {string}
 */
function quoteForShellDisplay(parts) {
  return parts.map(part => part.includes(' ') ? `'${part}'` : part).join(' ')
}

/**
 * @param {string} command
 * @returns {string}
 */
function quoteForAppleScript(command) {
  return `"${command.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`
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
