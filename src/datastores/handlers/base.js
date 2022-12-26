import db from '../index'

class Settings {
  static find() {
    return db.settings.find({ _id: { $ne: 'bounds' } })
  }

  static upsert(_id, value) {
    return db.settings.update({ _id }, { _id, value }, { upsert: true })
  }

  // ******************** //
  // Unique Electron main process handlers
  static _findAppReadyRelatedSettings() {
    return db.settings.find({
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
    return db.settings.findOne({ _id: 'bounds' })
  }

  static _findTheme() {
    return db.settings.findOne({ _id: 'baseTheme' })
  }

  static _findSidenavSettings() {
    return {
      hideTrendingVideos: db.settings.findOne({ _id: 'hideTrendingVideos' }),
      hidePopularVideos: db.settings.findOne({ _id: 'hidePopularVideos' }),
      hidePlaylists: db.settings.findOne({ _id: 'hidePlaylists' }),
    }
  }

  static _updateBounds(value) {
    return db.settings.update({ _id: 'bounds' }, { _id: 'bounds', value }, { upsert: true })
  }
  // ******************** //
}

class History {
  static find() {
    return db.history.find({}).sort({ timeWatched: -1 })
  }

  static upsert(record) {
    return db.history.update({ videoId: record.videoId }, record, { upsert: true })
  }

  static updateWatchProgress(videoId, watchProgress) {
    return db.history.update({ videoId }, { $set: { watchProgress } }, { upsert: true })
  }

  static delete(videoId) {
    return db.history.remove({ videoId })
  }

  static deleteAll() {
    return db.history.remove({}, { multi: true })
  }

  static persist() {
    db.history.persistence.compactDatafile()
  }
}

class Profiles {
  static create(profile) {
    return db.profiles.insert(profile)
  }

  static find() {
    return db.profiles.find({})
  }

  static upsert(profile) {
    return db.profiles.update({ _id: profile._id }, profile, { upsert: true })
  }

  static delete(id) {
    return db.profiles.remove({ _id: id })
  }

  static persist() {
    db.profiles.persistence.compactDatafile()
  }
}

class Playlists {
  static create(playlists) {
    return db.playlists.insert(playlists)
  }

  static find() {
    return db.playlists.find({})
  }

  static upsertVideoByPlaylistName(playlistName, videoData) {
    return db.playlists.update(
      { playlistName },
      { $push: { videos: videoData } },
      { upsert: true }
    )
  }

  static upsertVideoIdsByPlaylistId(_id, videoIds) {
    return db.playlists.update(
      { _id },
      { $push: { videos: { $each: videoIds } } },
      { upsert: true }
    )
  }

  static delete(_id) {
    return db.playlists.remove({ _id, protected: { $ne: true } })
  }

  static deleteVideoIdByPlaylistName(playlistName, videoId) {
    return db.playlists.update(
      { playlistName },
      { $pull: { videos: { videoId } } },
      { upsert: true }
    )
  }

  static deleteVideoIdsByPlaylistName(playlistName, videoIds) {
    return db.playlists.update(
      { playlistName },
      { $pull: { videos: { $in: videoIds } } },
      { upsert: true }
    )
  }

  static deleteAllVideosByPlaylistName(playlistName) {
    return db.playlists.update(
      { playlistName },
      { $set: { videos: [] } },
      { upsert: true }
    )
  }

  static deleteMultiple(ids) {
    return db.playlists.remove({ _id: { $in: ids }, protected: { $ne: true } })
  }

  static deleteAll() {
    return db.playlists.remove({ protected: { $ne: true } })
  }
}

const baseHandlers = {
  settings: Settings,
  history: History,
  profiles: Profiles,
  playlists: Playlists
}

export default baseHandlers
