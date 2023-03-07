import Datastore from 'nedb-promises'

let dbPath = null

if (process.env.IS_ELECTRON_MAIN) {
  const { app } = require('electron')
  const { join } = require('path')
  // this code only runs in the electron main process, so hopefully using sync fs code here should be fine 😬
  const { statSync, realpathSync } = require('fs')
  const userDataPath = app.getPath('userData') // This is based on the user's OS
  dbPath = (dbName) => {
    let path = join(userDataPath, `${dbName}.db`)

    // returns undefined if the path doesn't exist
    if (statSync(path, { throwIfNoEntry: false })?.isSymbolicLink) {
      path = realpathSync(path)
    }

    return path
  }
} else {
  dbPath = (dbName) => `${dbName}.db`
}

const db = {}
db.settings = Datastore.create({ filename: dbPath('settings'), autoload: true })
db.profiles = Datastore.create({ filename: dbPath('profiles'), autoload: true })
db.playlists = Datastore.create({ filename: dbPath('playlists'), autoload: true })
db.history = Datastore.create({ filename: dbPath('history'), autoload: true })

export default db
