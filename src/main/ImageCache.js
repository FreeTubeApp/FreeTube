export class ImageCache {
  constructor() {
    this._cache = new Map()

    // cleanup expired images once every 5 mins
    setInterval(this._cleanup.bind(this), 300_000)
  }

  add(url, mimeType, data, expires) {
    const expiry = Math.trunc(Date.now() / 1000) + expires
    this._cache.set(url, { mimeType: mimeType, data, expiry })
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
    const now = Date.now()

    for (const [key, entry] of this._cache.entries()) {
      if (entry.expiry * 1000 <= now) {
        this._cache.delete(key)
      }
    }
  }
}
