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

class History {
  static find() {
    return baseHandlers.history.find()
  }

  static upsert(record) {
    return baseHandlers.history.upsert(record)
  }

  static updateWatchProgress(videoId, watchProgress) {
    return baseHandlers.history.updateWatchProgress(videoId, watchProgress)
  }

  static updateLastViewedPlaylist(videoId, lastViewedPlaylistId, lastViewedPlaylistType, lastViewedPlaylistItemId) {
    return baseHandlers.history.updateLastViewedPlaylist(videoId, lastViewedPlaylistId, lastViewedPlaylistType, lastViewedPlaylistItemId)
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

  static upsert(playlist) {
    return baseHandlers.playlists.upsert(playlist)
  }

  static upsertVideoByPlaylistId(_id, videoData) {
    return baseHandlers.playlists.upsertVideoByPlaylistId(_id, videoData)
  }

  static upsertVideosByPlaylistId(_id, videoData) {
    return baseHandlers.playlists.upsertVideosByPlaylistId(_id, videoData)
  }

  static delete(_id) {
    return baseHandlers.playlists.delete(_id)
  }

  static deleteVideoIdByPlaylistId({ _id, videoId, playlistItemId }) {
    return baseHandlers.playlists.deleteVideoIdByPlaylistId({ _id, videoId, playlistItemId })
  }

  static deleteVideoIdsByPlaylistId(_id, videoIds) {
    return baseHandlers.playlists.deleteVideoIdsByPlaylistId(_id, videoIds)
  }

  static deleteAllVideosByPlaylistId(_id) {
    return baseHandlers.playlists.deleteAllVideosByPlaylistId(_id)
  }

  static deleteMultiple(ids) {
    return baseHandlers.playlists.deleteMultiple(ids)
  }

  static deleteAll() {
    return baseHandlers.playlists.deleteAll()
  }
}

export {
  Settings as settings,
  History as history,
  Profiles as profiles,
  Playlists as playlists
}
