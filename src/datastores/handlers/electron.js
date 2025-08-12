import { DBActions } from '../../constants'

class Settings {
  static find() {
    return window.ftElectron.dbSettings(DBActions.GENERAL.FIND)
  }

  static upsert(_id, value) {
    return window.ftElectron.dbSettings(DBActions.GENERAL.UPSERT, { _id, value })
  }
}

class History {
  static find() {
    return window.ftElectron.dbHistory(DBActions.GENERAL.FIND)
  }

  static upsert(record) {
    return window.ftElectron.dbHistory(DBActions.GENERAL.UPSERT, record)
  }

  static overwrite(records) {
    return window.ftElectron.dbHistory(DBActions.HISTORY.OVERWRITE, records)
  }

  static updateWatchProgress(videoId, watchProgress) {
    return window.ftElectron.dbHistory(
      DBActions.HISTORY.UPDATE_WATCH_PROGRESS,
      { videoId, watchProgress }
    )
  }

  static updateLastViewedPlaylist(videoId, lastViewedPlaylistId, lastViewedPlaylistType, lastViewedPlaylistItemId) {
    return window.ftElectron.dbHistory(
      DBActions.HISTORY.UPDATE_PLAYLIST,
      { videoId, lastViewedPlaylistId, lastViewedPlaylistType, lastViewedPlaylistItemId }
    )
  }

  static delete(videoId) {
    return window.ftElectron.dbHistory(DBActions.GENERAL.DELETE, videoId)
  }

  static deleteAll() {
    return window.ftElectron.dbHistory(DBActions.GENERAL.DELETE_ALL)
  }
}

class Profiles {
  static create(profile) {
    return window.ftElectron.dbProfiles(DBActions.GENERAL.CREATE, profile)
  }

  static find() {
    return window.ftElectron.dbProfiles(DBActions.GENERAL.FIND)
  }

  static upsert(profile) {
    return window.ftElectron.dbProfiles(DBActions.GENERAL.UPSERT, profile)
  }

  static addChannelToProfiles(channel, profileIds) {
    return window.ftElectron.dbProfiles(DBActions.PROFILES.ADD_CHANNEL, { channel, profileIds })
  }

  static removeChannelFromProfiles(channelId, profileIds) {
    return window.ftElectron.dbProfiles(DBActions.PROFILES.REMOVE_CHANNEL, { channelId, profileIds })
  }

  static delete(id) {
    return window.ftElectron.dbProfiles(DBActions.GENERAL.DELETE, id)
  }
}

class Playlists {
  static create(playlists) {
    return window.ftElectron.dbPlaylists(DBActions.GENERAL.CREATE, playlists)
  }

  static find() {
    return window.ftElectron.dbPlaylists(DBActions.GENERAL.FIND)
  }

  static upsert(playlist) {
    return window.ftElectron.dbPlaylists(DBActions.GENERAL.UPSERT, playlist)
  }

  static upsertVideoByPlaylistId(_id, lastUpdatedAt, videoData) {
    return window.ftElectron.dbPlaylists(
      DBActions.PLAYLISTS.UPSERT_VIDEO,
      { _id, lastUpdatedAt, videoData }
    )
  }

  static upsertVideosByPlaylistId(_id, lastUpdatedAt, videos) {
    return window.ftElectron.dbPlaylists(
      DBActions.PLAYLISTS.UPSERT_VIDEOS,
      { _id, lastUpdatedAt, videos }
    )
  }

  static delete(_id) {
    return window.ftElectron.dbPlaylists(DBActions.GENERAL.DELETE, _id)
  }

  static deleteVideoIdByPlaylistId(_id, lastUpdatedAt, videoId, playlistItemId) {
    return window.ftElectron.dbPlaylists(
      DBActions.PLAYLISTS.DELETE_VIDEO_ID,
      { _id, lastUpdatedAt, videoId, playlistItemId }
    )
  }

  static deleteVideoIdsByPlaylistId(_id, lastUpdatedAt, playlistItemIds) {
    return window.ftElectron.dbPlaylists(
      DBActions.PLAYLISTS.DELETE_VIDEO_IDS,
      { _id, lastUpdatedAt, playlistItemIds }
    )
  }

  static deleteAllVideosByPlaylistId(_id) {
    return window.ftElectron.dbPlaylists(DBActions.PLAYLISTS.DELETE_ALL_VIDEOS, _id)
  }

  static deleteMultiple(ids) {
    return window.ftElectron.dbPlaylists(DBActions.GENERAL.DELETE_MULTIPLE, ids)
  }

  static deleteAll() {
    return window.ftElectron.dbPlaylists(DBActions.GENERAL.DELETE_ALL)
  }
}

class SearchHistory {
  static find() {
    return window.ftElectron.dbSearchHistory(DBActions.GENERAL.FIND)
  }

  static upsert(searchHistoryEntry) {
    return window.ftElectron.dbSearchHistory(DBActions.GENERAL.UPSERT, searchHistoryEntry)
  }

  static delete(_id) {
    return window.ftElectron.dbSearchHistory(DBActions.GENERAL.DELETE, _id)
  }

  static deleteAll() {
    return window.ftElectron.dbSearchHistory(DBActions.GENERAL.DELETE_ALL)
  }
}

class SubscriptionCache {
  static find() {
    return window.ftElectron.dbSubscriptionCache(DBActions.GENERAL.FIND)
  }

  static updateVideosByChannelId(channelId, entries, timestamp) {
    return window.ftElectron.dbSubscriptionCache(
      DBActions.SUBSCRIPTION_CACHE.UPDATE_VIDEOS_BY_CHANNEL,
      { channelId, entries, timestamp }
    )
  }

  static updateLiveStreamsByChannelId(channelId, entries, timestamp) {
    return window.ftElectron.dbSubscriptionCache(
      DBActions.SUBSCRIPTION_CACHE.UPDATE_LIVE_STREAMS_BY_CHANNEL,
      { channelId, entries, timestamp }
    )
  }

  static updateShortsByChannelId(channelId, entries, timestamp) {
    return window.ftElectron.dbSubscriptionCache(
      DBActions.SUBSCRIPTION_CACHE.UPDATE_SHORTS_BY_CHANNEL,
      { channelId, entries, timestamp }
    )
  }

  static updateShortsWithChannelPageShortsByChannelId(channelId, entries) {
    return window.ftElectron.dbSubscriptionCache(
      DBActions.SUBSCRIPTION_CACHE.UPDATE_SHORTS_WITH_CHANNEL_PAGE_SHORTS_BY_CHANNEL,
      { channelId, entries }
    )
  }

  static updateCommunityPostsByChannelId(channelId, entries, timestamp) {
    return window.ftElectron.dbSubscriptionCache(
      DBActions.SUBSCRIPTION_CACHE.UPDATE_COMMUNITY_POSTS_BY_CHANNEL,
      { channelId, entries, timestamp }
    )
  }

  static deleteMultipleChannels(channelIds) {
    return window.ftElectron.dbSubscriptionCache(DBActions.GENERAL.DELETE_MULTIPLE, channelIds)
  }

  static deleteAll() {
    return window.ftElectron.dbSubscriptionCache(DBActions.GENERAL.DELETE_ALL)
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
