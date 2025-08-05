// IPC Channels
const IpcChannels = {
  ENABLE_PROXY: 'enable-proxy',
  DISABLE_PROXY: 'disable-proxy',
  GET_SYSTEM_LOCALE: 'get-system-locale',
  GET_NAVIGATION_HISTORY: 'get-navigation-history',
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
  DB_SEARCH_HISTORY: 'db-search-history',
  DB_SUBSCRIPTION_CACHE: 'db-subscription-cache',

  SYNC_SETTINGS: 'sync-settings',
  SYNC_HISTORY: 'sync-history',
  SYNC_SEARCH_HISTORY: 'sync-search-history',
  SYNC_PROFILES: 'sync-profiles',
  SYNC_PLAYLISTS: 'sync-playlists',
  SYNC_SUBSCRIPTION_CACHE: 'sync-subscription-cache',

  GET_REPLACE_HTTP_CACHE: 'get-replace-http-cache',
  TOGGLE_REPLACE_HTTP_CACHE: 'toggle-replace-http-cache',

  PLAYER_CACHE_GET: 'player-cache-get',
  PLAYER_CACHE_SET: 'player-cache-set',

  SET_INVIDIOUS_AUTHORIZATION: 'set-invidious-authorization',

  GENERATE_PO_TOKENS: 'generate-po-tokens',

  GET_SCREENSHOT_FALLBACK_FOLDER: 'get-screenshot-fallback-folder',
  CHOOSE_DEFAULT_FOLDER: 'choose-default-folder',
  WRITE_TO_DEFAULT_FOLDER: 'write-to-default-folder',
}

const DBActions = {
  // The constants in the GENERAL group are usally intermingeled with the ones in other groups, so they need unique values.
  // The other groups however are usually not mixed (e.g. HISTORY and PROFILES),
  // so they can have similar values (as long as they don't overlap with the GENERAL group).
  GENERAL: {
    CREATE: 0,
    FIND: 1,
    UPSERT: 2,
    DELETE: 3,
    DELETE_MULTIPLE: 4,
    DELETE_ALL: 5
  },

  HISTORY: {
    OVERWRITE: 20,
    UPDATE_WATCH_PROGRESS: 21,
    UPDATE_PLAYLIST: 22,
  },

  PROFILES: {
    ADD_CHANNEL: 20,
    REMOVE_CHANNEL: 21
  },

  PLAYLISTS: {
    UPSERT_VIDEO: 20,
    UPSERT_VIDEOS: 21,
    DELETE_VIDEO_ID: 22,
    DELETE_VIDEO_IDS: 23,
    DELETE_ALL_VIDEOS: 24,
  },

  SUBSCRIPTION_CACHE: {
    UPDATE_VIDEOS_BY_CHANNEL: 20,
    UPDATE_LIVE_STREAMS_BY_CHANNEL: 21,
    UPDATE_SHORTS_BY_CHANNEL: 22,
    UPDATE_SHORTS_WITH_CHANNEL_PAGE_SHORTS_BY_CHANNEL: 23,
    UPDATE_COMMUNITY_POSTS_BY_CHANNEL: 24,
  },
}

const SyncEvents = {
  // The constants in the GENERAL group are usally intermingeled with the ones in other groups, so they need unique values.
  // The other groups however are usually not mixed (e.g. HISTORY and PROFILES),
  // so they can have similar values (as long as they don't overlap with the GENERAL group).
  GENERAL: {
    CREATE: 0,
    UPSERT: 1,
    DELETE: 2,
    DELETE_MULTIPLE: 3,
    DELETE_ALL: 4
  },

  HISTORY: {
    OVERWRITE: 20,
    UPDATE_WATCH_PROGRESS: 21,
    UPDATE_PLAYLIST: 22,
  },

  PROFILES: {
    ADD_CHANNEL: 20,
    REMOVE_CHANNEL: 21
  },

  PLAYLISTS: {
    UPSERT_VIDEO: 20,
    UPSERT_VIDEOS: 21,
    DELETE_VIDEO: 22,
    DELETE_VIDEOS: 23,
  },

  SUBSCRIPTION_CACHE: {
    UPDATE_VIDEOS_BY_CHANNEL: 20,
    UPDATE_LIVE_STREAMS_BY_CHANNEL: 21,
    UPDATE_SHORTS_BY_CHANNEL: 22,
    UPDATE_SHORTS_WITH_CHANNEL_PAGE_SHORTS_BY_CHANNEL: 23,
    UPDATE_COMMUNITY_POSTS_BY_CHANNEL: 24,
  },
}

const DefaultFolderKind = {
  DOWNLOADS: 0,
  SCREENSHOTS: 1
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
      HISTORY_BACKWARD_ALT_MAC: 'cmd+[',
      HISTORY_FORWARD_ALT_MAC: 'cmd+]',
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
      DECREASE_VIDEO_SPEED_ALT: '<',
      INCREASE_VIDEO_SPEED: 'p',
      INCREASE_VIDEO_SPEED_ALT: '>',
      SKIP_N_TENTHS: '0..9',
      LAST_CHAPTER: 'ctrl+arrowleft',
      NEXT_CHAPTER: 'ctrl+arrowright',
      LAST_FRAME: ',',
      NEXT_FRAME: '.',
      HOME: 'home',
      END: 'end',
      SKIP_TO_NEXT: 'shift+n',
      SKIP_TO_PREV: 'shift+p'
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

// max # of results we show for search suggestions
const SEARCH_RESULTS_DISPLAY_LIMIT = 14

// max # of search history results we show when mixed with YT search suggestions
const MIXED_SEARCH_HISTORY_ENTRIES_DISPLAY_LIMIT = 4

// Displayed on the about page and used in the main.js file to only allow bitcoin URLs with this wallet address to be opened
const ABOUT_BITCOIN_ADDRESS = '1Lih7Ho5gnxb1CwPD4o59ss78pwo2T91eS'

export {
  IpcChannels,
  DBActions,
  SyncEvents,
  DefaultFolderKind,
  KeyboardShortcuts,
  MAIN_PROFILE_ID,
  MOBILE_WIDTH_THRESHOLD,
  PLAYLIST_HEIGHT_FORCE_LIST_THRESHOLD,
  SEARCH_CHAR_LIMIT,
  SEARCH_RESULTS_DISPLAY_LIMIT,
  MIXED_SEARCH_HISTORY_ENTRIES_DISPLAY_LIMIT,
  ABOUT_BITCOIN_ADDRESS,
}
