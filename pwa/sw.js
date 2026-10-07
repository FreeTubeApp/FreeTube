// FreeTube PWA service worker
// pwa/FreeTubePwaPlugin.js prepends the definitions of FT_VERSION and FT_PRECACHE_URLS during the build.
/* global FT_VERSION, FT_PRECACHE_URLS */

const CACHE_PREFIX = 'freetube-'
const PRECACHE = `${CACHE_PREFIX}precache-${FT_VERSION}`
const RUNTIME_CACHE = `${CACHE_PREFIX}runtime-${FT_VERSION}`

const scopeUrl = new URL(self.registration.scope)
const indexUrl = new URL('index.html', scopeUrl).href
const precachedUrls = new Set(FT_PRECACHE_URLS.map(url => new URL(url, scopeUrl).href))

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(PRECACHE)

    // `cache: 'reload'` bypasses the HTTP cache, as not all file names contain a content hash
    await Promise.all([...precachedUrls].map(async (url) => {
      const response = await fetch(url, { cache: 'reload' })

      if (!response.ok) {
        throw new Error(`Failed to precache ${url}: ${response.status}`)
      }

      await cache.put(url, response)
    }))

    // Activate the new version right away, register-sw.js reloads open pages afterwards
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys()

    await Promise.all(
      cacheNames
        .filter(name => name.startsWith(CACHE_PREFIX) && name !== PRECACHE && name !== RUNTIME_CACHE)
        .map(name => caches.delete(name))
    )

    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Leave everything else (Invidious API, thumbnails, video streams, SponsorBlock etc.) to the browser
  if (request.method !== 'GET' || !request.url.startsWith(scopeUrl.href)) {
    return
  }

  if (request.mode === 'navigate') {
    // The app uses hash based routing, so every navigation within the scope loads index.html
    event.respondWith(cacheFirst(indexUrl, request))
    return
  }

  const url = new URL(request.url)
  url.hash = ''

  if (precachedUrls.has(url.href)) {
    event.respondWith(cacheFirst(url.href, request))
  } else {
    event.respondWith(staleWhileRevalidate(event, request))
  }
})

/**
 * @param {string} cacheKey
 * @param {Request} request
 */
async function cacheFirst(cacheKey, request) {
  const cache = await caches.open(PRECACHE)
  const cached = await cache.match(cacheKey)

  return cached ?? fetch(request)
}

/**
 * @param {FetchEvent} event
 * @param {Request} request
 */
async function staleWhileRevalidate(event, request) {
  const cache = await caches.open(RUNTIME_CACHE)
  const cached = await cache.match(request)

  const networkResponse = fetch(request).then(async (response) => {
    if (response.ok && response.type === 'basic') {
      await cache.put(request, response.clone())
    }

    return response
  })

  if (cached) {
    event.waitUntil(networkResponse.catch(() => {}))
    return cached
  }

  return networkResponse
}
