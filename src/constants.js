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
  APP_READY: 'app-ready',
  RELAUNCH_REQUEST: 'relaunch-request',

  SEARCH_INPUT_HANDLING_READY: 'search-input-handling-ready',
  UPDATE_SEARCH_INPUT_TEXT: 'update-search-input-text',

  OPEN_URL: 'open-url',
  CHANGE_VIEW: 'change-view',

  DB_SETTINGS: 'db-settings',
  DB_HISTORY: 'db-history',
  DB_PROFILES: 'db-profiles',
  DB_PLAYLISTS: 'db-playlists',

  SYNC_SETTINGS: 'sync-settings',
  SYNC_HISTORY: 'sync-history',
  SYNC_PROFILES: 'sync-profiles',
  SYNC_PLAYLISTS: 'sync-playlists',

  GET_REPLACE_HTTP_CACHE: 'get-replace-http-cache',
  TOGGLE_REPLACE_HTTP_CACHE: 'toggle-replace-http-cache',

  SHOW_VIDEO_STATISTICS: 'show-video-statistics',

  PLAYER_CACHE_GET: 'player-cache-get',
  PLAYER_CACHE_SET: 'player-cache-set',

  SET_INVIDIOUS_AUTHORIZATION: 'set-invidious-authorization'
}

const DBActions = {
  GENERAL: {
    CREATE: 'db-action-create',
    FIND: 'db-action-find',
    UPSERT: 'db-action-upsert',
    DELETE: 'db-action-delete',
    DELETE_MULTIPLE: 'db-action-delete-multiple',
    DELETE_ALL: 'db-action-delete-all'
  },

  HISTORY: {
    UPDATE_WATCH_PROGRESS: 'db-action-history-update-watch-progress',
    UPDATE_PLAYLIST: 'db-action-history-update-playlist',
  },

  PROFILES: {
    ADD_CHANNEL: 'db-action-profiles-add-channel',
    REMOVE_CHANNEL: 'db-action-profiles-remove-channel'
  },

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

  PROFILES: {
    ADD_CHANNEL: 'sync-profiles-add-channel',
    REMOVE_CHANNEL: 'sync-profiles-remove-channel'
  },

  PLAYLISTS: {
    UPSERT_VIDEO: 'sync-playlists-upsert-video',
    DELETE_VIDEO: 'sync-playlists-delete-video',
  }
}

// Utils
const MAIN_PROFILE_ID = 'allChannels'

// Width threshold in px at which we switch to using a more heavily altered view for mobile users
const MOBILE_WIDTH_THRESHOLD = 680

// Height threshold in px at which we switch to using a more heavily altered playlist view for mobile users
const PLAYLIST_HEIGHT_FORCE_LIST_THRESHOLD = 500

// YouTube search character limit is 100 characters
const SEARCH_CHAR_LIMIT = 100

// Displayed on the about page and used in the main.js file to only allow bitcoin URLs with this wallet address to be opened
const ABOUT_BITCOIN_ADDRESS = '1Lih7Ho5gnxb1CwPD4o59ss78pwo2T91eS'

export {
  IpcChannels,
  DBActions,
  SyncEvents,
  MAIN_PROFILE_ID,
  MOBILE_WIDTH_THRESHOLD,
  PLAYLIST_HEIGHT_FORCE_LIST_THRESHOLD,
  SEARCH_CHAR_LIMIT,
  ABOUT_BITCOIN_ADDRESS,
}
