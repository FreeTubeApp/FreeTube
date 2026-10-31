import store from '../store/index'

const CACHE_TTL = 6 * 60 * 60 * 1000
const FAILURE_CACHE_TTL = 5 * 60 * 1000
const MAX_CACHE_SIZE = 1000
const MAX_CONCURRENT_REQUESTS = 4
const REQUEST_TIMEOUT = 10000
const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/

/** @type {Map<string, { data: OriginalVideoMetadata | null, expires: number }>} */
const cache = new Map()

/** @type {Map<string, Promise<OriginalVideoMetadata | null>>} */
const pendingRequests = new Map()

/** @type {{ videoId: string, resolve: (value: OriginalVideoMetadata | null) => void }[]} */
const requestQueue = []

let activeRequests = 0

/**
 * @typedef {object} OriginalVideoMetadata
 * @property {string} title
 * @property {string | null} author
 * @property {string | null} thumbnail
 */

/**
 * Whether original metadata should currently be used.
 * oEmbed requests go through the renderer's fetch implementation, so the
 * configured Electron session proxy is used automatically.
 * @returns {boolean}
 */
export function isOriginalMetadataEnabled() {
  return !!process.env.SUPPORTS_LOCAL_API &&
    store.getters.getPreferOriginalMetadata &&
    store.getters.getBackendPreference === 'local'
}

/**
 * @param {string} url
 * @returns {string}
 */
function normalizeThumbnailUrl(url) {
  // oEmbed returns a 4:3 hqdefault image. FreeTube's cards use 16:9 images.
  return url.replace(/\/(?:hq|sd)default\.(jpg|webp)$/i, '/mqdefault.$1')
}

/**
 * @param {string} videoId
 * @returns {Promise<OriginalVideoMetadata | null>}
 */
async function fetchOriginalVideoMetadata(videoId) {
  const url = new URL('https://www.youtube.com/oembed')
  url.searchParams.set('url', `https://www.youtube.com/watch?v=${videoId}`)
  url.searchParams.set('format', 'json')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    const response = await fetch(url, { signal: controller.signal })

    if (!response.ok) {
      throw new Error(`oEmbed request failed with status ${response.status}`)
    }

    const data = await response.json()

    if (typeof data?.title !== 'string' || data.title.length === 0) {
      throw new Error('oEmbed response has no title')
    }

    return {
      title: data.title,
      author: typeof data.author_name === 'string' ? data.author_name : null,
      thumbnail: typeof data.thumbnail_url === 'string' ? normalizeThumbnailUrl(data.thumbnail_url) : null
    }
  } finally {
    clearTimeout(timeout)
  }
}

function drainQueue() {
  while (activeRequests < MAX_CONCURRENT_REQUESTS && requestQueue.length > 0) {
    const { videoId, resolve } = requestQueue.shift()

    if (!isOriginalMetadataEnabled()) {
      pendingRequests.delete(videoId)
      resolve(null)
      continue
    }

    activeRequests++

    fetchOriginalVideoMetadata(videoId)
      .catch((error) => {
        console.warn('Failed to retrieve original YouTube metadata', videoId, error)
        return null
      })
      .then((data) => {
        if (cache.size >= MAX_CACHE_SIZE) {
          cache.delete(cache.keys().next().value)
        }

        cache.set(videoId, {
          data,
          expires: Date.now() + (data === null ? FAILURE_CACHE_TTL : CACHE_TTL)
        })

        pendingRequests.delete(videoId)
        resolve(data)
      })
      .finally(() => {
        activeRequests--
        drainQueue()
      })
  }
}

/**
 * @param {string} videoId
 * @returns {Promise<OriginalVideoMetadata | null>}
 */
export function getOriginalVideoMetadata(videoId) {
  if (!isOriginalMetadataEnabled() || !VIDEO_ID_REGEX.test(videoId)) {
    return Promise.resolve(null)
  }

  const cached = cache.get(videoId)

  if (cached !== undefined && cached.expires > Date.now()) {
    return Promise.resolve(cached.data)
  }

  const pending = pendingRequests.get(videoId)

  if (pending !== undefined) {
    return pending
  }

  const request = new Promise((resolve) => {
    requestQueue.push({ videoId, resolve })
    drainQueue()
  })

  pendingRequests.set(videoId, request)

  return request
}
