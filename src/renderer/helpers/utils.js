import { IpcChannels } from '../../constants'
import FtToastEvents from '../components/ft-toast/ft-toast-events'
import i18n from '../i18n/index'
import fs from 'fs'

export const colors = [
  { name: 'Red', value: '#d50000' },
  { name: 'Pink', value: '#C51162' },
  { name: 'Purple', value: '#AA00FF' },
  { name: 'DeepPurple', value: '#6200EA' },
  { name: 'Indigo', value: '#304FFE' },
  { name: 'Blue', value: '#2962FF' },
  { name: 'LightBlue', value: '#0091EA' },
  { name: 'Cyan', value: '#00B8D4' },
  { name: 'Teal', value: '#00BFA5' },
  { name: 'Green', value: '#00C853' },
  { name: 'LightGreen', value: '#64DD17' },
  { name: 'Lime', value: '#AEEA00' },
  { name: 'Yellow', value: '#FFD600' },
  { name: 'Amber', value: '#FFAB00' },
  { name: 'Orange', value: '#FF6D00' },
  { name: 'DeepOrange', value: '#DD2C00' },
  { name: 'DraculaCyan', value: '#8BE9FD' },
  { name: 'DraculaGreen', value: '#50FA7B' },
  { name: 'DraculaOrange', value: '#FFB86C' },
  { name: 'DraculaPink', value: '#FF79C6' },
  { name: 'DraculaPurple', value: '#BD93F9' },
  { name: 'DraculaRed', value: '#FF5555' },
  { name: 'DraculaYellow', value: '#F1FA8C' },
  { name: 'CatppuccinMochaRosewater', value: '#F5E0DC' },
  { name: 'CatppuccinMochaFlamingo', value: '#F2CDCD' },
  { name: 'CatppuccinMochaPink', value: '#F5C2E7' },
  { name: 'CatppuccinMochaMauve', value: '#CBA6F7' },
  { name: 'CatppuccinMochaRed', value: '#F38BA8' },
  { name: 'CatppuccinMochaMaroon', value: '#EBA0AC' },
  { name: 'CatppuccinMochaPeach', value: '#FAB387' },
  { name: 'CatppuccinMochaYellow', value: '#F9E2AF' },
  { name: 'CatppuccinMochaGreen', value: '#A6E3A1' },
  { name: 'CatppuccinMochaTeal', value: '#94E2D5' },
  { name: 'CatppuccinMochaSky', value: '#89DCEB' },
  { name: 'CatppuccinMochaSapphire', value: '#74C7EC' },
  { name: 'CatppuccinMochaBlue', value: '#89B4FA' },
  { name: 'CatppuccinMochaLavender', value: '#B4BEFE' }
]

export function getRandomColorClass() {
  const randomInt = Math.floor(Math.random() * colors.length)
  return 'main' + colors[randomInt].name
}

export function getRandomColor() {
  const randomInt = Math.floor(Math.random() * colors.length)
  return colors[randomInt].value
}

export function calculateColorLuminance(colorValue) {
  const cutHex = colorValue.substring(1, 7)
  const colorValueR = parseInt(cutHex.substring(0, 2), 16)
  const colorValueG = parseInt(cutHex.substring(2, 4), 16)
  const colorValueB = parseInt(cutHex.substring(4, 6), 16)

  const luminance = (0.299 * colorValueR + 0.587 * colorValueG + 0.114 * colorValueB) / 255

  if (luminance > 0.5) {
    return '#000000'
  } else {
    return '#FFFFFF'
  }
}

export function calculatePublishedDate(publishedText) {
  const date = new Date()
  if (publishedText === 'Live') {
    return publishedText
  }

  const textSplit = publishedText.split(' ')

  if (textSplit[0].toLowerCase() === 'streamed') {
    textSplit.shift()
  }

  const timeFrame = textSplit[1]
  const timeAmount = parseInt(textSplit[0])
  let timeSpan = null

  if (timeFrame.indexOf('second') > -1) {
    timeSpan = timeAmount * 1000
  } else if (timeFrame.indexOf('minute') > -1) {
    timeSpan = timeAmount * 60000
  } else if (timeFrame.indexOf('hour') > -1) {
    timeSpan = timeAmount * 3600000
  } else if (timeFrame.indexOf('day') > -1) {
    timeSpan = timeAmount * 86400000
  } else if (timeFrame.indexOf('week') > -1) {
    timeSpan = timeAmount * 604800000
  } else if (timeFrame.indexOf('month') > -1) {
    timeSpan = timeAmount * 2592000000
  } else if (timeFrame.indexOf('year') > -1) {
    timeSpan = timeAmount * 31556952000
  }

  return date.getTime() - timeSpan
}

export function toLocalePublicationString ({ publishText, isLive = false, isUpcoming = false, isRSS = false }) {
  if (isLive) {
    return '0' + i18n.t('Video.Watching')
  } else if (isUpcoming || publishText === null) {
    // the check for null is currently just an inferring of knowledge, because there is no other possibility left
    return `${i18n.t('Video.Published.Upcoming')}: ${publishText}`
  } else if (isRSS) {
    return publishText
  }
  const strings = publishText.split(' ')
  // filters out the streamed x hours ago and removes the streamed in order to keep the rest of the code working
  if (strings[0].toLowerCase() === 'streamed') {
    strings.shift()
  }
  const singular = (strings[0] === '1')
  let translationKey = ''
  switch (strings[1].substring(0, 2)) {
    case 'se':
      translationKey = 'Video.Published.Second'
      break
    case 'mi':
      translationKey = 'Video.Published.Minute'
      break
    case 'ho':
      translationKey = 'Video.Published.Hour'
      break
    case 'da':
      translationKey = 'Video.Published.Day'
      break
    case 'we':
      translationKey = 'Video.Published.Week'
      break
    case 'mo':
      translationKey = 'Video.Published.Month'
      break
    case 'ye':
      translationKey = 'Video.Published.Year'
      break
    default:
      return publishText
  }
  if (!singular) {
    translationKey += 's'
  }

  const unit = i18n.t(translationKey)
  return i18n.t('Video.Publicationtemplate', { number: strings[0], unit })
}

export function buildVTTFileLocally(storyboard) {
  let vttString = 'WEBVTT\n\n'
  // how many images are in one image
  const numberOfSubImagesPerImage = storyboard.sWidth * storyboard.sHeight
  // the number of storyboard images
  const numberOfImages = Math.ceil(storyboard.count / numberOfSubImagesPerImage)
  const intervalInSeconds = storyboard.interval / 1000
  let currentUrl = storyboard.url
  let startHours = 0
  let startMinutes = 0
  let startSeconds = 0
  let endHours = 0
  let endMinutes = 0
  let endSeconds = intervalInSeconds
  for (let i = 0; i < numberOfImages; i++) {
    let xCoord = 0
    let yCoord = 0
    for (let j = 0; j < numberOfSubImagesPerImage; j++) {
      // add the timestamp information
      const paddedStartHours = startHours.toString().padStart(2, '0')
      const paddedStartMinutes = startMinutes.toString().padStart(2, '0')
      const paddedStartSeconds = startSeconds.toString().padStart(2, '0')
      const paddedEndHours = endHours.toString().padStart(2, '0')
      const paddedEndMinutes = endMinutes.toString().padStart(2, '0')
      const paddedEndSeconds = endSeconds.toString().padStart(2, '0')
      vttString += `${paddedStartHours}:${paddedStartMinutes}:${paddedStartSeconds}.000 --> ${paddedEndHours}:${paddedEndMinutes}:${paddedEndSeconds}.000\n`
      // add the current image url as well as the x, y, width, height information
      vttString += currentUrl + `#xywh=${xCoord},${yCoord},${storyboard.width},${storyboard.height}\n\n`
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
      xCoord = (xCoord + storyboard.width) % (storyboard.width * storyboard.sWidth)
      // only if the x coordinate is , so in a new row, we have to update the y coordinate
      if (xCoord === 0) {
        yCoord += storyboard.height
      }
    }
    // make sure that there is no value like M0 or M1 in the parameters that gets replaced
    currentUrl = currentUrl.replace('M' + i.toString() + '.jpg', 'M' + (i + 1).toString() + '.jpg')
  }
  return vttString
}

export function showToast(message, time = null, action = null) {
  FtToastEvents.$emit('toast-open', message, time, action)
}

/**
   * This writes to the clipboard. If an error occurs during the copy,
   * a toast with the error is shown. If the copy is successful and
   * there is a success message, a toast with that message is shown.
   * @param {string} content the content to be copied to the clipboard
   * @param {string} messageOnSuccess the message to be displayed as a toast when the copy succeeds (optional)
   * @param {string} messageOnError the message to be displayed as a toast when the copy fails (optional)
   */
export async function copyToClipboard(content, { messageOnSuccess = null, messageOnError = null }) {
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

export function openExternalLink(url) {
  if (process.env.IS_ELECTRON) {
    const ipcRenderer = require('electron').ipcRenderer
    ipcRenderer.send(IpcChannels.OPEN_EXTERNAL_LINK, url)
  } else {
    window.open(url, '_blank')
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
      fs.readFile(response.filePaths[index], (err, data) => {
        if (err) {
          reject(err)
          return
        }
        resolve(new TextDecoder('utf-8').decode(data))
      })
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
    return await new Promise((resolve, reject) => {
      const { filePath } = response
      fs.writeFile(filePath, content, (error) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
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
  return value.replace(/(<(?!br|\/?(?:b|s|i)>)([^>]+)>)/ig, '')
}
