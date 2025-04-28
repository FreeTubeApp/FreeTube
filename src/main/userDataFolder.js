import { app } from 'electron'
import { existsSync } from 'fs'
import path from 'path'
import asyncFs from 'fs/promises'
import {
  STORE_USER_DATA_IN_APP_FOLDER_SWITCH_FILENAME,
} from '../constants'

const DEFAULT_USER_DATA_PATH = app.getPath('userData')
const APP_FOLDER_PATH = path.dirname(process.execPath)
const APP_FOLDER_USER_DATA_PATH = path.join(APP_FOLDER_PATH, 'userData')
const USER_DATA_IN_APP_FOLDER_SWITCH_FILE_PATH = path.join(APP_FOLDER_PATH, STORE_USER_DATA_IN_APP_FOLDER_SWITCH_FILENAME)
const TO_BE_MIGRATED_FILES = [
  // All files in src/datastores/index.js & flag file for experimental setting
  'settings.db',
  'profiles.db',
  'playlists.db',
  'history.db',
  'search-history.db',
  'subscription-cache.db',
  'experiment-replace-http-cache',
]

export function getUserDataPath() {
  return getStoreUserDataInAppFolderEnabled() ? APP_FOLDER_USER_DATA_PATH : DEFAULT_USER_DATA_PATH
}

export function getStoreUserDataInAppFolderEnabled() {
  return process.platform === 'win32' && existsSync(USER_DATA_IN_APP_FOLDER_SWITCH_FILE_PATH)
}

export async function toggleStoreUserDataInAppFolderEnabledAndMigrateFiles() {
  // Migrate files first, only toggle setting when migration successful
  if (getStoreUserDataInAppFolderEnabled()) {
    await migrateFilesFromHereToThere(APP_FOLDER_USER_DATA_PATH, DEFAULT_USER_DATA_PATH)
    await asyncFs.rm(USER_DATA_IN_APP_FOLDER_SWITCH_FILE_PATH)
  } else {
    await migrateFilesFromHereToThere(DEFAULT_USER_DATA_PATH, APP_FOLDER_USER_DATA_PATH)
    // create an empty file
    const handle = await asyncFs.open(USER_DATA_IN_APP_FOLDER_SWITCH_FILE_PATH, 'w')
    await handle.close()
  }
}

async function migrateFilesFromHereToThere(herePath, therePath) {
  await asyncFs.mkdir(therePath, { recursive: true })

  return Promise.all(
    TO_BE_MIGRATED_FILES.map(async (filename) => {
      const sourceFilepath = path.join(herePath, filename)
      const destFilepath = path.join(therePath, filename)
      if (!existsSync(sourceFilepath)) {
        if (existsSync(destFilepath)) {
          return asyncFs.rm(destFilepath)
        }
        return
      }

      return asyncFs.copyFile(sourceFilepath, destFilepath)
    })
  )
}
