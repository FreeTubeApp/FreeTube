import fs from 'fs/promises'
import path from 'path'
import i18n from '../../i18n/index'

import { IpcChannels } from '../../../constants'
import { pathExists } from '../../helpers/filesystem'
import {
  createWebURL,
  getVideoParamsFromUrl,
  openExternalLink,
  replaceFilenameForbiddenChars,
  searchFiltersMatch,
  showExternalPlayerUnsupportedActionToast,
  showSaveDialog,
  showToast
} from '../../helpers/utils'
import { defineStore } from 'pinia'
import { useSettingsStore } from './settings'

export const useUtilsStore = defineStore('utils', {
  state: () => {
    return {
      isSideNavOpen: false,
      sessionSearchHistory: [],
      popularCache: null,
      trendingCache: {
        default: null,
        music: null,
        gaming: null,
        movies: null
      },
      cachedPlaylist: null,
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
  },
  actions: {
    async downloadMedia({ url, title, extension, fallingBackPath }) {
      if (!process.env.IS_ELECTRON) {
        openExternalLink(url)
        return
      }

      const fileName = `${replaceFilenameForbiddenChars(title)}.${extension}`
      const errorMessage = i18n.t('Downloading failed', { videoTitle: title })
      const settingsStore = useSettingsStore()
      let folderPath = settingsStore.downloadFolderPath

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
        const response = await showSaveDialog(options)

        if (response.canceled || response.filePath === '') {
          // User canceled the save dialog
          return
        }

        folderPath = response.filePath
      } else {
        if (!(await pathExists(folderPath))) {
          try {
            await fs.mkdir(folderPath, { recursive: true })
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

      try {
        await fs.writeFile(folderPath, new DataView(buffer))

        showToast(i18n.t('Downloading has completed', { videoTitle: title }))
      } catch (err) {
        console.error(err)
        showToast(errorMessage)
      }
    },

    parseScreenshotCustomFileName: function(date, playerTime, videoId) {
      return new Promise((resolve, reject) => {
        const settingsStore = useSettingsStore()
        const pattern = settingsStore.screenshotFilenamePattern

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

        if (parsedString !== replaceFilenameForbiddenChars(parsedString)) {
          reject(new Error('Forbidden Characters')) // use message as translation key
        }

        let filename
        if (parsedString.indexOf(path.sep) !== -1) {
          const lastIndex = parsedString.lastIndexOf(path.sep)
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

    updateShowProgressBar (value) {
      this.showProgressBar = value
    },

    async getRegionData ({ locale }) {
      let localePathExists
      // Exclude __dirname from path if not in electron
      const fileLocation = `${process.env.IS_ELECTRON ? process.env.NODE_ENV === 'development' ? '.' : __dirname : ''}/static/geolocations/`
      if (process.env.IS_ELECTRON) {
        localePathExists = await pathExists(`${fileLocation}${locale}`)
      } else {
        localePathExists = process.env.GEOLOCATION_NAMES.includes(locale)
      }
      const pathName = `${fileLocation}${localePathExists ? locale : 'en-US'}/countries.json`
      const fileData = process.env.IS_ELECTRON ? JSON.parse(await fs.readFile(pathName)) : await (await fetch(createWebURL(pathName))).json()

      const countries = fileData.map((entry) => { return { id: entry.id, name: entry.name, code: entry.alpha2 } })
      countries.sort((a, b) => { return a.id - b.id })

      const regionNames = countries.map((entry) => { return entry.name })
      const regionValues = countries.map((entry) => { return entry.code })

      this.setRegionNames(regionNames)
      this.setRegionValues(regionValues)
    },

    getYoutubeUrlInfo (urlStr) {
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
      const { videoId, timestamp, playlistId } = getVideoParamsFromUrl(urlStr)
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
        ['playlist', /^(\/playlist\/?|\/embed(\/?videoseries)?)$/],
        ['search', /^\/results\/?$/],
        ['hashtag', /^\/hashtag\/([^#&/?]+)$/],
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

          const searchSettings = this.searchSettings
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

    clearSessionSearchHistory () {
      this.sessionSearchHistory = []
    },

    async getExternalPlayerCmdArgumentsData ({ externalPlayer = null } = {}) {
      const fileName = 'external-player-map.json'
      let fileData
      /* eslint-disable-next-line n/no-path-concat */
      const fileLocation = process.env.NODE_ENV === 'development' ? './static/' : `${__dirname}/static/`

      if (await pathExists(`${fileLocation}${fileName}`)) {
        fileData = await fs.readFile(`${fileLocation}${fileName}`)
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

      this.setExternalPlayerNames(externalPlayerNames)
      this.setExternalPlayerNameTranslationKeys(externalPlayerNameTranslationKeys)
      this.setExternalPlayerValues(externalPlayerValues)
      this.setExternalPlayerCmdArguments(externalPlayerCmdArguments)
    },

    openInExternalPlayer ({
      watchProgress = 0,
      playbackRate = 1,
      videoId = null,
      playlistId = null,
      playlistIndex = null,
      playlistReverse = null,
      playlistShuffle = null,
      playlistLoop = null,
      videoLength = null
    }) {
      const settingsStore = useSettingsStore()
      const args = []
      const externalPlayer = settingsStore.externalPlayer
      const cmdArgs = this.externalPlayerCmdArguments[externalPlayer]
      const executable = settingsStore.externalPlayerExecutable !== ''
        ? settingsStore.externalPlayerExecutable
        : cmdArgs.defaultExecutable
      const ignoreWarnings = settingsStore.externalPlayerIgnoreWarnings
      const customArgs = settingsStore.externalPlayerCustomArgs

      // Append custom user-defined arguments,
      // or use the default ones specified for the external player.
      if (typeof customArgs === 'string' && customArgs !== '') {
        const custom = customArgs.split(';')
        args.push(...custom)
      } else if (typeof cmdArgs.defaultCustomArguments === 'string' && cmdArgs.defaultCustomArguments !== '') {
        const defaultCustomArguments = cmdArgs.defaultCustomArguments.split(';')
        args.push(...defaultCustomArguments)
      }

      if (watchProgress > 0 && watchProgress < videoLength - 10) {
        if (typeof cmdArgs.startOffset === 'string') {
          args.push(`${cmdArgs.startOffset}${watchProgress}`)
        } else if (!ignoreWarnings) {
          showExternalPlayerUnsupportedActionToast(externalPlayer, 'starting video at offset')
        }
      }

      if (playbackRate !== null) {
        if (typeof cmdArgs.playbackRate === 'string') {
          args.push(`${cmdArgs.playbackRate}${playbackRate}`)
        } else if (!ignoreWarnings) {
          showExternalPlayerUnsupportedActionToast(externalPlayer, 'setting a playback rate')
        }
      }

      // Check whether the video is in a playlist
      if (typeof cmdArgs.playlistUrl === 'string' && playlistId !== null && playlistId !== '') {
        if (playlistIndex !== null) {
          if (typeof cmdArgs.playlistIndex === 'string') {
            args.push(`${cmdArgs.playlistIndex}${playlistIndex}`)
          } else if (!ignoreWarnings) {
            showExternalPlayerUnsupportedActionToast(externalPlayer, 'opening specific video in a playlist (falling back to opening the video)')
          }
        }

        if (playlistReverse) {
          if (typeof cmdArgs.playlistReverse === 'string') {
            args.push(cmdArgs.playlistReverse)
          } else if (!ignoreWarnings) {
            showExternalPlayerUnsupportedActionToast(externalPlayer, 'reversing playlists')
          }
        }

        if (playlistShuffle) {
          if (typeof cmdArgs.playlistShuffle === 'string') {
            args.push(cmdArgs.playlistShuffle)
          } else if (!ignoreWarnings) {
            showExternalPlayerUnsupportedActionToast(externalPlayer, 'shuffling playlists')
          }
        }

        if (playlistLoop) {
          if (typeof cmdArgs.playlistLoop === 'string') {
            args.push(cmdArgs.playlistLoop)
          } else if (!ignoreWarnings) {
            showExternalPlayerUnsupportedActionToast(externalPlayer, 'looping playlists')
          }
        }
        if (cmdArgs.supportsYtdlProtocol) {
          args.push(`${cmdArgs.playlistUrl}ytdl://${playlistId}`)
        } else {
          args.push(`${cmdArgs.playlistUrl}https://youtube.com/playlist?list=${playlistId}`)
        }
      } else {
        if (playlistId !== null && playlistId !== '' && !ignoreWarnings) {
          showExternalPlayerUnsupportedActionToast(externalPlayer, 'opening playlists')
        }
        if (videoId !== null) {
          if (cmdArgs.supportsYtdlProtocol) {
            args.push(`${cmdArgs.videoUrl}ytdl://${videoId}`)
          } else {
            args.push(`${cmdArgs.videoUrl}https://www.youtube.com/watch?v=${videoId}`)
          }
        }
      }

      const videoOrPlaylist = playlistId === null || playlistId === ''
        ? i18n.t('Video.External Player.video')
        : i18n.t('Video.External Player.playlist')

      showToast(i18n.t('Video.External Player.OpeningTemplate', { videoOrPlaylist, externalPlayer }))

      const { ipcRenderer } = require('electron')
      ipcRenderer.send(IpcChannels.OPEN_IN_EXTERNAL_PLAYER, { executable, args })
    },

    toggleSideNav () {
      this.isSideNavOpen = !this.isSideNavOpen
    },

    setProgressBarPercentage (value) {
      this.progressBarPercentage = value
    },

    addToSessionSearchHistory (payload) {
      const sameSearch = this.sessionSearchHistory.findIndex((search) => {
        return search.query === payload.query && searchFiltersMatch(payload.searchSettings, search.searchSettings)
      })

      if (sameSearch !== -1) {
        this.sessionSearchHistory[sameSearch].data = payload.data
        this.sessionSearchHistory[sameSearch].nextPageRef = payload.nextPageRef
      } else {
        this.sessionSearchHistory.push(payload)
      }
    },

    setPopularCache (value) {
      this.popularCache = value
    },

    setTrendingCache ({ value, page }) {
      this.trendingCache[page] = value
    },

    setCachedPlaylist(value) {
      this.cachedPlaylist = value
    },

    setSearchSortBy (value) {
      this.searchSettings.sortBy = value
    },

    setSearchTime (value) {
      this.searchSettings.time = value
    },

    setSearchType (value) {
      this.searchSettings.type = value
    },

    setSearchDuration (value) {
      this.searchSettings.duration = value
    },

    setRegionNames (value) {
      this.regionNames = value
    },

    setRegionValues (value) {
      this.regionValues = value
    },

    setRecentBlogPosts (value) {
      this.recentBlogPosts = value
    },

    setExternalPlayerNames (value) {
      this.externalPlayerNames = value
    },

    setExternalPlayerNameTranslationKeys (value) {
      this.externalPlayerNameTranslationKeys = value
    },

    setExternalPlayerValues (value) {
      this.externalPlayerValues = value
    },

    setExternalPlayerCmdArguments (value) {
      this.externalPlayerCmdArguments = value
    }
  }
})
