import android from 'android'
import { awaitAsyncResult } from './jsinterface'
import { readFile } from './storage'

export const MIME_TYPES = {
  db: 'application/octet-stream',
  json: 'application/json',
  csv: 'text/comma-separated-values',
  opml: 'application/octet-stream',
  xml: 'text/xml'
}
export const FILE_TYPES = Object.fromEntries(Object.entries(MIME_TYPES).map(([key, value]) => [value, key]))

/**
 * @typedef SaveDialogResponse
 * @property {boolean} canceled
 * @property {'SUCCESS'|'USER_CANCELED'} type
 * @property {string?} uri
 * @property {string?} name
 * @property {Function?} text
 */

/**
 * Handles the response of a `requestDialog` function from the bridge
 * @param {string} promiseId
 * @returns {Promise<SaveDialogResponse>} either a uri based on the user's input or a cancelled response
 */
async function handleDialogResponse(promiseId) {
  // await the promise returned from the ☕ bridge
  let response = await awaitAsyncResult(promiseId)
  // handle case if user cancels prompt
  if (response === 'USER_CANCELED') {
    return {
      canceled: true,
      type: 'USER_CANCELED',
      uri: null,
      name: null,
      text: null
    }
  } else {
    response = JSON.parse(response)
    return {
      canceled: false,
      type: 'SUCCESS',
      uri: response.uri,
      name: response.fileName,
      async text() {
        return await readFile(response.uri)
      }
    }
  }
}

/**
 * Requests a save file dialog
 * @param {string} fileName name of requested file
 * @param {string} fileType mime type
 * @returns {Promise<SaveDialogResponse>} either a uri based on the user's input or a cancelled response
 */
export function requestSaveDialog(fileName, fileType) {
  // request a 💾save dialog
  const promiseId = android.requestSaveDialog(fileName, fileType)
  return handleDialogResponse(promiseId)
}

/**
 * Requests an open file dialog
 * @param {string[]} fileTypes mime type of acceptable inputs
 * @returns {Promise<SaveDialogResponse>} either a uri based on the user's input or a cancelled response
 */
export function requestOpenDialog(fileTypes) {
  const types = Array.from(new Set(fileTypes.flatMap((type) => {
    if (type in MIME_TYPES) return [MIME_TYPES[type]]
    if (type === 'application/x-freetube-db') return [type, MIME_TYPES.db]
    if (type === 'application/xml') return [type, MIME_TYPES.xml]
    if (type === 'text/csv') return [type, MIME_TYPES.csv]
    return [type]
  })))

  // request a 🗄file open dialog
  const promiseId = android.requestOpenDialog(types.join(','))
  return handleDialogResponse(promiseId)
}
