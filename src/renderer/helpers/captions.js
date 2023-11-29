import { isUrl } from './strings'
import { WebVTT } from 'vtt.js'

/**
 * @param {Promise[] | object[]} captionHybridList
 * @param {string} currentLocale
 */
export async function transformCaptions(captionHybridList, currentLocale) {
  let captionList
  if (captionHybridList[0] instanceof Promise) {
    captionList = await Promise.all(captionHybridList)
  } else {
    captionList = captionHybridList
  }

  return sortCaptions(captionList, currentLocale)
}

/**
 * @param {object[]} captionList
 * @param {string} currentLocale
 */
function sortCaptions(captionList, currentLocale) {
  return captionList.sort((captionA, captionB) => {
    const aCode = captionA.language_code.split('-') // ex. [en,US]
    const bCode = captionB.language_code.split('-')
    const aName = (captionA.label) // ex: english (auto-generated)
    const bName = (captionB.label)
    const userLocale = currentLocale.split('-') // ex. [en,US]
    if (aCode[0] === userLocale[0]) { // caption a has same language as user's locale
      if (bCode[0] === userLocale[0]) { // caption b has same language as user's locale
        if (bName.search('auto') !== -1) {
          // prefer caption a: b is auto-generated captions
          return -1
        } else if (aName.search('auto') !== -1) {
          // prefer caption b: a is auto-generated captions
          return 1
        } else if (aCode[1] === userLocale[1]) {
          // prefer caption a: caption a has same county code as user's locale
          return -1
        } else if (bCode[1] === userLocale[1]) {
          // prefer caption b: caption b has same county code as user's locale
          return 1
        } else if (aCode[1] === undefined) {
          // prefer caption a: no country code is better than wrong country code
          return -1
        } else if (bCode[1] === undefined) {
          // prefer caption b: no country code is better than wrong country code
          return 1
        }
      } else {
        // prefer caption a: b does not match user's language
        return -1
      }
    } else if (bCode[0] === userLocale[0]) {
      // prefer caption b: a does not match user's language
      return 1
    }
    // sort alphabetically
    return aName.localeCompare(bName, currentLocale)
  })
}

/**
 * Parses and inserts caption cues as an array
 *
 * @param {{ label: string, language_code: string, type: string, url: string }}
 *
 * @returns {Promise<{ label: string, language_code: string, type: string, url: string,
 * vttString: string,
 * transcriptError: boolean,
 * cues: {
 *  startTime: number,
 *  endTime: number,
 *  text: string,
 *  startTimeFormatted: string,
 * }
 * }>}
 */
export async function parseCaptionString(caption) {
  const isAutoGen = (caption.label.search('auto') !== -1)
  caption.cues = []

  // Download vtt file if necessary
  let vttString = (isUrl(caption.url)) ? await (await fetch(caption.url)).text() : caption.url

  // Rate limit in invidious
  if (vttString.includes('<h1>We\'re sorry...</h1><p>...')) {
    caption.transcriptError = true
    return caption
  }

  // Must start with WEBVTT, sometimes file comes with header junk at the start
  vttString = vttString.substring(vttString.indexOf('WEBVTT'))
  while (vttString.startsWith('WEBVTT\n\n')) vttString = vttString.replace('WEBVTT\n', 'WEBVTT')

  const parser = new WebVTT.Parser(window, WebVTT.StringDecoder())
  parser.oncue = function ({ startTime, endTime, text }) {
    // YT.js auto-generated captions include full clean text but their start and end times are 0.01s apart
    // So just clean the styled ones and discard the clean text
    if (isAutoGen && caption.dataSource === 'local') {
      const cleanedText = cleanStyledText(text)
      if (text === cleanedText) return
      text = cleanedText
    }

    const startTimeFormatted = formatCueTime(startTime)
    caption.cues.push({ startTime, endTime, text, startTimeFormatted })
  }
  parser.parse(vttString)

  caption.vttString = vttString
  return caption
}

/**
 * Replaces VTT styling for Local API auto generated cues
 * Eg: I did go swimming<00:08:52.480><c> how</c><00:08:52.560><c> much</c>
 * @param {String} text
 */
function cleanStyledText(text) {
  return text.replaceAll(/<.+?>|<script/g, '')
}

/**
 * @param {Number} time
 */
function formatCueTime(time) {
  const min = Math.floor(time / 60)
  const sec = Math.floor(time % 60)
  return `${min}:${(sec < 10) ? '0' : ''}${sec}`
}
