import Datastore from '@seald-io/nedb'

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

export const settings = new Datastore({ filename: dbPath('settings'), autoload: !process.env.IS_ELECTRON_MAIN })
export const profiles = new Datastore({ filename: dbPath('profiles'), autoload: !process.env.IS_ELECTRON_MAIN })
export const playlists = new Datastore({ filename: dbPath('playlists'), autoload: !process.env.IS_ELECTRON_MAIN })
export const history = new Datastore({ filename: dbPath('history'), autoload: !process.env.IS_ELECTRON_MAIN })
export const searchHistory = new Datastore({ filename: dbPath('search-history'), autoload: !process.env.IS_ELECTRON_MAIN })
export const subscriptionCache = new Datastore({ filename: dbPath('subscription-cache'), autoload: !process.env.IS_ELECTRON_MAIN })
