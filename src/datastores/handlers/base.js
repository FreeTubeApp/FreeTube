import * as db from '../index'

class Settings {
  static find() {
    return db.settings.findAsync({ _id: { $ne: 'bounds' } })
  }

  static upsert(_id, value) {
    return db.settings.updateAsync({ _id }, { _id, value }, { upsert: true })
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

  static updateLastViewedPlaylist(videoId, lastViewedPlaylistId, lastViewedPlaylistType, lastViewedPlaylistItemId) {
    return db.history.updateAsync({ videoId }, { $set: { lastViewedPlaylistId, lastViewedPlaylistType, lastViewedPlaylistItemId } }, { upsert: true })
  }

  static delete(videoId) {
    return db.history.removeAsync({ videoId })
  }

  static deleteAll() {
    return db.history.removeAsync({}, { multi: true })
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
}

class Playlists {
  static create(playlists) {
    return db.playlists.insertAsync(playlists)
  }

  static find() {
    return db.playlists.findAsync({})
  }

  static upsert(playlist) {
    return db.playlists.updateAsync({ _id: playlist._id }, { $set: playlist }, { upsert: true })
  }

  static upsertVideoByPlaylistId(_id, videoData) {
    return db.playlists.updateAsync(
      { _id },
      { $push: { videos: videoData } },
      { upsert: true }
    )
  }

  static upsertVideosByPlaylistId(_id, videos) {
    return db.playlists.updateAsync(
      { _id },
      { $push: { videos: { $each: videos } } },
      { upsert: true }
    )
  }

  static delete(_id) {
    return db.playlists.removeAsync({ _id, protected: { $ne: true } })
  }

  static deleteVideoIdByPlaylistId({ _id, videoId, playlistItemId }) {
    if (playlistItemId != null) {
      return db.playlists.updateAsync(
        { _id },
        { $pull: { videos: { playlistItemId } } },
        { upsert: true }
      )
    } else if (videoId != null) {
      return db.playlists.updateAsync(
        { _id },
        { $pull: { videos: { videoId } } },
        { upsert: true }
      )
    } else {
      throw new Error(`Both videoId & playlistItemId are absent, _id: ${_id}`)
    }
  }

  static deleteVideoIdsByPlaylistId(_id, videoIds) {
    return db.playlists.updateAsync(
      { _id },
      { $pull: { videos: { videoId: { $in: videoIds } } } },
      { upsert: true }
    )
  }

  static deleteAllVideosByPlaylistId(_id) {
    return db.playlists.updateAsync(
      { _id },
      { $set: { videos: [] } },
      { upsert: true }
    )
  }

  static deleteMultiple(ids) {
    return db.playlists.removeAsync({ _id: { $in: ids }, protected: { $ne: true } })
  }

  static deleteAll() {
    return db.playlists.removeAsync({}, { multi: true })
  }
}

class SearchHistory {
  static create(pageBookmark) {
    return db.searchHistory.insertAsync(pageBookmark)
  }

  static find() {
    return db.searchHistory.findAsync({})
  }

  static upsert(pageBookmark) {
    return db.searchHistory.updateAsync({ _id: pageBookmark._id }, pageBookmark, { upsert: true })
  }

  static delete(_id) {
    return db.searchHistory.removeAsync({ _id: _id })
  }

  static deleteMultiple(ids) {
    return db.searchHistory.removeAsync({ _id: { $in: ids } })
  }

  static deleteAll() {
    return db.searchHistory.removeAsync({}, { multi: true })
  }
}

function compactAllDatastores() {
  return Promise.allSettled([
    db.settings.compactDatafileAsync(),
    db.history.compactDatafileAsync(),
    db.profiles.compactDatafileAsync(),
    db.playlists.compactDatafileAsync(),
    db.searchHistory.compactDatafileAsync()
  ])
}

export {
  Settings as settings,
  History as history,
  Profiles as profiles,
  Playlists as playlists,
  SearchHistory as searchHistory,

  compactAllDatastores,
}
