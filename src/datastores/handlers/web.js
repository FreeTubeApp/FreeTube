import * as baseHandlers from './base'

// TODO: Syncing
// Syncing on the web would involve a different implementation
// to the electron one (obviously)
// One idea would be to use a watcher-like mechanism on
// localStorage or IndexedDB to inform other tabs on the changes
// that have occurred in other tabs
//
// NOTE: NeDB uses `localForage` on the browser
// https://www.npmjs.com/package/localforage

class Settings {
  static find() {
    return baseHandlers.settings.find()
  }

  static upsert(_id, value) {
    return baseHandlers.settings.upsert(_id, value)
  }
}

// For the settings we use the wrapper class to hide some methods only needed in the Electron main process
export { Settings as settings }

// These classes don't require any changes from the base classes, so can be exported as-is.
export { history, profiles, playlists, searchHistory, subscriptionCache } from './base'
