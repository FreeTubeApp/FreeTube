import android from 'android'
import { awaitAsyncResult } from './jsinterface'
import { blobToBase64, reverseObject } from './utils'

export const DATA_DIRECTORY = 'data://'

const DATA_LOCATION = `${DATA_DIRECTORY}data-location.json`

const EXPECTED_FILES = ['profiles.db', 'settings.db', 'history.db', 'playlists.db', 'search-history.db', 'subscription-cache.db']

const EXPECTED_FILES_MAP = Object.fromEntries(EXPECTED_FILES.map((file) => { return [file, `${DATA_DIRECTORY}${file}`] }))

/**
 * a soft file read which returns '' if the file doesn't exist yet
 * @param {string} uri uri
 * @returns {Promise<string>} file contents or '' if no file was found
 */
export async function readFile(uri) {
  try {
    return await awaitAsyncResult(android.readFile(uri))
  } catch (exception) {
    console.warn(exception)
    return ''
  }
}

/**
 * @param {string} uri
 * @param {string|Blob} content
 * @param {bool?} append whether or not to append to the file (default: false)
 * @returns {Promise<boolean>} was able to successfully write?
 */
export async function writeFile(uri, content, append = false) {
  if (content instanceof Blob) {
    content = await blobToBase64(content)
  }
  try {
    if (append) {
      await awaitAsyncResult(android.appendFile(uri, content))
    } else {
      await awaitAsyncResult(android.writeFile(uri, content))
    }
    return true
  } catch (exception) {
    console.error(exception)
    const directory = await getCurrentDataDirectory()
    const key = reverseObject(directory.files)[uri]
    if (key) {
      console.warn(`Removing ${key} from known files since it errored!`)
      delete directory.files[key]
      await updateFilesInCurrentDataDirectory(directory.files)
    }
    throw exception
  }
}

/**
 * @typedef AndroidFile
 * @property {string} uri
 * @property {string} fileName
 */

/**
 * @callback CreateFile
 * @param {string} file name
 * @returns {Promise<string>} content uri to file
 */

/**
 * @callback ListFiles
 * @returns {Array<AndroidFile>}
 */

/**
 *
 * @typedef DirectoryHandle
 * @property {string} uri
 * @property {CreateFile} createFile
 * @property {ListFiles} listFiles
 */

/**
 *
 * @param {string} uri
 * @returns {DirectoryHandle}
 */
function restoreHandleFromDirectoryUri(uri) {
  if (uri === DATA_DIRECTORY) {
    return {
      uri,
      async createFile(fileName) {
        const uri = `${DATA_DIRECTORY}${fileName}`
        if (!await writeFile(uri, '', false)) throw new Error(`Unable to create ${fileName}`)
        return uri
      },
      listFiles() {
        return JSON.parse(android.listFilesInDataDir())
      }
    }
  }
  return {
    uri,
    createFile(fileName) {
      return android.createFileInTree(uri, fileName)
    },
    listFiles() {
      return JSON.parse(android.listFilesInTree(uri))
    }
  }
}

/**
 * @typedef {Array<AndroidFile>} FileList
 */

/**
 *
 * @param {Record<string, string>} files
 * @returns {FileList}
 */
function filesToEntries(files) {
  return Object.entries(files).map(([fileName, uri]) => {
    return {
      fileName,
      uri
    }
  })
}

/**
 *
 * @param {FileList} entries
 * @returns {Record<string, string>}
 */
function entriesToFiles(entries, strict = false) {
  if (!Array.isArray(entries)) throw new Error('Invalid data directory files')

  const files = {}
  for (const file of entries) {
    if (file === null || typeof file !== 'object') {
      if (strict) throw new Error('Invalid data directory file entry')
      continue
    }
    if (!EXPECTED_FILES.includes(file.fileName)) continue
    if (typeof file.uri !== 'string' || file.uri === '' || Object.hasOwn(files, file.fileName)) {
      throw new Error('Invalid data directory file entry')
    }
    files[file.fileName] = file.uri
  }
  return files
}

/**
 * @typedef FileMap
 * @property {Record<string, string>} files
 */

/**
 * @typedef {(DirectoryHandle & FileMap)|null} DataDirectory
 */

/** @type {DataDirectory} */
let currentDataDirectory = null

/** =
 * @returns {Promise<DataDirectory>}
 */
export async function getCurrentDataDirectory() {
  if (currentDataDirectory !== null) {
    return currentDataDirectory
  }
  const fileContent = await readFile(DATA_LOCATION)
  if (fileContent !== '') {
    try {
      const data = JSON.parse(fileContent)
      if (typeof data.directory !== 'string' || !Array.isArray(data.files)) {
        throw new Error('Invalid data directory mapping')
      }

      if (data.directory !== DATA_DIRECTORY && !android.isTreeAccessible(data.directory)) {
        console.warn('Saved data directory is no longer accessible, using internal storage')
      } else {
        const handle = restoreHandleFromDirectoryUri(data.directory)
        currentDataDirectory = {
          ...handle,
          files: entriesToFiles(data.files, true)
        }
        return currentDataDirectory
      }
    } catch (ex) {
      // handle corruption
      console.warn('Loaded data was incomplete!')
      console.error(ex)
    }
  }

  currentDataDirectory = {
    ...restoreHandleFromDirectoryUri(DATA_DIRECTORY),
    directory: DATA_DIRECTORY,
    files: EXPECTED_FILES_MAP
  }
  return currentDataDirectory
}

/**
 * Updates the files known in the current data dir
 * @param {Record<string, string>} files
 */
export async function updateFilesInCurrentDataDirectory(files) {
  currentDataDirectory.files = files
  await writeFile(DATA_LOCATION, JSON.stringify({
    directory: currentDataDirectory.uri,
    files: filesToEntries(currentDataDirectory.files)
  }, null, 2))
}

/**
 * @returns {Promise<DirectoryHandle & {canceled: boolean}>}
 */
async function requestDirectoryAccessDialog() {
  const uri = await awaitAsyncResult(android.requestDirectoryAccessDialog())
  if (uri === 'USER_CANCELED') {
    return {
      canceled: true
    }
  } else {
    return {
      ...restoreHandleFromDirectoryUri(uri),
      canceled: false
    }
  }
}

/**
 *
 * @param {DirectoryHandle} handle
 * @returns {Promise<Record<string, string>>}
 */
async function initializeDataDirectory(handle) {
  const foundFiles = entriesToFiles(handle.listFiles())
  const fileNames = Object.keys(foundFiles)
  for (let i = 0; i < EXPECTED_FILES.length; i++) {
    const indexOf = fileNames.indexOf(EXPECTED_FILES[i])
    if (indexOf === -1) {
      // not found
      foundFiles[EXPECTED_FILES[i]] = await handle.createFile(EXPECTED_FILES[i])
    }
  }
  return foundFiles
}

export async function selectDataDirectory(copyFiles = false, reset = false) {
  const newDirectory = reset ? restoreHandleFromDirectoryUri(DATA_DIRECTORY) : await requestDirectoryAccessDialog()

  if (newDirectory.canceled) {
    return
  }

  const newFiles = await initializeDataDirectory(newDirectory)
  const currentDirectory = await getCurrentDataDirectory()
  const hasOldLocation = currentDirectory.uri !== DATA_DIRECTORY

  if (copyFiles) {
    for (const fileName in currentDirectory.files) {
      if (EXPECTED_FILES.indexOf(fileName) !== -1) {
        const data = await readFile(currentDirectory.files[fileName])
        await writeFile(newFiles[fileName], data)
      }
    }
  }

  const mapping = JSON.stringify({
    directory: newDirectory.uri,
    files: filesToEntries(newFiles)
  })
  await writeFile(DATA_LOCATION, mapping)

  if (hasOldLocation) {
    android.revokePermissionForTree(currentDirectory.uri)
  }

  currentDataDirectory = {
    ...newDirectory,
    files: newFiles
  }

  if (!copyFiles) {
    android.restart()
  }
  return android.getDirectory(newDirectory.uri)
}

export async function getFullUri(partialUri) {
  const directoryData = await getCurrentDataDirectory()
  if (partialUri in directoryData.files) {
    return directoryData.files[partialUri]
  }

  const files = directoryData.listFiles()
  const possibleMatches = files.filter(file => partialUri === file.fileName)

  if (possibleMatches.length > 0) {
    directoryData.files[partialUri] = possibleMatches[0].uri
    await updateFilesInCurrentDataDirectory(directoryData.files)
    return possibleMatches[0].uri
  } else {
    return null
  }
}
