import { getLocalSearchResults } from './api/local'
import { getInvidiousSearchResults } from './api/invidious'
import store from '../store/index'

const STATE_REPORT_MIN_INTERVAL_MS = 500
const LOCAL_THUMBNAIL_BASE_URL = 'https://i.ytimg.com'

/** @type {{ play: () => void, pause: () => void, setVolume: (v: number) => void, seek: (s: number) => void } | null} */
let activePlayer = null

let router_ = null
let initialized = false
let serverRunning = false

let lastStateReportTime = 0

/**
 * Wires up the IPC listeners for remote-control commands and search requests.
 * Safe to call once during app startup (Electron only).
 * @param {import('vue-router').Router} router
 */
export function initRemoteControl(router) {
  if (initialized || !process.env.IS_ELECTRON) {
    return
  }

  initialized = true
  router_ = router

  window.ftElectron.handleRemoteControlCommand(handleCommand)
  window.ftElectron.handleRemoteControlSearchRequest(handleSearchRequest)
}

/**
 * @returns {boolean} whether the remote control server was started via {@linkcode startRemoteControlServer}
 */
export function isRemoteControlRunning() {
  return serverRunning
}

/**
 * Starts the remote control server and remembers that it's running, so
 * {@linkcode reportState} knows whether it's worth reporting state at all.
 * @returns {Promise<{ url: string, addresses: string[], port: number }>}
 */
export async function startRemoteControlServer() {
  const result = await window.ftElectron.startRemoteControlServer()
  serverRunning = true
  return result
}

export function stopRemoteControlServer() {
  window.ftElectron.stopRemoteControlServer()
  serverRunning = false
}

/**
 * @param {{ play: () => void, pause: () => void, setVolume: (v: number) => void, seek: (s: number) => void }} adapter
 */
export function registerActivePlayer(adapter) {
  activePlayer = adapter
}

/**
 * @param {object} adapter the same adapter instance previously passed to {@linkcode registerActivePlayer}
 */
export function unregisterActivePlayer(adapter) {
  if (activePlayer === adapter) {
    activePlayer = null
  }
}

/**
 * Reports the current playback state to any connected remotes.
 * Discrete events (loaded/play/pause) should pass `immediate: true`;
 * continuous updates (timeupdate) are throttled to avoid flooding the IPC/WS channels.
 * @param {object} state
 * @param {{ immediate?: boolean }} [options]
 */
export function reportState(state, options = {}) {
  if (!process.env.IS_ELECTRON || !window.ftElectron || !serverRunning) {
    return
  }

  const now = Date.now()
  if (!options.immediate && now - lastStateReportTime < STATE_REPORT_MIN_INTERVAL_MS) {
    return
  }

  lastStateReportTime = now
  window.ftElectron.sendRemoteControlState(state)
}

/**
 * Applies a command received from a connected remote to the currently active player,
 * or navigates to a new video for the 'open' action.
 * @param {{ action: string, value?: string|number }} command
 */
function handleCommand(command) {
  switch (command.action) {
    case 'play':
      activePlayer?.play()
      break
    case 'pause':
      activePlayer?.pause()
      break
    case 'fullscreen':
      window.ftElectron.requestFullscreen()
      break
    case 'volume':
      if (typeof command.value === 'number') {
        activePlayer?.setVolume(command.value)
      }
      break
    case 'seek':
      if (typeof command.value === 'number') {
        activePlayer?.seek(command.value)
      }
      break
    case 'open':
      if (typeof command.value === 'string' && router_) {
        router_.push(`/watch/${command.value}`)
      }
      break
  }
}

/**
 * @param {string} requestId
 * @param {string} query
 */
async function handleSearchRequest(requestId, query) {
  try {
    const results = await performSearch(query)
    window.ftElectron.sendRemoteControlSearchResult(requestId, results, undefined)
  } catch (error) {
    console.error('[remote-control] search failed', error)
    window.ftElectron.sendRemoteControlSearchResult(requestId, undefined, 'Search failed')
  }
}

/**
 * @param {string} query
 * @returns {Promise<{ videoId: string, title: string, author: string, thumbnail: string }[]>}
 */
async function performSearch(query) {
  const backendPreference = store.getters.getBackendPreference

  if (backendPreference === 'invidious') {
    const results = await getInvidiousSearchResults(query, 1, {
      prioritize: 'relevance',
      time: '',
      duration: '',
      type: 'video',
      features: []
    })

    return (results ?? [])
      .filter(item => item.type === 'video')
      .slice(0, 20)
      .map(mapInvidiousResult)
  }

  const { results } = await getLocalSearchResults(query, {}, store.getters.getShowFamilyFriendlyOnly)

  return results
    .filter(item => item.type === 'video')
    .slice(0, 20)
    .map(mapLocalResult)
}

/**
 * Reduces a local-API video result to the safe subset of fields the remote page needs.
 * @param {object} item
 * @returns {{ videoId: string, title: string, author: string, thumbnail: string }}
 */
function mapLocalResult(item) {
  return {
    videoId: item.videoId,
    title: item.title ?? '',
    author: item.author ?? '',
    thumbnail: `${LOCAL_THUMBNAIL_BASE_URL}/vi/${item.videoId}/mqdefault.jpg`
  }
}

/**
 * Reduces an Invidious-API video result to the safe subset of fields the remote page needs.
 * @param {object} item
 * @returns {{ videoId: string, title: string, author: string, thumbnail: string }}
 */
function mapInvidiousResult(item) {
  const thumbnail = item.videoThumbnails?.find(t => t.quality === 'medium') ?? item.videoThumbnails?.[0]

  return {
    videoId: item.videoId,
    title: item.title ?? '',
    author: item.author ?? '',
    thumbnail: thumbnail?.url ?? ''
  }
}
