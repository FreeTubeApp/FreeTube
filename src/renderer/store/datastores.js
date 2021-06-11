import Datastore from 'nedb'

// Initialize all datastores and export their references
// Current dbs:
// `settings.db`
// `profiles.db`
// `playlists.db`
// `history.db`

// Check if using Electron
let userDataPath
const usingElectron = window?.process?.type === 'renderer'
if (usingElectron) {
  const { ipcRenderer } = require('electron')
  userDataPath = ipcRenderer.sendSync('getUserDataPathSync')
}

const buildFileName = (dbName) => {
  return usingElectron
    ? userDataPath + '/' + dbName + '.db'
    : dbName + '.db'
}

const settingsDb = new Datastore({
  filename: buildFileName('settings'),
  autoload: true
})

const playlistsDb = new Datastore({
  filename: buildFileName('playlists'),
  autoload: true
})

const profilesDb = new Datastore({
  filename: buildFileName('profiles'),
  autoload: true
})

const historyDb = new Datastore({
  filename: buildFileName('history'),
  autoload: true
})

export {
  settingsDb,
  profilesDb,
  playlistsDb,
  historyDb
}
