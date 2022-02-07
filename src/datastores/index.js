import Datastore from 'nedb-promises'

let dbPath = null

const isElectronMain = !!process?.versions?.electron
if (isElectronMain) {
  const { app } = require('electron')
  const { join } = require('path')
  const userDataPath = app.getPath('userData') // This is based on the user's OS
  dbPath = (dbName) => join(userDataPath, `${dbName}.db`)
} else {
  dbPath = (dbName) => `${dbName}.db`
}

const db = {}
db.settings = Datastore.create({ filename: dbPath('settings'), autoload: true })
db.profiles = Datastore.create({ filename: dbPath('profiles'), autoload: true })
db.playlists = Datastore.create({ filename: dbPath('playlists'), autoload: true })
db.history = Datastore.create({ filename: dbPath('history'), autoload: true })

db.history.ensureIndex({ fieldName: 'author' })
db.history.ensureIndex({ fieldName: 'title' })

export default db
