export class PlayerCache {
  async get(key) {
    return await window.ftElectron.playerCacheGet(key)
  }

  async set(key, value) {
    await window.ftElectron.playerCacheSet(key, value)
  }

  async remove(_key) {
    // no-op; YouTube.js only uses remove for the OAuth credentials, but we don't use that in FreeTube
  }
}
