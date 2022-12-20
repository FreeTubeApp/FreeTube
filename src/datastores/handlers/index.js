let handlers
if (process.env.IS_ELECTRON) {
  handlers = require('./electron').default
} else {
  handlers = require('./web').default
}

const DBSettingHandlers = handlers.settings
const DBHistoryHandlers = handlers.history
const DBProfileHandlers = handlers.profiles
const DBPlaylistHandlers = handlers.playlists

export {
  DBSettingHandlers,
  DBHistoryHandlers,
  DBProfileHandlers,
  DBPlaylistHandlers
}
