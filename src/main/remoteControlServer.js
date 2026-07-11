import { createServer } from 'http'
import { randomBytes, randomUUID, timingSafeEqual } from 'crypto'
import { networkInterfaces } from 'os'
import { WebSocketServer } from 'ws'

import { IpcChannels } from '../constants'
import { getRemoteControlPageHtml } from './remoteControlPage'

const DEFAULT_PORT = 9482
const REQUEST_TIMEOUT_MS = 15_000
const HEARTBEAT_INTERVAL_MS = 30_000
const MAX_CONCURRENT_SEARCHES_PER_CONNECTION = 3
const MAX_TOTAL_CONNECTIONS = 8
const MAX_TOTAL_PENDING_SEARCHES = 16
const MAX_SEARCH_RESULTS = 20
const VIDEO_ID_REGEX = /^[\w-]{6,32}$/

let httpServer = null
let wss = null
let heartbeatInterval = null
let currentToken = null
let targetWebContents = null
let currentPort = null
/** promise for an in-flight start() call, used to make concurrent start() calls idempotent instead of racing */
let startPromise = null
/** @type {Map<string, { ws: import('ws').WebSocket, clientRequestId: string, timeout: NodeJS.Timeout }>} */
const pendingSearchRequests = new Map()

/**
 * Constant-time-ish token comparison to avoid leaking token contents via response timing.
 * @param {string} a
 * @param {string} b
 */
function tokensMatch(a, b) {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)

  if (bufA.length !== bufB.length) {
    // still perform a compare of equal length to avoid an early-return timing signal
    timingSafeEqual(bufA, bufA)
    return false
  }

  return timingSafeEqual(bufA, bufB)
}

/**
 * @param {string} requestUrl
 * @param {string} host
 */
function parseUrl(requestUrl, host) {
  try {
    return new URL(requestUrl, `http://${host}`)
  } catch {
    return null
  }
}

function getLocalNetworkAddresses() {
  const interfaces = networkInterfaces()
  const addresses = []

  for (const ifaceList of Object.values(interfaces)) {
    for (const iface of ifaceList ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address)
      }
    }
  }

  return addresses
}

export function isRunning() {
  return httpServer !== null
}

/**
 * @param {import('electron').WebContents} webContents
 */
export function isOwner(webContents) {
  return targetWebContents !== null && targetWebContents === webContents
}

/**
 * @param {import('electron').WebContents} webContents
 * @param {number} [preferredPort]
 * @returns {Promise<{ url: string, addresses: string[], port: number }>}
 */
export function start(webContents, preferredPort = DEFAULT_PORT) {
  // Makes concurrent start() calls idempotent instead of racing two `listen()` attempts
  // against each other and corrupting the module-level server/heartbeat state.
  if (startPromise !== null) {
    return startPromise
  }

  if (httpServer !== null) {
    stop()
  }

  startPromise = new Promise((resolve, reject) => {
    targetWebContents = webContents
    currentToken = randomBytes(24).toString('hex')

    const server = createServer((req, res) => handleHttpRequest(req, res))
    httpServer = server

    let started = false

    server.on('error', (err) => {
      if (!started) {
        httpServer = null
        currentToken = null
        targetWebContents = null
        reject(err)
      } else {
        console.error('[remote-control] server error', err)
        stop()
      }
    })

    server.listen(preferredPort, '0.0.0.0', () => {
      started = true
      currentPort = preferredPort

      wss = new WebSocketServer({
        server,
        path: '/ws',
        maxPayload: 8 * 1024,
        verifyClient: ({ req }) => verifyWsClient(req)
      })

      wss.on('connection', (ws) => setupConnection(ws))

      heartbeatInterval = setInterval(() => {
        wss?.clients.forEach((ws) => {
          if (ws.isAlive === false) {
            ws.terminate()
            return
          }

          ws.isAlive = false
          ws.ping()
        })
      }, HEARTBEAT_INTERVAL_MS)

      webContents.once('destroyed', () => stop())

      resolve({
        url: buildConnectionUrl(),
        addresses: getLocalNetworkAddresses(),
        port: currentPort
      })
    })
  }).finally(() => {
    startPromise = null
  })

  return startPromise
}

function buildConnectionUrl() {
  const addresses = getLocalNetworkAddresses()
  const primaryAddress = addresses[0] ?? '127.0.0.1'
  return `http://${primaryAddress}:${currentPort}/?t=${currentToken}`
}

export function stop() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
  }

  for (const { timeout } of pendingSearchRequests.values()) {
    clearTimeout(timeout)
  }
  pendingSearchRequests.clear()

  if (wss) {
    wss.clients.forEach((ws) => ws.terminate())
    wss.close()
    wss = null
  }

  if (httpServer) {
    httpServer.close()
    httpServer = null
  }

  currentToken = null
  targetWebContents = null
  currentPort = null
}

/**
 * @param {import('http').IncomingMessage} req
 */
function verifyWsClient(req) {
  if (!currentToken) {
    return false
  }

  if ((wss?.clients.size ?? 0) >= MAX_TOTAL_CONNECTIONS) {
    return false
  }

  const url = parseUrl(req.url, req.headers.host ?? 'localhost')
  const token = url?.searchParams.get('t')

  if (!token || !tokensMatch(token, currentToken)) {
    return false
  }

  // Browser clients send `Origin`; reject cross-origin pages trying to reuse a leaked token.
  // Non-browser clients (that don't send Origin) are still allowed through, gated by the token itself.
  const origin = req.headers.origin
  if (origin && origin !== `http://${req.headers.host}`) {
    return false
  }

  return true
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
function handleHttpRequest(req, res) {
  if (req.method !== 'GET') {
    res.writeHead(405).end()
    return
  }

  const url = parseUrl(req.url, req.headers.host ?? 'localhost')

  if (url === null || url.pathname !== '/') {
    res.writeHead(404).end()
    return
  }

  const token = url.searchParams.get('t')
  if (!currentToken || !token || !tokensMatch(token, currentToken)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Forbidden')
    return
  }

  const nonce = randomBytes(16).toString('base64')

  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': `default-src 'self'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; img-src https: data:; connect-src 'self'; frame-ancestors 'none'`,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer'
  }).end(getRemoteControlPageHtml(nonce))
}

/**
 * @param {import('ws').WebSocket} ws
 */
function setupConnection(ws) {
  ws.isAlive = true
  ws.pendingSearchCount = 0

  ws.on('pong', () => {
    ws.isAlive = true
  })

  ws.on('message', (data) => handleClientMessage(ws, data))

  ws.on('close', () => {
    for (const [requestId, entry] of pendingSearchRequests) {
      if (entry.ws === ws) {
        clearTimeout(entry.timeout)
        pendingSearchRequests.delete(requestId)
      }
    }
  })

  send(ws, { type: 'connected' })
}

/**
 * @param {import('ws').WebSocket} ws
 * @param {object} payload
 */
function send(ws, payload) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(payload))
  }
}

/**
 * @param {import('ws').WebSocket} ws
 * @param {import('ws').RawData} data
 */
function handleClientMessage(ws, data) {
  if (!targetWebContents || targetWebContents.isDestroyed()) {
    return
  }

  let message
  try {
    message = JSON.parse(data.toString())
  } catch {
    return
  }

  if (typeof message?.type !== 'string') {
    return
  }

  switch (message.type) {
    case 'play':
    case 'pause':
      targetWebContents.send(IpcChannels.REMOTE_CONTROL_COMMAND, { action: message.type })
      break

    case 'volume': {
      const value = Number(message.value)
      if (Number.isFinite(value) && value >= 0 && value <= 100) {
        targetWebContents.send(IpcChannels.REMOTE_CONTROL_COMMAND, { action: 'volume', value })
      }
      break
    }

    case 'seek': {
      const value = Number(message.value)
      if (Number.isFinite(value) && value >= 0) {
        targetWebContents.send(IpcChannels.REMOTE_CONTROL_COMMAND, { action: 'seek', value })
      }
      break
    }

    case 'open': {
      const videoId = message.videoId
      if (typeof videoId === 'string' && VIDEO_ID_REGEX.test(videoId)) {
        targetWebContents.send(IpcChannels.REMOTE_CONTROL_COMMAND, { action: 'open', value: videoId })
      }
      break
    }

    case 'search':
      handleSearchMessage(ws, message)
      break
  }
}

/**
 * @param {import('ws').WebSocket} ws
 * @param {{ query?: string, requestId?: string }} message
 */
function handleSearchMessage(ws, message) {
  const query = typeof message.query === 'string' ? message.query.trim().slice(0, 100) : ''
  const clientRequestId = typeof message.requestId === 'string' ? message.requestId.slice(0, 100) : null

  if (!query || !clientRequestId) {
    return
  }

  if (ws.pendingSearchCount >= MAX_CONCURRENT_SEARCHES_PER_CONNECTION) {
    send(ws, { type: 'searchError', requestId: clientRequestId, message: 'Too many pending searches' })
    return
  }

  if (pendingSearchRequests.size >= MAX_TOTAL_PENDING_SEARCHES) {
    send(ws, { type: 'searchError', requestId: clientRequestId, message: 'Server is busy, try again shortly' })
    return
  }

  ws.pendingSearchCount++

  const serverRequestId = randomUUID()

  const timeout = setTimeout(() => {
    pendingSearchRequests.delete(serverRequestId)
    ws.pendingSearchCount = Math.max(0, ws.pendingSearchCount - 1)
    send(ws, { type: 'searchError', requestId: clientRequestId, message: 'Search timed out' })
  }, REQUEST_TIMEOUT_MS)

  pendingSearchRequests.set(serverRequestId, { ws, clientRequestId, timeout })

  targetWebContents.send(IpcChannels.REMOTE_CONTROL_SEARCH_REQUEST, { requestId: serverRequestId, query })
}

/**
 * Called from the main process IPC handler once the renderer replies to a search request.
 * @param {{ requestId: string, results?: any[], error?: string }} payload
 */
export function resolveSearch({ requestId, results, error }) {
  const entry = pendingSearchRequests.get(requestId)
  if (!entry) {
    return
  }

  clearTimeout(entry.timeout)
  pendingSearchRequests.delete(requestId)
  entry.ws.pendingSearchCount = Math.max(0, entry.ws.pendingSearchCount - 1)

  if (error) {
    send(entry.ws, { type: 'searchError', requestId: entry.clientRequestId, message: String(error).slice(0, 200) })
  } else {
    send(entry.ws, { type: 'searchResults', requestId: entry.clientRequestId, results: sanitizeSearchResults(results) })
  }
}

/**
 * Defense-in-depth: even though only trusted renderer code calls this today, don't trust its
 * shape blindly before forwarding it to a network client — cap the size and strip unknown fields.
 * @param {any[]} results
 */
function sanitizeSearchResults(results) {
  if (!Array.isArray(results)) {
    return []
  }

  return results.slice(0, MAX_SEARCH_RESULTS).map(item => ({
    videoId: typeof item?.videoId === 'string' ? item.videoId.slice(0, 32) : '',
    title: typeof item?.title === 'string' ? item.title.slice(0, 300) : '',
    author: typeof item?.author === 'string' ? item.author.slice(0, 200) : '',
    thumbnail: typeof item?.thumbnail === 'string' && item.thumbnail.startsWith('https://') ? item.thumbnail.slice(0, 500) : ''
  })).filter(item => VIDEO_ID_REGEX.test(item.videoId))
}

/**
 * Called from the main process IPC handler whenever the renderer reports new playback state.
 * @param {object} state
 */
export function broadcastState(state) {
  if (!wss) {
    return
  }

  const payload = { type: 'state', ...state }
  wss.clients.forEach((ws) => send(ws, payload))
}
