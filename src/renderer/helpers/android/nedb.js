/**
 * Way data is stored for this database
 *
 * This version is the browser version and uses [localforage]{@link https://github.com/localForage/localForage} which chooses the best option depending on user browser (IndexedDB then WebSQL then localStorage).
 * @module storageBrowser
 * @see module:storage
 * @see module:storageReactNative
 * @private
 */

import { getCurrentDataDirectory, getFullUri, writeFile, readFile } from './storage'

/**
 * Returns Promise<true> if file exists.
 *
 * @param {string} file
 * @return {Promise<boolean>}
 * @async
 * @alias module:storageBrowser.existsAsync
 */
export async function existsAsync (file) {
  try {
    return await getFullUri(file) !== null
  } catch (error) {
    console.warn('NeDB - storage.android - existsAsync:', error)
    return false
  }
}

/**
 * Moves the item from one path to another.
 * @param {string} oldPath
 * @param {string} newPath
 * @return {Promise<void>}
 * @alias module:storageBrowser.renameAsync
 * @async
 */
export async function renameAsync (oldPath, newPath) {
  try {
    const oldUri = await getFullUri(oldPath)
    const content = await readFile(oldUri)
    const directory = await getCurrentDataDirectory()
    const newUri = await directory.createFile(newPath)
    await writeFile(newUri, content)
  } catch (err) {
    console.warn('NeDB - storage.browser - renameAsync:', err)
    console.warn('An error happened while renaming, skip')
  }
}

/**
 * Saves the item at given path.
 * @param {string} file
 * @param {string} data
 * @param {object} [options]
 * @return {Promise<void>}
 * @alias module:storageBrowser.writeFileAsync
 * @async
 */
export async function writeFileAsync(file, data, options) {
  try {
    let uri = await getFullUri(file)
    if (uri === null) {
      const directory = await getCurrentDataDirectory()
      uri = await directory.createFile(file)
    }
    await writeFile(uri, data)
  } catch (error) {
    console.warn('NeDB - storage.browser - writeFileAsync:', error)
    console.warn('An error happened while writing, skip')
  }
}

/**
 * Append to the item at given path.
 * @function
 * @param {string} filename
 * @param {string} toAppend
 * @param {object} [options]
 * @return {Promise<void>}
 * @alias module:storageBrowser.appendFileAsync
 * @async
 */
export async function appendFileAsync(filename, toAppend, options) {
  // Options do not matter in browser setup
  try {
    let uri = await getFullUri(filename)
    if (uri === null) {
      const directory = await getCurrentDataDirectory()
      uri = await directory.createFile(filename)
    }
    await writeFile(uri, toAppend, true)
  } catch (error) {
    console.warn('NeDB - storage.browser - appendFileAsync:', error)
    console.warn('An error happened appending to file writing, skip')
  }
}

/**
 * Read data at given path.
 * @function
 * @param {string} filename
 * @param {object} [options]
 * @return {Promise<Buffer>}
 * @alias module:storageBrowser.readFileAsync
 * @async
 */
export async function readFileAsync(filename, options) {
  try {
    const uri = await getFullUri(filename)
    if (uri === null) {
      throw new Error('File not found!')
    }
    const content = await readFile(uri)
    return content
  } catch (error) {
    console.warn('NeDB - storage.browser - readFileAsync:', error)
    console.warn('An error happened while reading, skip')
    return ''
  }
}

/**
 * Async version of {@link module:storageBrowser.unlink}.
 * @function
 * @param {string} filename
 * @return {Promise<void>}
 * @async
 * @alias module:storageBrowser.unlink
 */
export async function unlinkAsync(filename) { Promise.resolve() }

/**
 * Shim for {@link module:storage.mkdirAsync}, nothing to do, no directories will be used on the browser.
 * @function
 * @param {string} path
 * @param {object} [options]
 * @return {Promise<void|string>}
 * @alias module:storageBrowser.mkdirAsync
 * @async
 */
export async function mkdirAsync(path, options) { Promise.resolve() }

/**
 * Shim for {@link module:storage.ensureParentDirectoryExistsAsync}, nothing to do, no directories will be used on the browser.
 * @function
 * @param {string} file
 * @param {number} [mode]
 * @return {Promise<void|string>}
 * @alias module:storageBrowser.ensureParentDirectoryExistsAsync
 * @async
 */
export async function ensureParentDirectoryExistsAsync(file, mode) { Promise.resolve() }

/**
 * Shim for {@link module:storage.ensureDatafileIntegrityAsync}, nothing to do, no data corruption possible in the browser.
 * @param {string} filename
 * @return {Promise<void>}
 * @alias module:storageBrowser.ensureDatafileIntegrityAsync
 */
export async function ensureDatafileIntegrityAsync(filename) { Promise.resolve() }

/**
 * Fully write or rewrite the datafile, immune to crashes during the write operation (data will not be lost)
 * @param {string} filename
 * @param {string[]} lines
 * @return {Promise<void>}
 * @alias module:storageBrowser.crashSafeWriteFileLinesAsync
 */
export async function crashSafeWriteFileLinesAsync(filename, lines) {
  lines.push('') // Add final new line
  await writeFileAsync(filename, lines.join('\n'))
}
