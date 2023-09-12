import fs from 'fs/promises'

import { IpcChannels } from '../../constants'
import FtToastEvents from '../components/ft-toast/ft-toast-events'
import i18n from '../i18n/index'
import router from '../router/index'

// allowed characters in channel handle: A-Z, a-z, 0-9, -, _, .
// https://support.google.com/youtube/answer/11585688#change_handle
export const CHANNEL_HANDLE_REGEX = /^@[\w.-]{3,30}$/

const PUBLISHED_TEXT_REGEX = /(\d+)\s?([a-z]+)/i
/**
 * @param {string} publishedText
 */
export function calculatePublishedDate(publishedText) {
  const date = new Date()
  if (publishedText === 'Live') {
    return publishedText
  }

  const match = publishedText.match(PUBLISHED_TEXT_REGEX)

  const timeFrame = match[2]
  const timeAmount = parseInt(match[1])
  let timeSpan = null

  if (timeFrame.startsWith('second') || timeFrame === 's') {
    timeSpan = timeAmount * 1000
  } else if (timeFrame.startsWith('minute') || timeFrame === 'm') {
    timeSpan = timeAmount * 60000
  } else if (timeFrame.startsWith('hour') || timeFrame === 'h') {
    timeSpan = timeAmount * 3600000
  } else if (timeFrame.startsWith('day') || timeFrame === 'd') {
    timeSpan = timeAmount * 86400000
  } else if (timeFrame.startsWith('week') || timeFrame === 'w') {
    timeSpan = timeAmount * 604800000
  } else if (timeFrame.startsWith('month') || timeFrame === 'mo') {
    timeSpan = timeAmount * 2592000000
  } else if (timeFrame.startsWith('year') || timeFrame === 'y') {
    timeSpan = timeAmount * 31556952000
  }

  return date.getTime() - timeSpan
}

export function toLocalePublicationString ({ publishText, isLive = false, isUpcoming = false, isRSS = false }) {
  if (isLive) {
    return i18n.tc('Global.Counts.Watching Count', 0, { count: 0 })
  } else if (isUpcoming || publishText === null) {
    // the check for null is currently just an inferring of knowledge, because there is no other possibility left
    return `${i18n.t('Video.Published.Upcoming')}: ${publishText}`
  } else if (isRSS) {
    return publishText
  }

  const match = publishText.match(PUBLISHED_TEXT_REGEX)
  const singular = (match[1] === '1')
  let translationKey = ''
  switch (match[2].substring(0, 2)) {
    case 'se':
    case 's':
      translationKey = 'Video.Published.Second'
      break
    case 'mi':
    case 'm':
      translationKey = 'Video.Published.Minute'
      break
    case 'ho':
    case 'h':
      translationKey = 'Video.Published.Hour'
      break
    case 'da':
    case 'd':
      translationKey = 'Video.Published.Day'
      break
    case 'we':
    case 'w':
      translationKey = 'Video.Published.Week'
      break
    case 'mo':
      translationKey = 'Video.Published.Month'
      break
    case 'ye':
    case 'y':
      translationKey = 'Video.Published.Year'
      break
    default:
      return publishText
  }
  if (!singular) {
    translationKey += 's'
  }

  const unit = i18n.t(translationKey)
  return i18n.t('Video.Publicationtemplate', { number: match[1], unit })
}

export function buildVTTFileLocally(storyboard, videoLengthSeconds) {
  let vttString = 'WEBVTT\n\n'
  // how many images are in one image
  const numberOfSubImagesPerImage = storyboard.columns * storyboard.rows
  // the number of storyboard images
  const numberOfImages = Math.ceil(storyboard.thumbnail_count / numberOfSubImagesPerImage)
  let intervalInSeconds
  if (storyboard.interval > 0) {
    intervalInSeconds = storyboard.interval / 1000
  } else {
    intervalInSeconds = videoLengthSeconds / (numberOfImages * numberOfSubImagesPerImage)
  }
  let startHours = 0
  let startMinutes = 0
  let startSeconds = 0
  let endHours = 0
  let endMinutes = 0
  let endSeconds = intervalInSeconds
  for (let i = 0; i < numberOfImages; i++) {
    const currentUrl = storyboard.template_url.replace('$M.jpg', `${i}.jpg`)
    let xCoord = 0
    let yCoord = 0
    for (let j = 0; j < numberOfSubImagesPerImage; j++) {
      // add the timestamp information
      const paddedStartHours = startHours.toString().padStart(2, '0')
      const paddedStartMinutes = startMinutes.toString().padStart(2, '0')
      const paddedStartSeconds = startSeconds.toFixed(3).padStart(6, '0')
      const paddedEndHours = endHours.toString().padStart(2, '0')
      const paddedEndMinutes = endMinutes.toString().padStart(2, '0')
      const paddedEndSeconds = endSeconds.toFixed(3).padStart(6, '0')
      vttString += `${paddedStartHours}:${paddedStartMinutes}:${paddedStartSeconds} --> ${paddedEndHours}:${paddedEndMinutes}:${paddedEndSeconds}\n`
      // add the current image url as well as the x, y, width, height information
      vttString += `${currentUrl}#xywh=${xCoord},${yCoord},${storyboard.thumbnail_width},${storyboard.thumbnail_height}\n\n`
      // update the variables
      startHours = endHours
      startMinutes = endMinutes
      startSeconds = endSeconds
      endSeconds += intervalInSeconds
      if (endSeconds >= 60) {
        endSeconds -= 60
        endMinutes += 1
      }
      if (endMinutes >= 60) {
        endMinutes -= 60
        endHours += 1
      }
      // x coordinate can only be smaller than the width of one subimage * the number of subimages per row
      xCoord = (xCoord + storyboard.thumbnail_width) % (storyboard.thumbnail_width * storyboard.columns)
      // only if the x coordinate is , so in a new row, we have to update the y coordinate
      if (xCoord === 0) {
        yCoord += storyboard.thumbnail_height
      }
    }
  }
  return vttString
}

export async function getFormatsFromHLSManifest(manifestUrl) {
  const response = await fetch(manifestUrl)
  const text = await response.text()

  const lines = text.split('\n').filter(line => line)

  const formats = []
  let currentHeight = 0
  let currentFPS = 0

  for (const line of lines) {
    if (line.startsWith('#')) {
      if (!line.startsWith('#EXT-X-STREAM-INF:')) {
        continue
      }

      const parts = line.split(',')
      const height = parts.find(part => part.startsWith('RESOLUTION'))
        .split('x')[1]
      const fps = parts.find(part => part.startsWith('FRAME-RATE'))
        .split('=')[1]
      currentHeight = parseInt(height)
      currentFPS = parseInt(fps)
    } else {
      formats.push({
        height: currentHeight,
        fps: currentFPS,
        url: line.trim()
      })
    }
  }

  return formats
}

export function showToast(message, time = null, action = null) {
  FtToastEvents.dispatchEvent(new CustomEvent('toast-open', {
    detail: {
      message,
      time,
      action
    }
  }))
}

/**
   * This writes to the clipboard. If an error occurs during the copy,
   * a toast with the error is shown. If the copy is successful and
   * there is a success message, a toast with that message is shown.
   * @param {string} content the content to be copied to the clipboard
   * @param {null|string} messageOnSuccess the message to be displayed as a toast when the copy succeeds (optional)
   * @param {null|string} messageOnError the message to be displayed as a toast when the copy fails (optional)
   */
export async function copyToClipboard(content, { messageOnSuccess = null, messageOnError = null } = {}) {
  if (navigator.clipboard !== undefined && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(content)
      if (messageOnSuccess !== null) {
        showToast(messageOnSuccess)
      }
    } catch (error) {
      console.error(`Failed to copy ${content} to clipboard`, error)
      if (messageOnError !== null) {
        showToast(`${messageOnError}: ${error}`, 5000)
      } else {
        showToast(`${i18n.t('Clipboard.Copy failed')}: ${error}`, 5000)
      }
    }
  } else {
    showToast(i18n.t('Clipboard.Cannot access clipboard without a secure connection'), 5000)
  }
}

/**
 * Opens a link in the default web browser or a new tab in the web builds
 * @param {string} url the URL to open
 */
export function openExternalLink(url) {
  if (process.env.IS_ELECTRON) {
    const ipcRenderer = require('electron').ipcRenderer
    ipcRenderer.send(IpcChannels.OPEN_EXTERNAL_LINK, url)
  } else {
    window.open(url, '_blank')
  }
}

/**
 * Opens an internal path in the same or a new window.
 * Optionally with query params and setting the contents of the search bar in the new window.
 * @param {object} params
 * @param {string} params.path the internal path to open
 * @param {boolean} params.doCreateNewWindow set to true to open a new window
 * @param {object} params.query the query params to use (optional)
 * @param {string} params.searchQueryText the text to show in the search bar in the new window (optional)
 */
export function openInternalPath({ path, query = {}, doCreateNewWindow, searchQueryText = null }) {
  if (process.env.IS_ELECTRON && doCreateNewWindow) {
    const { ipcRenderer } = require('electron')

    // Combine current document path and new "hash" as new window startup URL
    const newWindowStartupURL = new URL(window.location.href)
    newWindowStartupURL.hash = `${path}?${(new URLSearchParams(query)).toString()}`

    ipcRenderer.send(IpcChannels.CREATE_NEW_WINDOW, {
      windowStartupUrl: newWindowStartupURL.toString(),
      searchQueryText
    })
  } else {
    router.push({
      path,
      query
    })
  }
}

export async function showOpenDialog (options) {
  if (process.env.IS_ELECTRON) {
    const { ipcRenderer } = require('electron')
    return await ipcRenderer.invoke(IpcChannels.SHOW_OPEN_DIALOG, options)
  } else {
    return await new Promise((resolve) => {
      const fileInput = document.createElement('input')
      fileInput.setAttribute('type', 'file')
      if (options?.filters[0]?.extensions !== undefined) {
        // this will map the given extensions from the options to the accept attribute of the input
        fileInput.setAttribute('accept', options.filters[0].extensions.map((extension) => { return `.${extension}` }).join(', '))
      }
      fileInput.onchange = () => {
        const files = Array.from(fileInput.files)
        resolve({ canceled: false, files, filePaths: files.map(({ name }) => { return name }) })
        delete fileInput.onchange
      }
      const listenForEnd = () => {
        window.removeEventListener('focus', listenForEnd)
        // 1 second timeout on the response from the file picker to prevent awaiting forever
        setTimeout(() => {
          if (fileInput.files.length === 0 && typeof fileInput.onchange === 'function') {
            // if there are no files and the onchange has not been triggered, the file-picker was canceled
            resolve({ canceled: true })
            delete fileInput.onchange
          }
        }, 1000)
      }
      window.addEventListener('focus', listenForEnd)
      fileInput.click()
    })
  }
}

/**
 * @param {object} response the response from `showOpenDialog`
 * @param {number} index which file to read (defaults to the first in the response)
 * @returns the text contents of the selected file
 */
export function readFileFromDialog(response, index = 0) {
  return new Promise((resolve, reject) => {
    if (process.env.IS_ELECTRON) {
      // if this is Electron, use fs
      fs.readFile(response.filePaths[index])
        .then(data => {
          resolve(new TextDecoder('utf-8').decode(data))
        })
        .catch(reject)
    } else {
      // if this is web, use FileReader
      try {
        const reader = new FileReader()
        reader.onload = function (file) {
          resolve(file.currentTarget.result)
        }
        reader.readAsText(response.files[index])
      } catch (exception) {
        reject(exception)
      }
    }
  })
}

export async function showSaveDialog (options) {
  if (process.env.IS_ELECTRON) {
    const { ipcRenderer } = require('electron')
    return await ipcRenderer.invoke(IpcChannels.SHOW_SAVE_DIALOG, options)
  } else {
    // If the native filesystem api is available
    if ('showSaveFilePicker' in window) {
      return {
        canceled: false,
        handle: await window.showSaveFilePicker({
          suggestedName: options.defaultPath.split('/').at(-1),
          types: options.filters[0]?.extensions?.map((extension) => {
            return {
              accept: {
                'application/octet-stream': '.' + extension
              }
            }
          })
        })
      }
    } else {
      return { canceled: false, filePath: options.defaultPath }
    }
  }
}

/**
* Write to a file picked out from the `showSaveDialog` picker
* @param {object} response the response from `showSaveDialog`
* @param {string} content the content to be written to the file selected by the dialog
*/
export async function writeFileFromDialog (response, content) {
  if (process.env.IS_ELECTRON) {
    const { filePath } = response
    return await fs.writeFile(filePath, content)
  } else {
    if ('showOpenFilePicker' in window) {
      const { handle } = response
      const writableStream = await handle.createWritable()
      await writableStream.write(content)
      await writableStream.close()
    } else {
      // If the native filesystem api is not available,
      const { filePath } = response
      const filename = filePath.split('/').at(-1)
      const a = document.createElement('a')
      const url = URL.createObjectURL(new Blob([content], { type: 'application/octet-stream' }))
      a.setAttribute('href', url)
      a.setAttribute('download', encodeURI(filename))
      a.click()
    }
  }
}

/**
 * This creates an absolute web url from a given path.
 * It will assume all given paths are relative to the current window location.
 * @param {string} path relative path to resource
 * @returns {string} absolute web path
 */
export function createWebURL(path) {
  const url = new URL(window.location.href)
  const { origin } = url
  let windowPath = url.pathname
  // Remove the html file name from the path
  if (windowPath.endsWith('.html')) {
    windowPath = windowPath.replace(/[^./]*\.html$/, '')
  }
  // Remove proceeding slash in given path if there is one
  if (path.startsWith('/')) {
    path = path.substring(1, path.length)
  }
  // Remove trailing slash if there is one
  if (windowPath.endsWith('/')) {
    windowPath = windowPath.substring(0, windowPath.length - 1)
  }
  return `${origin}${windowPath}/${path}`
}

// strip html tags but keep <br>, <b>, </b> <s>, </s>, <i>, </i>
export function stripHTML(value) {
  return value.replaceAll(/(<(?!br|\/?[abis]|img>)([^>]+)>)/gi, '')
}

/**
 * This formats the duration of a video in seconds into a user friendly timestamp.
 * It will return strings like LIVE or UPCOMING, without making any changes
 * @param {string|number} lengthSeconds the video duration in seconds or the strings LIVE or UPCOMING
 * @returns {string} timestamp or LIVE or UPCOMING
 */
export function formatDurationAsTimestamp(lengthSeconds) {
  if (typeof lengthSeconds === 'string') {
    return lengthSeconds
  }

  if (lengthSeconds === 0) {
    return '0:00'
  }

  let hours = 0

  if (lengthSeconds >= 3600) {
    hours = Math.floor(lengthSeconds / 3600)
    lengthSeconds = lengthSeconds - hours * 3600
  }

  let minutes = Math.floor(lengthSeconds / 60)
  if (minutes < 10 && hours > 0) {
    minutes = '0' + minutes
  }

  let seconds = lengthSeconds - minutes * 60
  if (seconds < 10) {
    seconds = '0' + seconds
  }

  let timestamp = ''
  if (hours > 0) {
    timestamp = hours + ':' + minutes + ':' + seconds
  } else {
    timestamp = minutes + ':' + seconds
  }

  return timestamp
}

export function searchFiltersMatch(filtersA, filtersB) {
  return filtersA?.sortBy === filtersB?.sortBy &&
    filtersA?.time === filtersB?.time &&
    filtersA?.type === filtersB?.type &&
    filtersA?.duration === filtersB?.duration
}

export function replaceFilenameForbiddenChars(filenameOriginal) {
  let filenameNew = filenameOriginal
  let forbiddenChars = {}
  switch (process.platform) {
    case 'win32':
      forbiddenChars = {
        '<': '＜', // U+FF1C
        '>': '＞', // U+FF1E
        ':': '：', // U+FF1A
        '"': '＂', // U+FF02
        '/': '／', // U+FF0F
        '\\': '＼', // U+FF3C
        '|': '｜', // U+FF5C
        '?': '？', // U+FF1F
        '*': '＊' // U+FF0A
      }
      break
    case 'darwin':
      forbiddenChars = { '/': '／', ':': '：' }
      break
    case 'linux':
      forbiddenChars = { '/': '／' }
      break
    default:
      break
  }

  for (const forbiddenChar in forbiddenChars) {
    filenameNew = filenameNew.replaceAll(forbiddenChar, forbiddenChars[forbiddenChar])
  }
  return filenameNew
}

export async function getSystemLocale() {
  let locale
  if (process.env.IS_ELECTRON) {
    const { ipcRenderer } = require('electron')
    locale = await ipcRenderer.invoke(IpcChannels.GET_SYSTEM_LOCALE)
  } else {
    if (navigator && navigator.language) {
      locale = navigator.language
    }
  }

  return locale || 'en-US'
}

export async function getUserDataPath() {
  if (process.env.IS_ELECTRON) {
    const { ipcRenderer } = require('electron')
    return await ipcRenderer.invoke(IpcChannels.GET_USER_DATA_PATH)
  } else {
    // TODO: implement getUserDataPath web compatible callback
    return null
  }
}

export async function getPicturesPath() {
  if (process.env.IS_ELECTRON) {
    const { ipcRenderer } = require('electron')
    return await ipcRenderer.invoke(IpcChannels.GET_PICTURES_PATH)
  } else {
    return null
  }
}

export function extractNumberFromString(str) {
  if (typeof str === 'string') {
    return parseInt(str.replaceAll(/\D+/g, ''))
  } else {
    return NaN
  }
}

export function showExternalPlayerUnsupportedActionToast(externalPlayer, actionName) {
  const action = i18n.t(`Video.External Player.Unsupported Actions.${actionName}`)
  const message = i18n.t('Video.External Player.UnsupportedActionTemplate', { externalPlayer, action })
  showToast(message)
}

export function getVideoParamsFromUrl(url) {
  /** @type {URL} */
  let urlObject
  const paramsObject = { videoId: null, timestamp: null, playlistId: null }
  try {
    urlObject = new URL(url)
  } catch (e) {
    return paramsObject
  }

  function extractParams(videoId) {
    paramsObject.videoId = videoId
    paramsObject.timestamp = urlObject.searchParams.get('t')
  }

  const extractors = [
    // anything with /watch?v=
    function () {
      if (urlObject.pathname === '/watch' && urlObject.searchParams.has('v')) {
        extractParams(urlObject.searchParams.get('v'))
        paramsObject.playlistId = urlObject.searchParams.get('list')
        return paramsObject
      }
    },
    // youtu.be
    function () {
      if (urlObject.host === 'youtu.be' && /^\/[\w-]+$/.test(urlObject.pathname)) {
        extractParams(urlObject.pathname.slice(1))
        return paramsObject
      }
    },
    // youtube.com/embed
    function () {
      if (/^\/embed\/[\w-]+$/.test(urlObject.pathname)) {
        const urlTail = urlObject.pathname.replace('/embed/', '')
        if (urlTail === 'videoseries') {
          paramsObject.playlistId = urlObject.searchParams.get('list')
        } else {
          extractParams(urlTail)
        }
        return paramsObject
      }
    },
    // youtube.com/shorts
    function () {
      if (/^\/shorts\/[\w-]+$/.test(urlObject.pathname)) {
        extractParams(urlObject.pathname.replace('/shorts/', ''))
        return paramsObject
      }
    },
    // youtube.com/live
    function () {
      if (/^\/live\/[\w-]+$/.test(urlObject.pathname)) {
        extractParams(urlObject.pathname.replace('/live/', ''))
        return paramsObject
      }
    },
    // cloudtube
    function () {
      if (/^cadence\.(gq|moe)$/.test(urlObject.host) && /^\/cloudtube\/video\/[\w-]+$/.test(urlObject.pathname)) {
        extractParams(urlObject.pathname.slice('/cloudtube/video/'.length))
        return paramsObject
      }
    }
  ]

  return extractors.reduce((a, c) => a || c(), null) || paramsObject
}

/**
 * This will match sequences of upper case characters and convert them into title cased words.
 * @param {string} title the title to process
 * @param {number} minUpperCase the minimum number of consecutive upper case characters to match
 * @returns {string} the title with upper case characters removed
 */
export function toDistractionFreeTitle(title, minUpperCase = 3) {
  const firstValidCharIndex = (word) => {
    const reg = /[\p{L}]/u
    return word.search(reg)
  }

  const capitalizedWord = (word) => {
    const chars = word.split('')
    const index = firstValidCharIndex(word)
    chars[index] = chars[index].toUpperCase()
    return chars.join('')
  }

  const reg = RegExp(`[\\p{Lu}|']{${minUpperCase},}`, 'ug')
  return title.replace(reg, x => capitalizedWord(x.toLowerCase()))
}

export function formatNumber(number, options = undefined) {
  return Intl.NumberFormat([i18n.locale.replace('_', '-'), 'en'], options).format(number)
}

export function getTodayDateStrLocalTimezone() {
  const timeNow = new Date()
  // `Date#getTimezoneOffset` returns the difference, in minutes
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset
  const timeNowStr = new Date(timeNow.getTime() - (timeNow.getTimezoneOffset() * 60000)).toISOString()
  // `Date#toISOString` returns string with `T` as date/time separator (ISO 8601 format)
  // e.g. 2011-10-05T14:48:00.000Z
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
  return timeNowStr.split('T')[0]
}

/**
 * Escapes HTML tags to avoid XSS
 * @param {string} untrusted
 * @returns {string}
 */
export function escapeHTML(untrusted) {
  return untrusted.replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&apos;')
}

/**
 * Performs a deep copy of a javascript object
 * @param {Object} obj
 * @returns {Object}
 */
export function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj))
}
