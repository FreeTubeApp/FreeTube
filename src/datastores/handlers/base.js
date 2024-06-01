import * as db from '../index'

/* Mapping of older settings whose variable names have changed to their newer values */
const outdatedSettings = {
  defaultTheatreMode: 'defaultTheaterMode',
  playNextVideo: 'enableAutoplay',
  autoplayPlaylists: 'enablePlaylistAutoplay',
  hideUnsubscribeButton: 'hideSubscribeButton',
  autoplayVideos: 'startVideosAutomatically'
}

class Settings {
  static async find() {
    const settings = await db.settings.findAsync({ _id: { $ne: 'bounds' } })
    // Apply existing values of outdated setting variables in the DB to their newer equivalents,
    // then delete those older settings
    const parseableSettings = {}
    settings.forEach(({ _id, value }) => { parseableSettings[_id] = value })
    for (const outdatedSetting of Object.keys(outdatedSettings)) {
      const outdatedSettingInDB = parseableSettings[outdatedSetting]
      if (!outdatedSettingInDB) {
        return
      }

      const newSettingId = outdatedSettings[outdatedSetting]
      const outdatedSettingValue = outdatedSettingInDB[1]
      await this.upsert(newSettingId, outdatedSettingValue)
      await this.delete(outdatedSetting)
    }

    return settings
  }

  static upsert(_id, value) {
    return db.settings.updateAsync({ _id }, { _id, value }, { upsert: true })
  }

  static persist() {
    return db.settings.compactDatafileAsync()
  }

  static delete(setting) {
    return db.settings.removeAsync({ _id: setting })
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

  static persist() {
    return db.playlists.compactDatafileAsync()
  }
}

function compactAllDatastores() {
  return Promise.allSettled([
    Settings.persist(),
    History.persist(),
    Profiles.persist(),
    Playlists.persist(),
  ])
}

export {
  Settings as settings,
  History as history,
  Profiles as profiles,
  Playlists as playlists,

  compactAllDatastores,
}
