// IPC Channels
const IpcChannels = {
  ENABLE_PROXY: 'enable-proxy',
  DISABLE_PROXY: 'disable-proxy',
  OPEN_EXTERNAL_LINK: 'open-external-link',
  GET_SYSTEM_LOCALE: 'get-system-locale',
  GET_PICTURES_PATH: 'get-pictures-path',
  GET_NAVIGATION_HISTORY: 'get-navigation-history',
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
  DB_SUBSCRIPTION_CACHE: 'db-subscription-cache',

  SYNC_SETTINGS: 'sync-settings',
  SYNC_HISTORY: 'sync-history',
  SYNC_PROFILES: 'sync-profiles',
  SYNC_PLAYLISTS: 'sync-playlists',
  SYNC_SUBSCRIPTION_CACHE: 'sync-subscription-cache',

  GET_REPLACE_HTTP_CACHE: 'get-replace-http-cache',
  TOGGLE_REPLACE_HTTP_CACHE: 'toggle-replace-http-cache',

  PLAYER_CACHE_GET: 'player-cache-get',
  PLAYER_CACHE_SET: 'player-cache-set',

  SET_INVIDIOUS_AUTHORIZATION: 'set-invidious-authorization',

  GENERATE_PO_TOKEN: 'generate-po-token',
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
    OVERWRITE: 'db-action-history-overwrite',
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
  },

  SUBSCRIPTION_CACHE: {
    UPDATE_VIDEOS_BY_CHANNEL: 'db-action-subscriptions-update-videos-by-channel',
    UPDATE_LIVE_STREAMS_BY_CHANNEL: 'db-action-subscriptions-update-live-streams-by-channel',
    UPDATE_SHORTS_BY_CHANNEL: 'db-action-subscriptions-update-shorts-by-channel',
    UPDATE_SHORTS_WITH_CHANNEL_PAGE_SHORTS_BY_CHANNEL: 'db-action-subscriptions-update-shorts-with-channel-page-shorts-by-channel',
    UPDATE_COMMUNITY_POSTS_BY_CHANNEL: 'db-action-subscriptions-update-community-posts-by-channel',
  },
}

const SyncEvents = {
  GENERAL: {
    CREATE: 'sync-create',
    UPSERT: 'sync-upsert',
    DELETE: 'sync-delete',
    DELETE_ALL: 'sync-delete-all'
  },

  HISTORY: {
    OVERWRITE: 'sync-history-overwrite',
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
  },

  SUBSCRIPTION_CACHE: {
    UPDATE_VIDEOS_BY_CHANNEL: 'sync-subscriptions-update-videos-by-channel',
    UPDATE_LIVE_STREAMS_BY_CHANNEL: 'sync-subscriptions-update-live-streams-by-channel',
    UPDATE_SHORTS_BY_CHANNEL: 'sync-subscriptions-update-shorts-by-channel',
    UPDATE_SHORTS_WITH_CHANNEL_PAGE_SHORTS_BY_CHANNEL: 'sync-subscriptions-update-shorts-with-channel-page-shorts-by-channel',
    UPDATE_COMMUNITY_POSTS_BY_CHANNEL: 'sync-subscriptions-update-community-posts-by-channel',
  },
}

/*
  DEV NOTE: Duplicate any and all changes made here to our [official documentation site here](https://github.com/FreeTubeApp/FreeTube-Docs/blob/master/usage/keyboard-shortcuts.md)
  to have them reflect on the [keyboard shortcut reference webpage](https://docs.freetubeapp.io/usage/keyboard-shortcuts).
  Please also update the [keyboard shortcut modal](src/renderer/components/FtKeyboardShortcutPrompt/FtKeyboardShortcutPrompt.vue)
*/
const KeyboardShortcuts = {
  APP: {
    GENERAL: {
      SHOW_SHORTCUTS: 'shift+?',
      HISTORY_BACKWARD: 'alt+arrowleft',
      HISTORY_FORWARD: 'alt+arrowright',
      FULLSCREEN: 'f11',
      NAVIGATE_TO_SETTINGS: 'ctrl+,',
      NAVIGATE_TO_HISTORY: 'ctrl+H',
      NAVIGATE_TO_HISTORY_MAC: 'cmd+Y',
      NEW_WINDOW: 'ctrl+N',
      MINIMIZE_WINDOW: 'ctrl+M',
      CLOSE_WINDOW: 'ctrl+W',
      RESTART_WINDOW: 'ctrl+R',
      FORCE_RESTART_WINDOW: 'ctrl+shift+R',
      TOGGLE_DEVTOOLS: 'ctrl+shift+I',
      FOCUS_SEARCH: 'alt+D',
      SEARCH_IN_NEW_WINDOW: 'shift+enter',
      RESET_ZOOM: 'ctrl+0',
      ZOOM_IN: 'ctrl+plus',
      ZOOM_OUT: 'ctrl+-'

    },
    SITUATIONAL: {
      REFRESH: 'r',
      FOCUS_SECONDARY_SEARCH: 'ctrl+F'
    },
  },
  VIDEO_PLAYER: {
    GENERAL: {
      CAPTIONS: 'c',
      THEATRE_MODE: 't',
      FULLSCREEN: 'f',
      FULLWINDOW: 's',
      PICTURE_IN_PICTURE: 'i',
      MUTE: 'm',
      VOLUME_UP: 'arrowup',
      VOLUME_DOWN: 'arrowdown',
      STATS: 'd',
      TAKE_SCREENSHOT: 'u',
    },
    PLAYBACK: {
      PLAY: 'k',
      LARGE_REWIND: 'j',
      LARGE_FAST_FORWARD: 'l',
      SMALL_REWIND: 'arrowleft',
      SMALL_FAST_FORWARD: 'arrowright',
      DECREASE_VIDEO_SPEED: 'o',
      INCREASE_VIDEO_SPEED: 'p',
      SKIP_N_TENTHS: '0..9',
      LAST_CHAPTER: 'ctrl+arrowleft',
      NEXT_CHAPTER: 'ctrl+arrowright',
      LAST_FRAME: ',',
      NEXT_FRAME: '.',
    }
  },
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
  KeyboardShortcuts,
  MAIN_PROFILE_ID,
  MOBILE_WIDTH_THRESHOLD,
  PLAYLIST_HEIGHT_FORCE_LIST_THRESHOLD,
  SEARCH_CHAR_LIMIT,
  ABOUT_BITCOIN_ADDRESS,
}
