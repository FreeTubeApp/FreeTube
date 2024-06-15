import { IpcChannels } from '../../../constants'

export class PlayerCache {
  async get(key) {
    if (process.env.IS_ELECTRON) {
      const { ipcRenderer } = require('electron')
      return await ipcRenderer.invoke(IpcChannels.PLAYER_CACHE_GET, key)
    }
  }

  async set(key, value) {
    if (process.env.IS_ELECTRON) {
      const { ipcRenderer } = require('electron')
      await ipcRenderer.invoke(IpcChannels.PLAYER_CACHE_SET, key, value)
    }
  }

  async remove(_key) {
    // no-op; YouTube.js only uses remove for the OAuth credentials, but we don't use that in FreeTube
  }
}
