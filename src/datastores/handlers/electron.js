import { ipcRenderer } from 'electron'
import { IpcChannels, DBActions } from '../../constants'

class Settings {
  static find() {
    return ipcRenderer.invoke(
      IpcChannels.DB_SETTINGS,
      { action: DBActions.GENERAL.FIND }
    )
  }

  static upsert(_id, value) {
    return ipcRenderer.invoke(
      IpcChannels.DB_SETTINGS,
      { action: DBActions.GENERAL.UPSERT, data: { _id, value } }
    )
  }
}

class History {
  static find() {
    return ipcRenderer.invoke(
      IpcChannels.DB_HISTORY,
      { action: DBActions.GENERAL.FIND }
    )
  }

  static upsert(record) {
    return ipcRenderer.invoke(
      IpcChannels.DB_HISTORY,
      { action: DBActions.GENERAL.UPSERT, data: record }
    )
  }

  static updateWatchProgress(videoId, watchProgress) {
    return ipcRenderer.invoke(
      IpcChannels.DB_HISTORY,
      {
        action: DBActions.HISTORY.UPDATE_WATCH_PROGRESS,
        data: { videoId, watchProgress }
      }
    )
  }

  static updateLastViewedPlaylist(videoId, lastViewedPlaylistId, lastViewedPlaylistType, lastViewedPlaylistItemId) {
    return ipcRenderer.invoke(
      IpcChannels.DB_HISTORY,
      {
        action: DBActions.HISTORY.UPDATE_PLAYLIST,
        data: { videoId, lastViewedPlaylistId, lastViewedPlaylistType, lastViewedPlaylistItemId }
      }
    )
  }

  static delete(videoId) {
    return ipcRenderer.invoke(
      IpcChannels.DB_HISTORY,
      { action: DBActions.GENERAL.DELETE, data: videoId }
    )
  }

  static deleteAll() {
    return ipcRenderer.invoke(
      IpcChannels.DB_HISTORY,
      { action: DBActions.GENERAL.DELETE_ALL }
    )
  }

  static persist() {
    return ipcRenderer.invoke(
      IpcChannels.DB_HISTORY,
      { action: DBActions.GENERAL.PERSIST }
    )
  }
}

class Profiles {
  static create(profile) {
    return ipcRenderer.invoke(
      IpcChannels.DB_PROFILES,
      { action: DBActions.GENERAL.CREATE, data: profile }
    )
  }

  static find() {
    return ipcRenderer.invoke(
      IpcChannels.DB_PROFILES,
      { action: DBActions.GENERAL.FIND }
    )
  }

  static upsert(profile) {
    return ipcRenderer.invoke(
      IpcChannels.DB_PROFILES,
      { action: DBActions.GENERAL.UPSERT, data: profile }
    )
  }

  static delete(id) {
    return ipcRenderer.invoke(
      IpcChannels.DB_PROFILES,
      { action: DBActions.GENERAL.DELETE, data: id }
    )
  }

  static persist() {
    return ipcRenderer.invoke(
      IpcChannels.DB_PROFILES,
      { action: DBActions.GENERAL.PERSIST }
    )
  }
}

class Playlists {
  static create(playlists) {
    return ipcRenderer.invoke(
      IpcChannels.DB_PLAYLISTS,
      { action: DBActions.GENERAL.CREATE, data: playlists }
    )
  }

  static find() {
    return ipcRenderer.invoke(
      IpcChannels.DB_PLAYLISTS,
      { action: DBActions.GENERAL.FIND }
    )
  }

  static upsert(playlist) {
    return ipcRenderer.invoke(
      IpcChannels.DB_PLAYLISTS,
      { action: DBActions.GENERAL.UPSERT, data: playlist }
    )
  }

  static upsertVideoByPlaylistId(_id, videoData) {
    return ipcRenderer.invoke(
      IpcChannels.DB_PLAYLISTS,
      {
        action: DBActions.PLAYLISTS.UPSERT_VIDEO,
        data: { _id, videoData }
      }
    )
  }

  static upsertVideosByPlaylistId(_id, videos) {
    return ipcRenderer.invoke(
      IpcChannels.DB_PLAYLISTS,
      {
        action: DBActions.PLAYLISTS.UPSERT_VIDEOS,
        data: { _id, videos }
      }
    )
  }

  static delete(_id) {
    return ipcRenderer.invoke(
      IpcChannels.DB_PLAYLISTS,
      { action: DBActions.GENERAL.DELETE, data: _id }
    )
  }

  static deleteVideoIdByPlaylistId({ _id, videoId, playlistItemId }) {
    return ipcRenderer.invoke(
      IpcChannels.DB_PLAYLISTS,
      {
        action: DBActions.PLAYLISTS.DELETE_VIDEO_ID,
        data: { _id, videoId, playlistItemId }
      }
    )
  }

  static deleteVideoIdsByPlaylistId(_id, videoIds) {
    return ipcRenderer.invoke(
      IpcChannels.DB_PLAYLISTS,
      {
        action: DBActions.PLAYLISTS.DELETE_VIDEO_IDS,
        data: { _id, videoIds }
      }
    )
  }

  static deleteAllVideosByPlaylistId(_id) {
    return ipcRenderer.invoke(
      IpcChannels.DB_PLAYLISTS,
      {
        action: DBActions.PLAYLISTS.DELETE_ALL_VIDEOS,
        data: _id
      }
    )
  }

  static deleteMultiple(ids) {
    return ipcRenderer.invoke(
      IpcChannels.DB_PLAYLISTS,
      { action: DBActions.GENERAL.DELETE_MULTIPLE, data: ids }
    )
  }

  static deleteAll() {
    return ipcRenderer.invoke(
      IpcChannels.DB_PLAYLISTS,
      { action: DBActions.GENERAL.DELETE_ALL }
    )
  }
}

export {
  Settings as settings,
  History as history,
  Profiles as profiles,
  Playlists as playlists
}
