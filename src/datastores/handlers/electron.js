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

  static overwrite(records) {
    return ipcRenderer.invoke(
      IpcChannels.DB_HISTORY,
      { action: DBActions.HISTORY.OVERWRITE, data: records }
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

  static addChannelToProfiles(channel, profileIds) {
    return ipcRenderer.invoke(
      IpcChannels.DB_PROFILES,
      {
        action: DBActions.PROFILES.ADD_CHANNEL,
        data: { channel, profileIds }
      }
    )
  }

  static removeChannelFromProfiles(channelId, profileIds) {
    return ipcRenderer.invoke(
      IpcChannels.DB_PROFILES,
      {
        action: DBActions.PROFILES.REMOVE_CHANNEL,
        data: { channelId, profileIds }
      }
    )
  }

  static delete(id) {
    return ipcRenderer.invoke(
      IpcChannels.DB_PROFILES,
      { action: DBActions.GENERAL.DELETE, data: id }
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

  static deleteVideoIdByPlaylistId(_id, videoId, playlistItemId) {
    return ipcRenderer.invoke(
      IpcChannels.DB_PLAYLISTS,
      {
        action: DBActions.PLAYLISTS.DELETE_VIDEO_ID,
        data: { _id, videoId, playlistItemId }
      }
    )
  }

  static deleteVideoIdsByPlaylistId(_id, playlistItemIds) {
    return ipcRenderer.invoke(
      IpcChannels.DB_PLAYLISTS,
      {
        action: DBActions.PLAYLISTS.DELETE_VIDEO_IDS,
        data: { _id, playlistItemIds }
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

class SearchHistory {
  static find() {
    return ipcRenderer.invoke(
      IpcChannels.DB_SEARCH_HISTORY,
      { action: DBActions.GENERAL.FIND }
    )
  }

  static upsert(searchHistoryEntry) {
    return ipcRenderer.invoke(
      IpcChannels.DB_SEARCH_HISTORY,
      { action: DBActions.GENERAL.UPSERT, data: searchHistoryEntry }
    )
  }

  static delete(_id) {
    return ipcRenderer.invoke(
      IpcChannels.DB_SEARCH_HISTORY,
      { action: DBActions.GENERAL.DELETE, data: _id }
    )
  }

  static deleteAll() {
    return ipcRenderer.invoke(
      IpcChannels.DB_SEARCH_HISTORY,
      { action: DBActions.GENERAL.DELETE_ALL }
    )
  }
}

class SubscriptionCache {
  static find() {
    return ipcRenderer.invoke(
      IpcChannels.DB_SUBSCRIPTION_CACHE,
      { action: DBActions.GENERAL.FIND }
    )
  }

  static updateVideosByChannelId(channelId, entries, timestamp) {
    return ipcRenderer.invoke(
      IpcChannels.DB_SUBSCRIPTION_CACHE,
      {
        action: DBActions.SUBSCRIPTION_CACHE.UPDATE_VIDEOS_BY_CHANNEL,
        data: { channelId, entries, timestamp },
      }
    )
  }

  static updateLiveStreamsByChannelId(channelId, entries, timestamp) {
    return ipcRenderer.invoke(
      IpcChannels.DB_SUBSCRIPTION_CACHE,
      {
        action: DBActions.SUBSCRIPTION_CACHE.UPDATE_LIVE_STREAMS_BY_CHANNEL,
        data: { channelId, entries, timestamp },
      }
    )
  }

  static updateShortsByChannelId(channelId, entries, timestamp) {
    return ipcRenderer.invoke(
      IpcChannels.DB_SUBSCRIPTION_CACHE,
      {
        action: DBActions.SUBSCRIPTION_CACHE.UPDATE_SHORTS_BY_CHANNEL,
        data: { channelId, entries, timestamp },
      }
    )
  }

  static updateShortsWithChannelPageShortsByChannelId(channelId, entries) {
    return ipcRenderer.invoke(
      IpcChannels.DB_SUBSCRIPTION_CACHE,
      {
        action: DBActions.SUBSCRIPTION_CACHE.UPDATE_SHORTS_WITH_CHANNEL_PAGE_SHORTS_BY_CHANNEL,
        data: { channelId, entries },
      }
    )
  }

  static updateCommunityPostsByChannelId(channelId, entries, timestamp) {
    return ipcRenderer.invoke(
      IpcChannels.DB_SUBSCRIPTION_CACHE,
      {
        action: DBActions.SUBSCRIPTION_CACHE.UPDATE_COMMUNITY_POSTS_BY_CHANNEL,
        data: { channelId, entries, timestamp },
      }
    )
  }

  static deleteMultipleChannels(channelIds) {
    return ipcRenderer.invoke(
      IpcChannels.DB_SUBSCRIPTION_CACHE,
      { action: DBActions.GENERAL.DELETE_MULTIPLE, data: channelIds }
    )
  }

  static deleteAll() {
    return ipcRenderer.invoke(
      IpcChannels.DB_SUBSCRIPTION_CACHE,
      { action: DBActions.GENERAL.DELETE_ALL }
    )
  }
}

export {
  Settings as settings,
  History as history,
  Profiles as profiles,
  Playlists as playlists,
  SearchHistory as searchHistory,
  SubscriptionCache as subscriptionCache,
}
