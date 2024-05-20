// IPC Channels
const IpcChannels = {
  ENABLE_PROXY: 'enable-proxy',
  DISABLE_PROXY: 'disable-proxy',
  OPEN_EXTERNAL_LINK: 'open-external-link',
  GET_SYSTEM_LOCALE: 'get-system-locale',
  GET_PICTURES_PATH: 'get-pictures-path',
  SHOW_OPEN_DIALOG: 'show-open-dialog',
  SHOW_SAVE_DIALOG: 'show-save-dialog',
  STOP_POWER_SAVE_BLOCKER: 'stop-power-save-blocker',
  START_POWER_SAVE_BLOCKER: 'start-power-save-blocker',
  CREATE_NEW_WINDOW: 'create-new-window',
  OPEN_IN_EXTERNAL_PLAYER: 'open-in-external-player',
  NATIVE_THEME_UPDATE: 'native-theme-update',

  DB_SETTINGS: 'db-settings',
  DB_HISTORY: 'db-history',
  DB_PROFILES: 'db-profiles',
  DB_PLAYLISTS: 'db-playlists',
  DB_SEARCH_HISTORY: 'db-search-history',

  SYNC_SETTINGS: 'sync-settings',
  SYNC_HISTORY: 'sync-history',
  SYNC_SEARCH_HISTORY: 'sync-search-history',
  SYNC_PROFILES: 'sync-profiles',
  SYNC_PLAYLISTS: 'sync-playlists',

  GET_REPLACE_HTTP_CACHE: 'get-replace-http-cache',
  TOGGLE_REPLACE_HTTP_CACHE: 'toggle-replace-http-cache',

  PLAYER_CACHE_GET: 'player-cache-get',
  PLAYER_CACHE_SET: 'player-cache-set'
}

const DBActions = {
  GENERAL: {
    CREATE: 'db-action-create',
    FIND: 'db-action-find',
    UPSERT: 'db-action-upsert',
    DELETE: 'db-action-delete',
    DELETE_MULTIPLE: 'db-action-delete-multiple',
    DELETE_ALL: 'db-action-delete-all',
    PERSIST: 'db-action-persist'
  },

  HISTORY: {
    UPDATE_WATCH_PROGRESS: 'db-action-history-update-watch-progress',
    UPDATE_PLAYLIST: 'db-action-history-update-playlist',
  },

  // SEARCH_HISTORY: {
  // },

  PLAYLISTS: {
    UPSERT_VIDEO: 'db-action-playlists-upsert-video-by-playlist-name',
    UPSERT_VIDEOS: 'db-action-playlists-upsert-videos-by-playlist-name',
    DELETE_VIDEO_ID: 'db-action-playlists-delete-video-by-playlist-name',
    DELETE_VIDEO_IDS: 'db-action-playlists-delete-video-ids',
    DELETE_ALL_VIDEOS: 'db-action-playlists-delete-all-videos',
  }
}

const SyncEvents = {
  GENERAL: {
    CREATE: 'sync-create',
    UPSERT: 'sync-upsert',
    DELETE: 'sync-delete',
    DELETE_ALL: 'sync-delete-all'
  },

  HISTORY: {
    UPDATE_WATCH_PROGRESS: 'sync-history-update-watch-progress',
    UPDATE_PLAYLIST: 'sync-history-update-playlist',
  },

  PLAYLISTS: {
    UPSERT_VIDEO: 'sync-playlists-upsert-video',
    DELETE_VIDEO: 'sync-playlists-delete-video',
  }
}

// Utils
const MAIN_PROFILE_ID = 'allChannels'

// YouTube search character limit is 100 characters
const SEARCH_CHAR_LIMIT = 100

export {
  IpcChannels,
  DBActions,
  SyncEvents,
  MAIN_PROFILE_ID,
  SEARCH_CHAR_LIMIT
}
