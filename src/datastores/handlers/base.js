import db from '../index'

class Settings {
  static find() {
    return db.settings.findAsync({ _id: { $ne: 'bounds' } })
  }

  static upsert(_id, value) {
    return db.settings.updateAsync({ _id }, { _id, value }, { upsert: true })
  }

  static persist() {
    return db.settings.compactDatafileAsync()
  }

  // ******************** //
  // Unique Electron main process handlers
  static _findAppReadyRelatedSettings() {
    return db.settings.findAsync({
      $or: [
        { _id: 'disableSmoothScrolling' },
        { _id: 'useProxy' },
        { _id: 'proxyProtocol' },
        { _id: 'proxyHostname' },
        { _id: 'proxyPort' }
      ]
    })
  }

  static _findBounds() {
    return db.settings.findOneAsync({ _id: 'bounds' })
  }

  static _findTheme() {
    return db.settings.findOneAsync({ _id: 'baseTheme' })
  }

  static _findSidenavSettings() {
    return {
      hideTrendingVideos: db.settings.findOneAsync({ _id: 'hideTrendingVideos' }),
      hidePopularVideos: db.settings.findOneAsync({ _id: 'hidePopularVideos' }),
      backendFallback: db.settings.findOneAsync({ _id: 'backendFallback' }),
      backendPreference: db.settings.findOneAsync({ _id: 'backendPreference' }),
      hidePlaylists: db.settings.findOneAsync({ _id: 'hidePlaylists' }),
    }
  }

  static _updateBounds(value) {
    return db.settings.updateAsync({ _id: 'bounds' }, { _id: 'bounds', value }, { upsert: true })
  }
  // ******************** //
}

class History {
  static find() {
    return db.history.findAsync({}).sort({ timeWatched: -1 })
  }

  static upsert(record) {
    return db.history.updateAsync({ videoId: record.videoId }, record, { upsert: true })
  }

  static updateWatchProgress(videoId, watchProgress) {
    return db.history.updateAsync({ videoId }, { $set: { watchProgress } }, { upsert: true })
  }

  static updateLastViewedPlaylist(videoId, lastViewedPlaylistId) {
    return db.history.updateAsync({ videoId }, { $set: { lastViewedPlaylistId } }, { upsert: true })
  }

  static delete(videoId) {
    return db.history.removeAsync({ videoId })
  }

  static deleteAll() {
    return db.history.removeAsync({}, { multi: true })
  }

  static persist() {
    return db.history.compactDatafileAsync()
  }
}

class Profiles {
  static create(profile) {
    return db.profiles.insertAsync(profile)
  }

  static find() {
    return db.profiles.findAsync({})
  }

  static upsert(profile) {
    return db.profiles.updateAsync({ _id: profile._id }, profile, { upsert: true })
  }

  static delete(id) {
    return db.profiles.removeAsync({ _id: id })
  }

  static persist() {
    return db.profiles.compactDatafileAsync()
  }
}

class Playlists {
  static create(playlists) {
    return db.playlists.insertAsync(playlists)
  }

  static find() {
    return db.playlists.findAsync({})
  }

  static upsertVideoByPlaylistName(playlistName, videoData) {
    return db.playlists.updateAsync(
      { playlistName },
      { $push: { videos: videoData } },
      { upsert: true }
    )
  }

  static upsertVideoIdsByPlaylistId(_id, videoIds) {
    return db.playlists.updateAsync(
      { _id },
      { $push: { videos: { $each: videoIds } } },
      { upsert: true }
    )
  }

  static delete(_id) {
    return db.playlists.removeAsync({ _id, protected: { $ne: true } })
  }

  static deleteVideoIdByPlaylistName(playlistName, videoId) {
    return db.playlists.updateAsync(
      { playlistName },
      { $pull: { videos: { videoId } } },
      { upsert: true }
    )
  }

  static deleteVideoIdsByPlaylistName(playlistName, videoIds) {
    return db.playlists.updateAsync(
      { playlistName },
      { $pull: { videos: { $in: videoIds } } },
      { upsert: true }
    )
  }

  static deleteAllVideosByPlaylistName(playlistName) {
    return db.playlists.updateAsync(
      { playlistName },
      { $set: { videos: [] } },
      { upsert: true }
    )
  }

  static deleteMultiple(ids) {
    return db.playlists.removeAsync({ _id: { $in: ids }, protected: { $ne: true } })
  }

  static deleteAll() {
    return db.playlists.removeAsync({ protected: { $ne: true } })
  }

  static persist() {
    return db.playlists.compactDatafileAsync()
  }
}

function compactAllDatastores() {
  return Promise.allSettled([
    Settings.persist(),
    History.persist(),
    Profiles.persist(),
    Playlists.persist()
  ])
}

const baseHandlers = {
  settings: Settings,
  history: History,
  profiles: Profiles,
  playlists: Playlists,

  compactAllDatastores
}

export default baseHandlers
