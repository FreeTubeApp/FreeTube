import IsEqual from 'lodash.isequal'
import fs from 'fs'
import path from 'path'
import i18n from '../../i18n/index'

import { IpcChannels } from '../../../constants'
import { createWebURL, openExternalLink, showToast } from '../../helpers/utils'

const state = {
  isSideNavOpen: false,
  sessionSearchHistory: [],
  popularCache: null,
  trendingCache: {
    default: null,
    music: null,
    gaming: null,
    movies: null
  },
  showProgressBar: false,
  progressBarPercentage: 0,
  regionNames: [],
  regionValues: [],
  recentBlogPosts: [],
  searchSettings: {
    sortBy: 'relevance',
    time: '',
    type: 'all',
    duration: ''
  },
  externalPlayerNames: [],
  externalPlayerNameTranslationKeys: [],
  externalPlayerValues: [],
  externalPlayerCmdArguments: {}
}

const getters = {
  getIsSideNavOpen () {
    return state.isSideNavOpen
  },

  getCurrentVolume () {
    return state.currentVolume
  },

  getSessionSearchHistory () {
    return state.sessionSearchHistory
  },

  getPopularCache () {
    return state.popularCache
  },

  getTrendingCache () {
    return state.trendingCache
  },

  getSearchSettings () {
    return state.searchSettings
  },

  getShowProgressBar () {
    return state.showProgressBar
  },

  getProgressBarPercentage () {
    return state.progressBarPercentage
  },

  getRegionNames () {
    return state.regionNames
  },

  getRegionValues () {
    return state.regionValues
  },

  getRecentBlogPosts () {
    return state.recentBlogPosts
  },

  getExternalPlayerNames () {
    return state.externalPlayerNames
  },

  getExternalPlayerNameTranslationKeys () {
    return state.externalPlayerNameTranslationKeys
  },

  getExternalPlayerValues () {
    return state.externalPlayerValues
  },

  getExternalPlayerCmdArguments () {
    return state.externalPlayerCmdArguments
  }
}

/**
 * Wrapper function that calls `ipcRenderer.invoke(IRCtype, payload)` if the user is
 * using Electron or a provided custom callback otherwise.
 * @param {Object} context Object
 * @param {String} IRCtype String
 * @param {Function} webCbk Function
 * @param {Object} payload any (default: null)
*/

async function invokeIRC(context, IRCtype, webCbk, payload = null) {
  let response = null
  if (process.env.IS_ELECTRON) {
    const { ipcRenderer } = require('electron')
    response = await ipcRenderer.invoke(IRCtype, payload)
  } else if (webCbk) {
    response = await webCbk()
  }

  return response
}

const actions = {
  replaceFilenameForbiddenChars(_, filenameOriginal) {
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
  },

  async downloadMedia({ rootState, dispatch }, { url, title, extension, fallingBackPath }) {
    if (!process.env.IS_ELECTRON) {
      openExternalLink(url)
      return
    }

    const fileName = `${await dispatch('replaceFilenameForbiddenChars', title)}.${extension}`
    const errorMessage = i18n.t('Downloading failed', { videoTitle: title })
    let folderPath = rootState.settings.downloadFolderPath

    if (folderPath === '') {
      const options = {
        defaultPath: fileName,
        filters: [
          {
            name: extension.toUpperCase(),
            extensions: [extension]
          }
        ]
      }
      const response = await dispatch('showSaveDialog', { options })

      if (response.canceled || response.filePath === '') {
        // User canceled the save dialog
        return
      }

      folderPath = response.filePath
    } else {
      if (!fs.existsSync(folderPath)) {
        try {
          fs.mkdirSync(folderPath, { recursive: true })
        } catch (err) {
          console.error(err)
          showToast(err)
          return
        }
      }
      folderPath = path.join(folderPath, fileName)
    }

    showToast(i18n.t('Starting download', { videoTitle: title }))

    const response = await fetch(url).catch((error) => {
      console.error(error)
      showToast(errorMessage)
    })

    const reader = response.body.getReader()
    const chunks = []

    const handleError = (err) => {
      console.error(err)
      showToast(errorMessage)
    }

    const processText = async ({ done, value }) => {
      if (done) {
        return
      }

      chunks.push(value)
      // Can be used in the future to determine download percentage
      // const contentLength = response.headers.get('Content-Length')
      // const receivedLength = value.length
      // const percentage = receivedLength / contentLength
      await reader.read().then(processText).catch(handleError)
    }

    await reader.read().then(processText).catch(handleError)

    const blobFile = new Blob(chunks)
    const buffer = await blobFile.arrayBuffer()

    fs.writeFile(folderPath, new DataView(buffer), (err) => {
      if (err) {
        console.error(err)
        showToast(errorMessage)
      } else {
        showToast(i18n.t('Downloading has completed', { videoTitle: title }))
      }
    })
  },

  async getSystemLocale (context) {
    const webCbk = () => {
      if (navigator && navigator.language) {
        return navigator.language
      }
    }

    return (await invokeIRC(context, IpcChannels.GET_SYSTEM_LOCALE, webCbk)) || 'en-US'
  },

  /**
   * @param {Object} response the response from `showOpenDialog`
   * @param {Number} index which file to read (defaults to the first in the response)
   * @returns the text contents of the selected file
   */
  async readFileFromDialog(context, { response, index = 0 }) {
    return await new Promise((resolve, reject) => {
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
  },

  async showOpenDialog (context, options) {
    const webCbk = () => {
      return new Promise((resolve) => {
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
    return await invokeIRC(context, IpcChannels.SHOW_OPEN_DIALOG, webCbk, options)
  },

  /**
   * Write to a file picked out from the `showSaveDialog` picker
   * @param {Object} response the response from `showSaveDialog`
   * @param {String} content the content to be written to the file selected by the dialog
   */
  async writeFileFromDialog (context, { response, content }) {
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
  },

  async showSaveDialog (context, options) {
    const webCbk = async () => {
      // If the native filesystem api is available
      if ('showSaveFilePicker' in window) {
        return {
          canceled: false,
          handle: await window.showSaveFilePicker({
            suggestedName: options.defaultPath.split('/').at(-1),
            types: options?.filters[0]?.extensions?.map((extension) => {
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
    return await invokeIRC(context, IpcChannels.SHOW_SAVE_DIALOG, webCbk, options)
  },

  async getUserDataPath (context) {
    // TODO: implement getUserDataPath web compatible callback
    const webCbk = () => null
    return await invokeIRC(context, IpcChannels.GET_USER_DATA_PATH, webCbk)
  },

  async getPicturesPath (context) {
    const webCbk = () => null
    return await invokeIRC(context, IpcChannels.GET_PICTURES_PATH, webCbk)
  },

  parseScreenshotCustomFileName: function({ rootState }, payload) {
    return new Promise((resolve, reject) => {
      const { pattern = rootState.settings.screenshotFilenamePattern, date, playerTime, videoId } = payload
      const keywords = [
        ['%Y', date.getFullYear()], // year 4 digits
        ['%M', (date.getMonth() + 1).toString().padStart(2, '0')], // month 2 digits
        ['%D', date.getDate().toString().padStart(2, '0')], // day 2 digits
        ['%H', date.getHours().toString().padStart(2, '0')], // hour 2 digits
        ['%N', date.getMinutes().toString().padStart(2, '0')], // minute 2 digits
        ['%S', date.getSeconds().toString().padStart(2, '0')], // second 2 digits
        ['%T', date.getMilliseconds().toString().padStart(3, '0')], // millisecond 3 digits
        ['%s', parseInt(playerTime)], // video position second n digits
        ['%t', (playerTime % 1).toString().slice(2, 5) || '000'], // video position millisecond 3 digits
        ['%i', videoId] // video id
      ]

      let parsedString = pattern
      for (const [key, value] of keywords) {
        parsedString = parsedString.replaceAll(key, value)
      }

      const platform = process.platform
      if (platform === 'win32') {
        // https://www.boost.org/doc/libs/1_78_0/libs/filesystem/doc/portability_guide.htm
        // https://stackoverflow.com/questions/1976007/
        const noForbiddenChars = ['<', '>', ':', '"', '/', '|', '?', '*'].every(char => {
          return parsedString.indexOf(char) === -1
        })
        if (!noForbiddenChars) {
          reject(new Error('Forbidden Characters')) // use message as translation key
        }
      } else if (platform === 'darwin') {
        // https://superuser.com/questions/204287/
        if (parsedString.indexOf(':') !== -1) {
          reject(new Error('Forbidden Characters'))
        }
      }

      const dirChar = platform === 'win32' ? '\\' : '/'
      let filename
      if (parsedString.indexOf(dirChar) !== -1) {
        const lastIndex = parsedString.lastIndexOf(dirChar)
        filename = parsedString.substring(lastIndex + 1)
      } else {
        filename = parsedString
      }

      if (!filename) {
        reject(new Error('Empty File Name'))
      }

      resolve(parsedString)
    })
  },

  updateShowProgressBar ({ commit }, value) {
    commit('setShowProgressBar', value)
  },

  async getRegionData ({ commit }, { locale }) {
    let localePathExists
    // Exclude __dirname from path if not in electron
    const fileLocation = `${process.env.IS_ELECTRON ? process.env.NODE_ENV === 'development' ? '.' : __dirname : ''}/static/geolocations/`
    if (process.env.IS_ELECTRON) {
      localePathExists = fs.existsSync(`${fileLocation}${locale}`)
    } else {
      localePathExists = process.env.GEOLOCATION_NAMES.includes(locale)
    }
    const pathName = `${fileLocation}${localePathExists ? locale : 'en-US'}/countries.json`
    const fileData = process.env.IS_ELECTRON ? JSON.parse(fs.readFileSync(pathName)) : await (await fetch(createWebURL(pathName))).json()

    const countries = fileData.map((entry) => { return { id: entry.id, name: entry.name, code: entry.alpha2 } })
    countries.sort((a, b) => { return a.id - b.id })

    const regionNames = countries.map((entry) => { return entry.name })
    const regionValues = countries.map((entry) => { return entry.code })

    commit('setRegionNames', regionNames)
    commit('setRegionValues', regionValues)
  },

  getVideoParamsFromUrl (_, url) {
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
      function() {
        if (urlObject.pathname === '/watch' && urlObject.searchParams.has('v')) {
          extractParams(urlObject.searchParams.get('v'))
          paramsObject.playlistId = urlObject.searchParams.get('list')
          return paramsObject
        }
      },
      // youtu.be
      function() {
        if (urlObject.host === 'youtu.be' && urlObject.pathname.match(/^\/[A-Za-z0-9_-]+$/)) {
          extractParams(urlObject.pathname.slice(1))
          return paramsObject
        }
      },
      // youtube.com/embed
      function() {
        if (urlObject.pathname.match(/^\/embed\/[A-Za-z0-9_-]+$/)) {
          extractParams(urlObject.pathname.replace('/embed/', ''))
          return paramsObject
        }
      },
      // youtube.com/shorts
      function() {
        if (urlObject.pathname.match(/^\/shorts\/[A-Za-z0-9_-]+$/)) {
          extractParams(urlObject.pathname.replace('/shorts/', ''))
          return paramsObject
        }
      },
      // cloudtube
      function() {
        if (urlObject.host.match(/^cadence\.(gq|moe)$/) && urlObject.pathname.match(/^\/cloudtube\/video\/[A-Za-z0-9_-]+$/)) {
          extractParams(urlObject.pathname.slice('/cloudtube/video/'.length))
          return paramsObject
        }
      }
    ]

    return extractors.reduce((a, c) => a || c(), null) || paramsObject
  },

  getYoutubeUrlInfo ({ state }, urlStr) {
    // Returns
    // - urlType [String] `video`, `playlist`
    //
    // If `urlType` is "video"
    // - videoId [String]
    // - timestamp [String]
    //
    // If `urlType` is "playlist"
    // - playlistId [String]
    // - query [Object]
    //
    // If `urlType` is "search"
    // - searchQuery [String]
    // - query [Object]
    //
    // If `urlType` is "hashtag"
    // Nothing else
    //
    // If `urlType` is "channel"
    // - channelId [String]
    //
    // If `urlType` is "unknown"
    // Nothing else
    //
    // If `urlType` is "invalid_url"
    // Nothing else
    const { videoId, timestamp, playlistId } = actions.getVideoParamsFromUrl(null, urlStr)
    if (videoId) {
      return {
        urlType: 'video',
        videoId,
        playlistId,
        timestamp
      }
    }

    let url
    try {
      url = new URL(urlStr)
    } catch {
      return {
        urlType: 'invalid_url'
      }
    }
    let urlType = 'unknown'

    const channelPattern =
      /^\/(?:(?<type>channel|user|c)\/)?(?<channelId>[^/]+)(?:\/(join|featured|videos|playlists|about|community|channels))?\/?$/

    const typePatterns = new Map([
      ['playlist', /^\/playlist\/?$/],
      ['search', /^\/results\/?$/],
      ['hashtag', /^\/hashtag\/([^/?&#]+)$/],
      ['channel', channelPattern]
    ])

    for (const [type, pattern] of typePatterns) {
      const matchFound = pattern.test(url.pathname)
      if (matchFound) {
        urlType = type
        break
      }
    }

    switch (urlType) {
      case 'playlist': {
        if (!url.searchParams.has('list')) {
          throw new Error('Playlist: "list" field not found')
        }

        const playlistId = url.searchParams.get('list')
        url.searchParams.delete('list')

        const query = {}
        for (const [param, value] of url.searchParams) {
          query[param] = value
        }

        return {
          urlType: 'playlist',
          playlistId,
          query
        }
      }

      case 'search': {
        if (!url.searchParams.has('search_query')) {
          throw new Error('Search: "search_query" field not found')
        }

        const searchQuery = url.searchParams.get('search_query')
        url.searchParams.delete('search_query')

        const searchSettings = state.searchSettings
        const query = {
          sortBy: searchSettings.sortBy,
          time: searchSettings.time,
          type: searchSettings.type,
          duration: searchSettings.duration
        }

        for (const [param, value] of url.searchParams) {
          query[param] = value
        }

        return {
          urlType: 'search',
          searchQuery,
          query
        }
      }

      case 'hashtag': {
        return {
          urlType: 'hashtag'
        }
      }
      /*
      Using RegExp named capture groups from ES2018
      To avoid access to specific captured value broken

      Channel URL (ID-based)
      https://www.youtube.com/channel/UCfMJ2MchTSW2kWaT0kK94Yw
      https://www.youtube.com/channel/UCfMJ2MchTSW2kWaT0kK94Yw/about
      https://www.youtube.com/channel/UCfMJ2MchTSW2kWaT0kK94Yw/channels
      https://www.youtube.com/channel/UCfMJ2MchTSW2kWaT0kK94Yw/community
      https://www.youtube.com/channel/UCfMJ2MchTSW2kWaT0kK94Yw/featured
      https://www.youtube.com/channel/UCfMJ2MchTSW2kWaT0kK94Yw/join
      https://www.youtube.com/channel/UCfMJ2MchTSW2kWaT0kK94Yw/playlists
      https://www.youtube.com/channel/UCfMJ2MchTSW2kWaT0kK94Yw/videos

      Custom URL

      https://www.youtube.com/c/YouTubeCreators
      https://www.youtube.com/c/YouTubeCreators/about
      etc.

      Legacy Username URL

      https://www.youtube.com/user/ufoludek
      https://www.youtube.com/user/ufoludek/about
      etc.

      */
      case 'channel': {
        const match = url.pathname.match(channelPattern)
        const channelId = match.groups.channelId
        const idType = ['channel', 'user', 'c'].indexOf(match.groups.type) + 1
        if (!channelId) {
          throw new Error('Channel: could not extract id')
        }

        let subPath = null
        switch (url.pathname.split('/').filter(i => i)[2]) {
          case 'playlists':
            subPath = 'playlists'
            break
          case 'channels':
          case 'about':
            subPath = 'about'
            break
          case 'community':
          default:
            subPath = 'videos'
            break
        }
        return {
          urlType: 'channel',
          channelId,
          idType,
          subPath
        }
      }

      default: {
        // Unknown URL type
        return {
          urlType: 'unknown'
        }
      }
    }
  },

  clearSessionSearchHistory ({ commit }) {
    commit('setSessionSearchHistory', [])
  },

  showExternalPlayerUnsupportedActionToast: function (_, { externalPlayer, action }) {
    showToast(i18n.t('Video.External Player.UnsupportedActionTemplate', { externalPlayer, action }))
  },

  getExternalPlayerCmdArgumentsData ({ commit }, payload) {
    const fileName = 'external-player-map.json'
    let fileData
    /* eslint-disable-next-line */
    const fileLocation = process.env.NODE_ENV === 'development' ? './static/' : `${__dirname}/static/`

    if (fs.existsSync(`${fileLocation}${fileName}`)) {
      fileData = fs.readFileSync(`${fileLocation}${fileName}`)
    } else {
      fileData = '[{"name":"None","value":"","cmdArguments":null}]'
    }

    const externalPlayerMap = JSON.parse(fileData).map((entry) => {
      return { name: entry.name, nameTranslationKey: entry.nameTranslationKey, value: entry.value, cmdArguments: entry.cmdArguments }
    })

    const externalPlayerNames = externalPlayerMap.map((entry) => { return entry.name })
    const externalPlayerNameTranslationKeys = externalPlayerMap.map((entry) => { return entry.nameTranslationKey })
    const externalPlayerValues = externalPlayerMap.map((entry) => { return entry.value })
    const externalPlayerCmdArguments = externalPlayerMap.reduce((result, item) => {
      result[item.value] = item.cmdArguments
      return result
    }, {})

    commit('setExternalPlayerNames', externalPlayerNames)
    commit('setExternalPlayerNameTranslationKeys', externalPlayerNameTranslationKeys)
    commit('setExternalPlayerValues', externalPlayerValues)
    commit('setExternalPlayerCmdArguments', externalPlayerCmdArguments)
  },

  openInExternalPlayer ({ dispatch, state, rootState }, payload) {
    const args = []
    const externalPlayer = rootState.settings.externalPlayer
    const cmdArgs = state.externalPlayerCmdArguments[externalPlayer]
    const executable = rootState.settings.externalPlayerExecutable !== ''
      ? rootState.settings.externalPlayerExecutable
      : cmdArgs.defaultExecutable
    const ignoreWarnings = rootState.settings.externalPlayerIgnoreWarnings
    const customArgs = rootState.settings.externalPlayerCustomArgs

    // Append custom user-defined arguments,
    // or use the default ones specified for the external player.
    if (typeof customArgs === 'string' && customArgs !== '') {
      const custom = customArgs.split(';')
      args.push(...custom)
    } else if (typeof cmdArgs.defaultCustomArguments === 'string' && cmdArgs.defaultCustomArguments !== '') {
      const defaultCustomArguments = cmdArgs.defaultCustomArguments.split(';')
      args.push(...defaultCustomArguments)
    }

    if (payload.watchProgress > 0 && payload.watchProgress < payload.videoLength - 10) {
      if (typeof cmdArgs.startOffset === 'string') {
        args.push(`${cmdArgs.startOffset}${payload.watchProgress}`)
      } else if (!ignoreWarnings) {
        dispatch('showExternalPlayerUnsupportedActionToast', {
          externalPlayer,
          action: i18n.t('Video.External Player.Unsupported Actions.starting video at offset')
        })
      }
    }

    if (payload.playbackRate !== null) {
      if (typeof cmdArgs.playbackRate === 'string') {
        args.push(`${cmdArgs.playbackRate}${payload.playbackRate}`)
      } else if (!ignoreWarnings) {
        dispatch('showExternalPlayerUnsupportedActionToast', {
          externalPlayer,
          action: i18n.t('Video.External Player.Unsupported Actions.setting a playback rate')
        })
      }
    }

    // Check whether the video is in a playlist
    if (typeof cmdArgs.playlistUrl === 'string' && payload.playlistId !== null && payload.playlistId !== '') {
      if (payload.playlistIndex !== null) {
        if (typeof cmdArgs.playlistIndex === 'string') {
          args.push(`${cmdArgs.playlistIndex}${payload.playlistIndex}`)
        } else if (!ignoreWarnings) {
          dispatch('showExternalPlayerUnsupportedActionToast', {
            externalPlayer,
            action: i18n.t('Video.External Player.Unsupported Actions.opening specific video in a playlist (falling back to opening the video)')
          })
        }
      }

      if (payload.playlistReverse) {
        if (typeof cmdArgs.playlistReverse === 'string') {
          args.push(cmdArgs.playlistReverse)
        } else if (!ignoreWarnings) {
          dispatch('showExternalPlayerUnsupportedActionToast', {
            externalPlayer,
            action: i18n.t('Video.External Player.Unsupported Actions.reversing playlists')
          })
        }
      }

      if (payload.playlistShuffle) {
        if (typeof cmdArgs.playlistShuffle === 'string') {
          args.push(cmdArgs.playlistShuffle)
        } else if (!ignoreWarnings) {
          dispatch('showExternalPlayerUnsupportedActionToast', {
            externalPlayer,
            action: i18n.t('Video.External Player.Unsupported Actions.shuffling playlists')
          })
        }
      }

      if (payload.playlistLoop) {
        if (typeof cmdArgs.playlistLoop === 'string') {
          args.push(cmdArgs.playlistLoop)
        } else if (!ignoreWarnings) {
          dispatch('showExternalPlayerUnsupportedActionToast', {
            externalPlayer,
            action: i18n.t('Video.External Player.Unsupported Actions.looping playlists')
          })
        }
      }
      if (cmdArgs.supportsYtdlProtocol) {
        args.push(`${cmdArgs.playlistUrl}ytdl://${payload.playlistId}`)
      } else {
        args.push(`${cmdArgs.playlistUrl}https://youtube.com/playlist?list=${payload.playlistId}`)
      }
    } else {
      if (payload.playlistId !== null && payload.playlistId !== '' && !ignoreWarnings) {
        dispatch('showExternalPlayerUnsupportedActionToast', {
          externalPlayer,
          action: i18n.t('Video.External Player.Unsupported Actions.opening playlists')
        })
      }
      if (payload.videoId !== null) {
        if (cmdArgs.supportsYtdlProtocol) {
          args.push(`${cmdArgs.videoUrl}ytdl://${payload.videoId}`)
        } else {
          args.push(`${cmdArgs.videoUrl}https://www.youtube.com/watch?v=${payload.videoId}`)
        }
      }
    }

    const videoOrPlaylist = payload.playlistId === null || payload.playlistId === ''
      ? i18n.t('Video.External Player.video')
      : i18n.t('Video.External Player.playlist')

    showToast(i18n.t('Video.External Player.OpeningTemplate', { videoOrPlaylist, externalPlayer }))

    const { ipcRenderer } = require('electron')
    ipcRenderer.send(IpcChannels.OPEN_IN_EXTERNAL_PLAYER, { executable, args })
  }
}

const mutations = {
  toggleSideNav (state) {
    state.isSideNavOpen = !state.isSideNavOpen
  },

  setShowProgressBar (state, value) {
    state.showProgressBar = value
  },

  setProgressBarPercentage (state, value) {
    state.progressBarPercentage = value
  },

  setSessionSearchHistory (state, history) {
    state.sessionSearchHistory = history
  },

  addToSessionSearchHistory (state, payload) {
    const sameSearch = state.sessionSearchHistory.findIndex((search) => {
      return search.query === payload.query && IsEqual(payload.searchSettings, search.searchSettings)
    })

    if (sameSearch !== -1) {
      state.sessionSearchHistory[sameSearch].data = payload.data
      state.sessionSearchHistory[sameSearch].nextPageRef = payload.nextPageRef
    } else {
      state.sessionSearchHistory.push(payload)
    }
  },

  setPopularCache (state, value) {
    state.popularCache = value
  },

  setTrendingCache (state, { value, page }) {
    state.trendingCache[page] = value
  },

  setSearchSortBy (state, value) {
    state.searchSettings.sortBy = value
  },

  setSearchTime (state, value) {
    state.searchSettings.time = value
  },

  setSearchType (state, value) {
    state.searchSettings.type = value
  },

  setSearchDuration (state, value) {
    state.searchSettings.duration = value
  },

  setRegionNames (state, value) {
    state.regionNames = value
  },

  setRegionValues (state, value) {
    state.regionValues = value
  },

  setRecentBlogPosts (state, value) {
    state.recentBlogPosts = value
  },

  setExternalPlayerNames (state, value) {
    state.externalPlayerNames = value
  },

  setExternalPlayerNameTranslationKeys (state, value) {
    state.externalPlayerNameTranslationKeys = value
  },

  setExternalPlayerValues (state, value) {
    state.externalPlayerValues = value
  },

  setExternalPlayerCmdArguments (state, value) {
    state.externalPlayerCmdArguments = value
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
