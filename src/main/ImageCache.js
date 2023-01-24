// cleanup expired images once every 5 mins
const CLEANUP_INTERVAL = 300_000

// images expire after 2 hours if no expiry information is found in the http headers
const FALLBACK_MAX_AGE = 7200

export class ImageCache {
  constructor() {
    this._cache = new Map()

    setInterval(this._cleanup.bind(this), CLEANUP_INTERVAL)
  }

  add(url, mimeType, data, expiry) {
    this._cache.set(url, { mimeType, data, expiry })
  }

  has(url) {
    return this._cache.has(url)
  }

  get(url) {
    const entry = this._cache.get(url)

    if (!entry) {
      // this should never happen as the `has` method should be used to check for the existence first
      throw new Error(`No image cache entry for ${url}`)
    }

    return {
      data: entry.data,
      mimeType: entry.mimeType
    }
  }

  _cleanup() {
    // seconds since 1970-01-01 00:00:00
    const now = Math.trunc(Date.now() / 1000)

    for (const [key, entry] of this._cache.entries()) {
      if (entry.expiry <= now) {
        this._cache.delete(key)
      }
    }
  }
}

/**
 * Extracts the cache expiry timestamp of image from HTTP headers
 * @param {Record<string, string>} headers
 * @returns a timestamp in seconds
 */
export function extractExpiryTimestamp(headers) {
  const maxAgeRegex = /max-age=(\d+)/

  const cacheControl = headers['cache-control']
  if (cacheControl && maxAgeRegex.test(cacheControl)) {
    let maxAge = parseInt(cacheControl.match(maxAgeRegex)[1])

    if (headers.age) {
      maxAge -= parseInt(headers.age)
    }

    // we don't need millisecond precision, so we can store it as seconds to use less memory
    return Math.trunc(Date.now() / 1000) + maxAge
  } else if (headers.expires) {
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Expires

    return Math.trunc(Date.parse(headers.expires) / 1000)
  } else {
    return Math.trunc(Date.now() / 1000) + FALLBACK_MAX_AGE
  }
}
