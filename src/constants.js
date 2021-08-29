// IPC Channels
const IpcChannels = {
  ENABLE_PROXY: 'enable-proxy',
  DISABLE_PROXY: 'disable-proxy',
  OPEN_EXTERNAL_LINK: 'open-external-link',
  GET_SYSTEM_LOCALE: 'get-system-locale',
  GET_USER_DATA_PATH: 'get-user-data-path',
  GET_USER_DATA_PATH_SYNC: 'get-user-data-path-sync',
  SHOW_OPEN_DIALOG: 'show-open-dialog',
  SHOW_SAVE_DIALOG: 'show-save-dialog',
  STOP_POWER_SAVE_BLOCKER: 'stop-power-save-blocker',
  START_POWER_SAVE_BLOCKER: 'start-power-save-blocker',
  CREATE_NEW_WINDOW: 'create-new-window',
  SYNC_SETTINGS: 'sync-settings',
  SYNC_HISTORY: 'sync-history',
  SYNC_PROFILES: 'sync-profiles',
  SYNC_PLAYLISTS: 'sync-playlists',
  OPEN_IN_EXTERNAL_PLAYER: 'open-in-external-player'
}

export {
  IpcChannels
}
