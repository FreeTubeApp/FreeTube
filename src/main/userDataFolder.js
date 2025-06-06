import { app } from 'electron'
import { existsSync } from 'fs'
import path from 'path'
import asyncFs from 'fs/promises'
import {
  STORE_USER_DATA_IN_APP_FOLDER_SWITCH_FILENAME,
} from '../constants'

const DEFAULT_USER_DATA_PATH = app.getPath('userData')
// For portable version (single executable) the config should be stored next to that executable file
// Otherwise use the folder of many files (with `FreeTube.exe` in it)
const APP_FOLDER_PATH = process.env.PORTABLE_EXECUTABLE_DIR ?? path.dirname(process.execPath)
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
// Windows & NOT installer version & flag file exists
export const STORE_USER_DATA_IN_APP_FOLDER_ALLOWED =
  process.platform === 'win32' &&
  !existsSync(path.join(path.dirname(process.execPath), 'Uninstall FreeTube.exe'))
export const STORE_USER_DATA_IN_APP_FOLDER_ENABLED =
  STORE_USER_DATA_IN_APP_FOLDER_ALLOWED &&
  existsSync(USER_DATA_IN_APP_FOLDER_SWITCH_FILE_PATH)
export const USER_DATA_PATH = STORE_USER_DATA_IN_APP_FOLDER_ENABLED ? APP_FOLDER_USER_DATA_PATH : DEFAULT_USER_DATA_PATH

export async function toggleStoreUserDataInAppFolderEnabledAndMigrateFiles() {
  // Migrate files first, only toggle setting when migration successful
  if (STORE_USER_DATA_IN_APP_FOLDER_ENABLED) {
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
