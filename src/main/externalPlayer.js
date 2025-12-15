import { spawn } from 'node:child_process'
import { join } from 'node:path'
import { readFile } from 'node:fs/promises'
import { settings } from '../datastores/handlers/base'
import { isFreeTubeUrl } from './utils'
import { IpcChannels, UnsupportedPlayerActions } from '../constants'

/**
 * @typedef ExternalPlayerPayload
 * @property {string | undefined | null} [videoId]
 * @property {string | undefined | null} [playlistId]
 * @property {number | undefined | null} [startTime]
 * @property {number | undefined | null} [playbackRate]
 * @property {number | undefined | null} [playlistIndex]
 * @property {boolean | undefined | null} [playlistReverse]
 * @property {boolean | undefined | null} [playlistShuffle]
 * @property {boolean | undefined | null} [playlistLoop]
 */

/**
 * @typedef CmdArgs
 * @property {string} defaultExecutable
 * @property {string[] | null} defaultCustomArguments
 * @property {string} videoUrl
 * @property {string | null} playlistUrl
 * @property {string | null} startOffset
 * @property {string | null} playbackRate
 * @property {string | null} playlistIndex
 * @property {string | null} playlistReverse
 * @property {string | null} playlistShuffle
 * @property {string | null} playlistLoop
 */

const ID_REGEX = /^[\w-]+$/

/** @type {Map<string, CmdArgs>} */
const externalPlayerCmdArgs = new Map()

/**
 * @param {import('electron').IpcMainEvent} event
 * @param {ExternalPlayerPayload} payload
 */
export async function handleOpenInExternalPlayer(event, payload) {
  if (!isFreeTubeUrl(event.senderFrame.url) || !event.sender.isFocused()) {
    return
  }

  const hasValidVideoId = typeof payload.videoId === 'string' && payload.videoId.length === 11 && ID_REGEX.test(payload.videoId)
  const hasValidPlaylistId = typeof payload.playlistId === 'string' && payload.playlistId.length > 2 && ID_REGEX.test(payload.playlistId)

  if (!hasValidVideoId && !hasValidPlaylistId) {
    return
  }

  /** @type {string} */
  const externalPlayer = (await settings._findOne('externalPlayer'))?.value || ''

  // External player setting not set or set to "none"
  if (externalPlayer === '') {
    return
  }

  if (externalPlayerCmdArgs.size === 0) {
    await loadExternalPlayerData()
  }

  const cmdArgs = externalPlayerCmdArgs.get(externalPlayer)

  if (cmdArgs === undefined) {
    return
  }

  const args = []
  /** @type {import('../constants').UnsupportedPlayerAction[]} */
  const unsupportedActions = []

  /** @type {boolean} */
  const ignoreWarnings = (await settings._findOne('externalPlayerIgnoreWarnings'))?.value || false

  /** @type {boolean} */
  const ignoreDefaultArgs = (await settings._findOne('externalPlayerIgnoreDefaultArgs'))?.value || false

  /** @type {string[] | string} */
  const customArgs = (await settings._findOne('externalPlayerCustomArgs'))?.value || '[]'

  if (typeof customArgs === 'string' && customArgs !== '[]') {
    args.push(...JSON.parse(customArgs))
  } else if (!ignoreDefaultArgs && Array.isArray(cmdArgs.defaultCustomArguments)) {
    args.push(...cmdArgs.defaultCustomArguments)
  }

  if (ignoreDefaultArgs) {
    if (hasValidVideoId) {
      args.push(`${cmdArgs.videoUrl}https://www.youtube.com/watch?v=${payload.videoId}`)
    }
  } else {
    if (typeof payload.startTime === 'number' && payload.startTime > 0) {
      if (typeof cmdArgs.startOffset === 'string') {
        if (cmdArgs.defaultExecutable.startsWith('mpc')) {
          // For mpc-hc and mpc-be, which require startOffset to be in milliseconds
          args.push(cmdArgs.startOffset, 1000 * Math.trunc(payload.startTime))
        } else if (cmdArgs.startOffset.endsWith('=')) {
          // For players using `=` in arguments
          // e.g. vlc --start-time=xxxxx
          args.push(`${cmdArgs.startOffset}${payload.startTime}`)
        } else {
          // For players using space in arguments
          // e.g. smplayer -start xxxxx
          args.push(cmdArgs.startOffset, Math.trunc(payload.startTime))
        }
      } else if (!ignoreWarnings) {
        unsupportedActions.push(UnsupportedPlayerActions.STARTING_VIDEO_AT_OFFSET)
      }
    }

    if (typeof payload.playbackRate === 'number' && payload.playbackRate > 0) {
      if (typeof cmdArgs.playbackRate === 'string') {
        args.push(`${cmdArgs.playbackRate}${payload.playbackRate}`)
      } else if (!ignoreWarnings) {
        unsupportedActions.push(UnsupportedPlayerActions.PLAYBACK_RATE)
      }
    }

    // Check whether the video is in a playlist
    if (hasValidPlaylistId && typeof cmdArgs.playlistUrl === 'string') {
      if (typeof payload.playlistIndex === 'number' && payload.playlistIndex >= 0) {
        if (typeof cmdArgs.playlistIndex === 'string') {
          args.push(`${cmdArgs.playlistIndex}${payload.playlistIndex}`)
        } else if (!ignoreWarnings) {
          unsupportedActions.push(UnsupportedPlayerActions.PLAYLIST_SPECIFIC_VIDEO)
        }
      }

      if (payload.playlistReverse) {
        if (typeof cmdArgs.playlistReverse === 'string') {
          args.push(cmdArgs.playlistReverse)
        } else if (!ignoreWarnings) {
          unsupportedActions.push(UnsupportedPlayerActions.PLAYLIST_REVERSE)
        }
      }

      if (payload.playlistShuffle) {
        if (typeof cmdArgs.playlistShuffle === 'string') {
          args.push(cmdArgs.playlistShuffle)
        } else if (!ignoreWarnings) {
          unsupportedActions.push(UnsupportedPlayerActions.PLAYLIST_SHUFFLE)
        }
      }

      if (payload.playlistLoop) {
        if (typeof cmdArgs.playlistLoop === 'string') {
          args.push(cmdArgs.playlistLoop)
        } else if (!ignoreWarnings) {
          unsupportedActions.push(UnsupportedPlayerActions.PLAYLIST_LOOP)
        }
      }

      // If the player supports opening playlists but not indexes, send only the video URL if an index is specified
      if (cmdArgs.playlistIndex == null && typeof payload.playlistIndex === 'number') {
        args.push(`${cmdArgs.videoUrl}https://youtube.com/watch?v=${payload.videoId}`)
      } else {
        args.push(`${cmdArgs.playlistUrl}https://youtube.com/playlist?list=${payload.playlistId}`)
      }
    } else {
      if (hasValidPlaylistId && !ignoreWarnings) {
        unsupportedActions.push(UnsupportedPlayerActions.OPENING_PLAYLISTS)
      }

      if (hasValidVideoId) {
        args.push(`${cmdArgs.videoUrl}https://www.youtube.com/watch?v=${payload.videoId}`)
      }
    }
  }

  event.reply(
    IpcChannels.OPEN_IN_EXTERNAL_PLAYER_RESULT,
    externalPlayer,
    unsupportedActions,
    hasValidPlaylistId
  )

  /** @type {string} */
  const externalPlayerExecutable = (await settings._findOne('externalPlayerExecutable'))?.value || ''

  const executable = externalPlayerExecutable.length > 0 ? externalPlayerExecutable : cmdArgs.defaultExecutable

  const child = spawn(executable, args, { detached: true, stdio: 'ignore' })
  child.unref()
}

async function loadExternalPlayerData() {
  const path = process.env.NODE_ENV === 'development'
    ? '../../static/external-player-map.json'
    : 'static/external-player-map.json'

  const json = JSON.parse(await readFile(join(__dirname, path)))

  for (const entry of json) {
    if (entry.value.length > 0) {
      externalPlayerCmdArgs.set(entry.value, entry.cmdArguments)
    }
  }
}
