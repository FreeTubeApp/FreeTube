import baseHandlers from './base'

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

class History {
  static find() {
    return baseHandlers.history.find()
  }

  static search(query) {
    return baseHandlers.history.search(query)
  }

  static upsert(record) {
    return baseHandlers.history.upsert(record)
  }

  static updateWatchProgress(videoId, watchProgress) {
    return baseHandlers.history.updateWatchProgress(videoId, watchProgress)
  }

  static delete(videoId) {
    return baseHandlers.history.delete(videoId)
  }

  static deleteAll() {
    return baseHandlers.history.deleteAll()
  }

  static persist() {
    baseHandlers.history.persist()
  }
}

class Profiles {
  static create(profile) {
    return baseHandlers.profiles.create(profile)
  }

  static find() {
    return baseHandlers.profiles.find()
  }

  static upsert(profile) {
    return baseHandlers.profiles.upsert(profile)
  }

  static delete(id) {
    return baseHandlers.profiles.delete(id)
  }

  static persist() {
    baseHandlers.profiles.persist()
  }
}

class Playlists {
  static create(playlists) {
    return baseHandlers.playlists.create(playlists)
  }

  static find() {
    return baseHandlers.playlists.find()
  }

  static upsertVideoByPlaylistName(playlistName, videoData) {
    return baseHandlers.playlists.upsertVideoByPlaylistName(playlistName, videoData)
  }

  static upsertVideoIdsByPlaylistId(_id, videoIds) {
    return baseHandlers.playlists.upsertVideoIdsByPlaylistId(_id, videoIds)
  }

  static delete(_id) {
    return baseHandlers.playlists.delete(_id)
  }

  static deleteVideoIdByPlaylistName(playlistName, videoId) {
    return baseHandlers.playlists.deleteVideoIdByPlaylistName(playlistName, videoId)
  }

  static deleteVideoIdsByPlaylistName(playlistName, videoIds) {
    return baseHandlers.playlists.deleteVideoIdsByPlaylistName(playlistName, videoIds)
  }

  static deleteAllVideosByPlaylistName(playlistName) {
    return baseHandlers.playlists.deleteAllVideosByPlaylistName(playlistName)
  }

  static deleteMultiple(ids) {
    return baseHandlers.playlists.deleteMultiple(ids)
  }

  static deleteAll() {
    return baseHandlers.playlists.deleteAll()
  }
}

const handlers = {
  settings: Settings,
  history: History,
  profiles: Profiles,
  playlists: Playlists
}

export default handlers
