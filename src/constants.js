// IPC Channels
const IpcChannels = {
  ENABLE_PROXY: 'enable-proxy',
  DISABLE_PROXY: 'disable-proxy',
  OPEN_EXTERNAL_LINK: 'open-external-link',
  GET_SYSTEM_LOCALE: 'get-system-locale',
  GET_USER_DATA_PATH: 'get-user-data-path',
  GET_USER_DATA_PATH_SYNC: 'get-user-data-path-sync',
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
  DB_HIGHLIGHTED_COMMENTS: 'db-highlighted-comments',

  SYNC_SETTINGS: 'sync-settings',
  SYNC_HISTORY: 'sync-history',
  SYNC_PROFILES: 'sync-profiles',
  SYNC_PLAYLISTS: 'sync-playlists'
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

  PLAYLISTS: {
    UPSERT_VIDEO: 'db-action-playlists-upsert-video-by-playlist-name',
    UPSERT_VIDEO_IDS: 'db-action-playlists-upsert-video-ids-by-playlist-id',
    DELETE_VIDEO_ID: 'db-action-playlists-delete-video-by-playlist-name',
    DELETE_VIDEO_IDS: 'db-action-playlists-delete-video-ids',
    DELETE_ALL_VIDEOS: 'db-action-playlists-delete-all-videos'
  },

  HIGHLIGHTED_COMMENTS: {
    UPSERT_COMMENT: 'db-action-highlighted-comments-upsert-comment',
    DELETE_COMMENT: 'db-action-higlighted-comments-delete-comment',
    UPSERT_REPLY: 'db-action-highlighted-comments-upsert-reply',
    DELETE_REPLY: 'db-action-higlighted-comments-delete-reply'
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
    DELETE_VIDEO: 'sync-playlists-delete-video'
  }
}

// https://v2.vuejs.org/v2/api/#provide-inject
const Injectables = {
  SHOW_OUTLINES: 'showOutlines'
}

// Utils
const MAIN_PROFILE_ID = 'allChannels'

export {
  IpcChannels,
  DBActions,
  SyncEvents,
  Injectables,
  MAIN_PROFILE_ID
}
