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

/**
 * Material Design Symbols used by FreeTube's custom player components
 *
 * This only has the value of the `d` attribute from the `<path>` element, the rest of the SVG is generated at runtime.
 *
 * Fetched with
 * https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsrounded/<icon>/default/24px.svg
 * https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsrounded/<icon>/fill1/24px.svg
 */
const PlayerIcons = {
  CLOSE_FULLSCREEN_FILLED: 'M400-344 164-108q-11 11-28 11t-28-11q-11-11-11-28t11-28l236-236H200q-17 0-28.5-11.5T160-440q0-17 11.5-28.5T200-480h240q17 0 28.5 11.5T480-440v240q0 17-11.5 28.5T440-160q-17 0-28.5-11.5T400-200v-144Zm216-216h144q17 0 28.5 11.5T800-520q0 17-11.5 28.5T760-480H520q-17 0-28.5-11.5T480-520v-240q0-17 11.5-28.5T520-800q17 0 28.5 11.5T560-760v144l236-236q11-11 28-11t28 11q11 11 11 28t-11 28L616-560Z',
  DONE_FILLED: 'm382-354 339-339q12-12 28-12t28 12q12 12 12 28.5T777-636L410-268q-12 12-28 12t-28-12L182-440q-12-12-11.5-28.5T183-497q12-12 28.5-12t28.5 12l142 143Z',
  INSERT_CHART_DEFAULT: 'M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Zm120 200q-17 0-28.5 11.5T280-520v200q0 17 11.5 28.5T320-280q17 0 28.5-11.5T360-320v-200q0-17-11.5-28.5T320-560Zm160-120q-17 0-28.5 11.5T440-640v320q0 17 11.5 28.5T480-280q17 0 28.5-11.5T520-320v-320q0-17-11.5-28.5T480-680Zm160 240q-17 0-28.5 11.5T600-400v80q0 17 11.5 28.5T640-280q17 0 28.5-11.5T680-320v-80q0-17-11.5-28.5T640-440Z',
  INSERT_CHART_FILLED: 'M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm120-440q-17 0-28.5 11.5T280-520v200q0 17 11.5 28.5T320-280q17 0 28.5-11.5T360-320v-200q0-17-11.5-28.5T320-560Zm160-120q-17 0-28.5 11.5T440-640v320q0 17 11.5 28.5T480-280q17 0 28.5-11.5T520-320v-320q0-17-11.5-28.5T480-680Zm160 240q-17 0-28.5 11.5T600-400v80q0 17 11.5 28.5T640-280q17 0 28.5-11.5T680-320v-80q0-17-11.5-28.5T640-440Z',
  MONITOR_DEFAULT: 'M160-240q-33 0-56.5-23.5T80-320v-440q0-33 23.5-56.5T160-840h640q33 0 56.5 23.5T880-760v440q0 33-23.5 56.5T800-240H680l28 28q6 6 9 13.5t3 15.5v23q0 17-11.5 28.5T680-120H280q-17 0-28.5-11.5T240-160v-23q0-8 3-15.5t9-13.5l28-28H160Zm0-80h640v-440H160v440Zm0 0v-440 440Z',
  OPEN_IN_FULL_FILLED: 'M160-120q-17 0-28.5-11.5T120-160v-240q0-17 11.5-28.5T160-440q17 0 28.5 11.5T200-400v144l504-504H560q-17 0-28.5-11.5T520-800q0-17 11.5-28.5T560-840h240q17 0 28.5 11.5T840-800v240q0 17-11.5 28.5T800-520q-17 0-28.5-11.5T760-560v-144L256-200h144q17 0 28.5 11.5T440-160q0 17-11.5 28.5T400-120H160Z',
  PAUSE_CIRCLE_FILLED: 'M400-320q17 0 28.5-11.5T440-360v-240q0-17-11.5-28.5T400-640q-17 0-28.5 11.5T360-600v240q0 17 11.5 28.5T400-320Zm160 0q17 0 28.5-11.5T600-360v-240q0-17-11.5-28.5T560-640q-17 0-28.5 11.5T520-600v240q0 17 11.5 28.5T560-320ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z',
  PHOTO_CAMERA_FILLED: 'M480-260q75 0 127.5-52.5T660-440q0-75-52.5-127.5T480-620q-75 0-127.5 52.5T300-440q0 75 52.5 127.5T480-260Zm0-80q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM160-120q-33 0-56.5-23.5T80-200v-480q0-33 23.5-56.5T160-760h126l50-54q11-12 26.5-19t32.5-7h170q17 0 32.5 7t26.5 19l50 54h126q33 0 56.5 23.5T880-680v480q0 33-23.5 56.5T800-120H160Z',
  PLAY_CIRCLE_FILLED: 'm426-330 195-125q14-9 14-25t-14-25L426-630q-15-10-30.5-1.5T380-605v250q0 18 15.5 26.5T426-330Zm54 250q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z',
  SPATIAL_AUDIO_OFF_FILLED: 'M400-440q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM80-200v-32q0-33 17-62t47-44q51-26 115-44t141-18q77 0 141 18t115 44q30 15 47 44t17 62v32q0 33-23.5 56.5T640-120H160q-33 0-56.5-23.5T80-200Zm810-312q-8 0-15.5-3.5T862-524q-29-28-45-65t-16-78q0-41 16-77t45-65q5-5 12.5-8t15.5-3q17 0 28.5 11t11.5 28q0 8-3.5 16t-8.5 13q-17 17-27 39t-10 47q0 25 10 47t27 39q5 5 8.5 12.5T930-552q0 17-11.5 28.5T890-512ZM778-398q-8 0-15.5-3.5T750-410q-51-51-80-117.5T641-666q0-72 29-139t80-118q5-5 12.5-8t15.5-3q17 0 28.5 11.5T818-894q0 8-3 16t-9 13q-40 40-62.5 91T721-666q0 57 22.5 108.5T806-466q5 5 8.5 12.5T818-438q0 17-11.5 28.5T778-398Z',
  TUNE_FILLED: 'M480-120q-17 0-28.5-11.5T440-160v-160q0-17 11.5-28.5T480-360q17 0 28.5 11.5T520-320v40h280q17 0 28.5 11.5T840-240q0 17-11.5 28.5T800-200H520v40q0 17-11.5 28.5T480-120Zm-320-80q-17 0-28.5-11.5T120-240q0-17 11.5-28.5T160-280h160q17 0 28.5 11.5T360-240q0 17-11.5 28.5T320-200H160Zm160-160q-17 0-28.5-11.5T280-400v-40H160q-17 0-28.5-11.5T120-480q0-17 11.5-28.5T160-520h120v-40q0-17 11.5-28.5T320-600q17 0 28.5 11.5T360-560v160q0 17-11.5 28.5T320-360Zm160-80q-17 0-28.5-11.5T440-480q0-17 11.5-28.5T480-520h320q17 0 28.5 11.5T840-480q0 17-11.5 28.5T800-440H480Zm160-160q-17 0-28.5-11.5T600-640v-160q0-17 11.5-28.5T640-840q17 0 28.5 11.5T680-800v40h120q17 0 28.5 11.5T840-720q0 17-11.5 28.5T800-680H680v40q0 17-11.5 28.5T640-600Zm-480-80q-17 0-28.5-11.5T120-720q0-17 11.5-28.5T160-760h320q17 0 28.5 11.5T520-720q0 17-11.5 28.5T480-680H160Z',
  TV_DEFAULT: 'M160-200q-33 0-56.5-23.5T80-280v-480q0-33 23.5-56.5T160-840h640q33 0 56.5 23.5T880-760v480q0 33-23.5 56.5T800-200H640v40q0 17-11.5 28.5T600-120H360q-17 0-28.5-11.5T320-160v-40H160Zm0-80h640v-480H160v480Zm0 0v-480 480Z'
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
  PlayerIcons,
  MAIN_PROFILE_ID,
  MOBILE_WIDTH_THRESHOLD,
  PLAYLIST_HEIGHT_FORCE_LIST_THRESHOLD,
  SEARCH_CHAR_LIMIT,
  SEARCH_RESULTS_DISPLAY_LIMIT,
  MIXED_SEARCH_HISTORY_ENTRIES_DISPLAY_LIMIT,
  ABOUT_BITCOIN_ADDRESS,
}
