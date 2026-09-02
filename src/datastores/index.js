import Datastore from '@seald-io/nedb'
import { DATABASES_CONFIG_FILE } from '../constants'

let dbPath = null

if (process.env.IS_ELECTRON_MAIN) {
  const { app } = require('electron')
  const { join } = require('path')
  // this code only runs in the electron main process, so hopefully using sync fs code here should be fine 😬
  const { statSync, realpathSync, existsSync, readFileSync, writeFileSync } = require('fs')
  const userDataPath = app.getPath('userData') // This is based on the user's OS
  const configPath = join(userDataPath, DATABASES_CONFIG_FILE)

  let dbsPath = userDataPath

  if (existsSync(configPath)) {
    try {
      const config = JSON.parse(readFileSync(configPath, 'utf-8'))

      if (typeof config.databasesPath === 'string' && config.databasesPath.length > 0 && existsSync(config.databasesPath)) {
        dbsPath = config.databasesPath
      }
    } catch (error) { console.error('Unable to load Freetube databases path: ', error) }
  } else {
    try {
      const databasesPathData =
        {
          databasesPath: userDataPath
        }
      writeFileSync(configPath, JSON.stringify(databasesPathData, null, 2))
    } catch (error) { console.error('Unable to create databases config file: ', error) }
  }

  dbPath = (dbName) => {
    let path = join(dbsPath, `${dbName}.db`)

    // returns undefined if the path doesn't exist
    if (statSync(path, { throwIfNoEntry: false })?.isSymbolicLink) {
      path = realpathSync(path)
    }

    return path
  }
} else {
  dbPath = (dbName) => `${dbName}.db`
}

/**
 * @param {string} name
 */
function createDatastore(name) {
  return new Datastore({
    filename: dbPath(name),
    autoload: !process.env.IS_ELECTRON_MAIN,
    // Automatically clean up corrupted data, instead of crashing
    corruptAlertThreshold: 1
  })
}

export const settings = createDatastore('settings')
export const profiles = createDatastore('profiles')
export const playlists = createDatastore('playlists')
export const history = createDatastore('history')
export const searchHistory = createDatastore('search-history')
export const subscriptionCache = createDatastore('subscription-cache')
