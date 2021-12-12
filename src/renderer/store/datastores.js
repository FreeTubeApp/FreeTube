import Datastore from 'nedb-promises'

// Initialize all datastores and export their references
// Current dbs:
// `settings.db`
// `profiles.db`
// `playlists.db`
// `history.db`

let buildFileName = null

// Check if using Electron
const usingElectron = window?.process?.type === 'renderer'
if (usingElectron) {
  const { ipcRenderer } = require('electron')
  const userDataPath = ipcRenderer.sendSync('getUserDataPathSync')
  buildFileName = (dbName) => userDataPath + '/' + dbName + '.db'
} else {
  buildFileName = (dbName) => dbName + '.db'
}

const settingsDb = Datastore.create({
  filename: buildFileName('settings'),
  autoload: true
})

const playlistsDb = Datastore.create({
  filename: buildFileName('playlists'),
  autoload: true
})

const profilesDb = Datastore.create({
  filename: buildFileName('profiles'),
  autoload: true
})

const historyDb = Datastore.create({
  filename: buildFileName('history'),
  autoload: true
})

historyDb.ensureIndex({ fieldName: 'author' })
historyDb.ensureIndex({ fieldName: 'title' })
historyDb.ensureIndex({ fieldName: 'videoId' })

export {
  settingsDb,
  profilesDb,
  playlistsDb,
  historyDb
}
