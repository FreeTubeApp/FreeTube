import fs from 'fs/promises'
import path from 'path'
import i18n from '../../i18n/index'
import { set as vueSet } from 'vue'

import { IpcChannels } from '../../../constants'
import { pathExists } from '../../helpers/filesystem'
import {
  CHANNEL_HANDLE_REGEX,
  createWebURL,
  getVideoParamsFromUrl,
  openExternalLink,
  replaceFilenameForbiddenChars,
  searchFiltersMatch,
  showExternalPlayerUnsupportedActionToast,
  showSaveDialog,
  showToast
} from '../../helpers/utils'

const state = {
  isSideNavOpen: false,
  outlinesHidden: true,
  sessionSearchHistory: [],
  /** @type {any[] | null} */
  popularCache: null,
  trendingCache: {
    /** @type {any[] | null} */
    default: null,
    /** @type {any[] | null} */
    music: null,
    /** @type {any[] | null} */
    gaming: null,
    /** @type {any[] | null} */
    movies: null
  },
  cachedPlaylist: null,
  deArrowCache: {},
  showProgressBar: false,
  showAddToPlaylistPrompt: false,
  showCreatePlaylistPrompt: false,
  showSearchFilters: false,
  searchFilterValueChanged: false,
  progressBarPercentage: 0,
  toBeAddedToPlaylistVideoList: [],
  newPlaylistDefaultProperties: {},
  newPlaylistVideoObject: [],
  /** @type {string[]} */
  regionNames: [],
  /** @type {string[]} */
  regionValues: [],
  recentBlogPosts: [],
  searchSettings: {
    sortBy: 'relevance',
    time: '',
    type: 'all',
    duration: '',
    features: [],
  },
  /** @type {string[]} */
  externalPlayerNames: [],
  /** @type {string[]} */
  externalPlayerValues: [],
  externalPlayerCmdArguments: {},
  lastVideoRefreshTimestampByProfile: {},
  lastShortRefreshTimestampByProfile: {},
  lastLiveRefreshTimestampByProfile: {},
  lastCommunityRefreshTimestampByProfile: {},
  lastPopularRefreshTimestamp: '',
  lastTrendingRefreshTimestamp: '',
}

const getters = {
  /** @param {typeof state} state */
  getIsSideNavOpen(state) {
    return state.isSideNavOpen
  },

  /** @param {typeof state} state */
  getOutlinesHidden(state) {
    return state.outlinesHidden
  },

  /** @param {typeof state} state */
  getCurrentVolume(state) {
    return state.currentVolume
  },

  /** @param {typeof state} state */
  getSessionSearchHistory(state) {
    return state.sessionSearchHistory
  },

  /** @param {typeof state} state */
  getDeArrowCache: (state) => {
    return state.deArrowCache
  },

  /** @param {typeof state} state */
  getPopularCache(state) {
    return state.popularCache
  },

  /** @param {typeof state} state */
  getTrendingCache(state) {
    return state.trendingCache
  },

  /** @param {typeof state} state */
  getCachedPlaylist(state) {
    return state.cachedPlaylist
  },

  /** @param {typeof state} state */
  getSearchSettings(state) {
    return state.searchSettings
  },

  /** @param {typeof state} state */
  getSearchFilterValueChanged(state) {
    return state.searchFilterValueChanged
  },

  /** @param {typeof state} state */
  getShowAddToPlaylistPrompt(state) {
    return state.showAddToPlaylistPrompt
  },

  /** @param {typeof state} state */
  getShowCreatePlaylistPrompt(state) {
    return state.showCreatePlaylistPrompt
  },

  /** @param {typeof state} state */
  getShowSearchFilters(state) {
    return state.showSearchFilters
  },

  /** @param {typeof state} state */
  getToBeAddedToPlaylistVideoList(state) {
    return state.toBeAddedToPlaylistVideoList
  },

  /** @param {typeof state} state */
  getNewPlaylistDefaultProperties(state) {
    return state.newPlaylistDefaultProperties
  },

  /** @param {typeof state} state */
  getNewPlaylistVideoObject(state) {
    return state.newPlaylistVideoObject
  },

  /** @param {typeof state} state */
  getShowProgressBar(state) {
    return state.showProgressBar
  },

  /** @param {typeof state} state */
  getProgressBarPercentage(state) {
    return state.progressBarPercentage
  },

  /** @param {typeof state} state */
  getRegionNames(state) {
    return state.regionNames
  },

  /** @param {typeof state} state */
  getRegionValues(state) {
    return state.regionValues
  },

  /** @param {typeof state} state */
  getRecentBlogPosts(state) {
    return state.recentBlogPosts
  },

  /** @param {typeof state} state */
  getExternalPlayerNames(state) {
    return state.externalPlayerNames
  },

  /** @param {typeof state} state */
  getExternalPlayerValues(state) {
    return state.externalPlayerValues
  },

  /** @param {typeof state} state */
  getExternalPlayerCmdArguments (state) {
    return state.externalPlayerCmdArguments
  },

  /** @param {typeof state} state */
  getLastTrendingRefreshTimestamp(state) {
    return state.lastTrendingRefreshTimestamp
  },

  /** @param {typeof state} state */
  getLastPopularRefreshTimestamp(state) {
    return state.lastPopularRefreshTimestamp
  },

  /** @param {typeof state} state */
  getLastCommunityRefreshTimestampByProfile: (state) => (profileId) => {
    return state.lastCommunityRefreshTimestampByProfile[profileId]
  },

  /** @param {typeof state} state */
  getLastShortRefreshTimestampByProfile: (state) => (profileId) => {
    return state.lastShortRefreshTimestampByProfile[profileId]
  },

  /** @param {typeof state} state */
  getLastLiveRefreshTimestampByProfile: (state) => (profileId) => {
    return state.lastLiveRefreshTimestampByProfile[profileId]
  },

  /** @param {typeof state} state */
  getLastVideoRefreshTimestampByProfile: (state) => (profileId) => {
    return state.lastVideoRefreshTimestampByProfile[profileId]
  },
}

const actions = {
  /** @param {import('../types/store').ActionContext<typeof state>} context */
  showOutlines({ commit }) {
    commit('setOutlinesHidden', false)
  },

  /** @param {import('../types/store').ActionContext<typeof state>} context */
  hideOutlines({ commit }) {
    commit('setOutlinesHidden', true)
  },

  /**
   * @param {import('../types/store').ActionContext<typeof state>} context
   * @param {Object} payload
   * @param {string} payload.url
   * @param {string} payload.title
   * @param {string} payload.extension
   */
  async downloadMedia({ rootState }, { url, title, extension }) {
    if (!process.env.IS_ELECTRON) {
      openExternalLink(url)
      return
    }

    const fileName = `${replaceFilenameForbiddenChars(title)}.${extension}`
    const errorMessage = i18n.t('Downloading failed', { videoTitle: title })
    const askFolderPath = rootState.settings.downloadAskPath
    let folderPath = rootState.settings.downloadFolderPath

    if (askFolderPath) {
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

  /**
   * @param {import('../types/store').ActionContext<typeof state>} context
   * @param {Object} payload
   * @param {string=} payload.pattern
   * @param {Date} payload.date
   * @param {number} payload.playerTime
   * @param {string} payload.videoId
   */
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

      if (parsedString !== replaceFilenameForbiddenChars(parsedString)) {
        reject(new Error(i18n.t('Settings.Player Settings.Screenshot.Error.Forbidden Characters')))
      }

      let filename
      if (parsedString.indexOf(path.sep) !== -1) {
        const lastIndex = parsedString.lastIndexOf(path.sep)
        filename = parsedString.substring(lastIndex + 1)
      } else {
        filename = parsedString
      }

      if (!filename) {
        reject(new Error(i18n.t('Settings.Player Settings.Screenshot.Error.Empty File Name')))
      }

      resolve(parsedString)
    })
  },

  /**
   * @param {import('../types/store').ActionContext<typeof state>} context
   * @param {Object} param1
   * @param {any[]} param1.videos
   * @param {any} param1.newPlaylistDefaultProperties
   */
  showAddToPlaylistPromptForManyVideos ({ commit }, { videos: videoObjectArray, newPlaylistDefaultProperties }) {
    let videoDataValid = true
    if (!Array.isArray(videoObjectArray)) {
      videoDataValid = false
    }
    let missingKeys = []

    if (videoDataValid) {
      const requiredVideoKeys = [
        'videoId',
        'title',
        'author',
        'authorId',
        'lengthSeconds',

        // `timeAdded` should be generated when videos are added
        // Not when a prompt is displayed
        // 'timeAdded',

        // `playlistItemId` should be generated anyway
        // 'playlistItemId',

        // `type` should be added in action anyway
        // 'type',
      ]
      // Using `every` to loop and `return false` to break
      videoObjectArray.every((video) => {
        const videoPropertyKeys = Object.keys(video)
        const missingKeysHere = requiredVideoKeys.filter(x => !videoPropertyKeys.includes(x))
        if (missingKeysHere.length > 0) {
          videoDataValid = false
          missingKeys = missingKeysHere
          return false
        }
        // Return true to continue loop
        return true
      })
    }

    if (!videoDataValid) {
      // Print error and abort
      const errorMsgText = 'Incorrect videos data passed when opening playlist prompt'
      console.error(errorMsgText)
      console.error({
        videoObjectArray,
        missingKeys,
      })
      throw new Error(errorMsgText)
    }

    commit('setShowAddToPlaylistPrompt', true)
    commit('setToBeAddedToPlaylistVideoList', videoObjectArray)
    if (newPlaylistDefaultProperties != null) {
      commit('setNewPlaylistDefaultProperties', newPlaylistDefaultProperties)
    }
  },

  /** @param {import('../types/store').ActionContext<typeof state>} context */
  hideAddToPlaylistPrompt ({ commit }) {
    commit('setShowAddToPlaylistPrompt', false)
    // The default value properties are only valid until prompt is closed
    commit('resetNewPlaylistDefaultProperties')
  },

  /**
   * @param {import('../types/store').ActionContext<typeof state>} context
   * @param {any} data
   */
  showCreatePlaylistPrompt ({ commit }, data) {
    commit('setShowCreatePlaylistPrompt', true)
    commit('setNewPlaylistVideoObject', data)
  },

  /** @param {import('../types/store').ActionContext<typeof state>} context */
  hideCreatePlaylistPrompt ({ commit }) {
    commit('setShowCreatePlaylistPrompt', false)
  },

  /** @param {import('../types/store').ActionContext<typeof state>} context */
  showSearchFilters ({ commit }) {
    commit('setShowSearchFilters', true)
  },

  /** @param {import('../types/store').ActionContext<typeof state>} context */
  hideSearchFilters ({ commit }) {
    commit('setShowSearchFilters', false)
  },

  /**
   * @param {import('../types/store').ActionContext<typeof state>} context
   * @param {boolean} value
   */
  updateShowProgressBar ({ commit }, value) {
    commit('setShowProgressBar', value)
  },

  /**
   * @param {import('../types/store').ActionContext<typeof state>} context
   * @param {string} locale
   */
  async getRegionData ({ commit }, locale) {
    const localePathExists = process.env.GEOLOCATION_NAMES.includes(locale)

    const url = createWebURL(`/static/geolocations/${localePathExists ? locale : 'en-US'}.json`)

    const countries = await (await fetch(url)).json()

    const regionNames = countries.map((entry) => { return entry.name })
    const regionValues = countries.map((entry) => { return entry.code })

    commit('setRegionNames', regionNames)
    commit('setRegionValues', regionValues)
  },

  /**
   * @param {import('../types/store').ActionContext<typeof state>} context
   * @param {string} urlStr
   */
  async getYoutubeUrlInfo({ state }, urlStr) {
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

    if (CHANNEL_HANDLE_REGEX.test(urlStr)) {
      urlStr = `https://www.youtube.com/${urlStr}`
    }

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
      /^\/(?:(?:channel|user|c)\/)?(?<channelId>[^/]+)(?:\/(?<tab>join|featured|videos|shorts|live|streams|podcasts|releases|playlists|about|community|channels))?\/?$/

    const hashtagPattern = /^\/hashtag\/(?<tag>[^#&/?]+)$/

    const typePatterns = new Map([
      ['playlist', /^(\/playlist\/?|\/embed(\/?videoseries)?)$/],
      ['search', /^\/results|search\/?$/],
      ['hashtag', hashtagPattern],
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
        let searchQuery = null
        if (url.searchParams.has('search_query')) {
          // https://www.youtube.com/results?search_query={QUERY}
          searchQuery = url.searchParams.get('search_query')
          url.searchParams.delete('search_query')
        }
        if (url.searchParams.has('q')) {
          // https://redirect.invidious.io/search?q={QUERY}
          searchQuery = url.searchParams.get('q')
          url.searchParams.delete('q')
        }
        if (searchQuery == null) {
          throw new Error('Search: "search_query" field not found')
        }

        const searchSettings = state.searchSettings
        const query = {
          sortBy: searchSettings.sortBy,
          time: searchSettings.time,
          type: searchSettings.type,
          duration: searchSettings.duration,
          features: searchSettings.features
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
        const match = url.pathname.match(hashtagPattern)
        const hashtag = match.groups.tag

        return {
          urlType: 'hashtag',
          hashtag
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
        if (!channelId) {
          throw new Error('Channel: could not extract id')
        }

        let subPath = null
        switch (match.groups.tab) {
          case 'shorts':
            subPath = 'shorts'
            break
          case 'live':
          case 'streams':
            subPath = 'live'
            break
          case 'playlists':
            subPath = 'playlists'
            break
          case 'podcasts':
            subPath = 'podcasts'
            break
          case 'releases':
            subPath = 'releases'
            break
          case 'channels':
          case 'about':
            subPath = 'about'
            break
          case 'community':
            subPath = 'community'
            break
          default:
            subPath = 'videos'
            break
        }
        return {
          urlType: 'channel',
          channelId,
          subPath,
          // The original URL could be from Invidious.
          // We need to make sure it starts with youtube.com, so that YouTube's resolve endpoint can recognise it
          url: `https://www.youtube.com${url.pathname}`
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

  /** @param {import('../types/store').ActionContext<typeof state>} context */
  clearSessionSearchHistory ({ commit }) {
    commit('setSessionSearchHistory', [])
  },

  /** @param {import('../types/store').ActionContext<typeof state>} context */
  async getExternalPlayerCmdArgumentsData ({ commit }) {
    const url = createWebURL('/static/external-player-map.json')
    const externalPlayerMap = await (await fetch(url)).json()
    // Sort external players alphabetically & case-insensitive, keep default entry at the top
    const playerNone = externalPlayerMap.shift()
    externalPlayerMap.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
    externalPlayerMap.unshift(playerNone)

    const externalPlayerNames = externalPlayerMap.map((entry) => { return entry.name })
    const externalPlayerValues = externalPlayerMap.map((entry) => { return entry.value })
    const externalPlayerCmdArguments = externalPlayerMap.reduce((result, item) => {
      result[item.value] = item.cmdArguments
      return result
    }, {})

    commit('setExternalPlayerNames', externalPlayerNames)
    commit('setExternalPlayerValues', externalPlayerValues)
    commit('setExternalPlayerCmdArguments', externalPlayerCmdArguments)
  },

  /**
   * @param {import('../types/store').ActionContext<typeof state>} context
   * @param {any} payload
   */
  openInExternalPlayer ({ state, rootState }, payload) {
    const args = []
    const externalPlayer = rootState.settings.externalPlayer
    const cmdArgs = state.externalPlayerCmdArguments[externalPlayer]
    const executable = rootState.settings.externalPlayerExecutable !== ''
      ? rootState.settings.externalPlayerExecutable
      : cmdArgs.defaultExecutable
    const ignoreWarnings = rootState.settings.externalPlayerIgnoreWarnings
    const ignoreDefaultArgs = rootState.settings.externalPlayerIgnoreDefaultArgs
    const customArgs = rootState.settings.externalPlayerCustomArgs

    if (ignoreDefaultArgs) {
      if (typeof customArgs === 'string' && customArgs !== '') {
        const custom = customArgs.split(';')
        args.push(...custom)
      }
      if (payload.videoId != null) args.push(`${cmdArgs.videoUrl}https://www.youtube.com/watch?v=${payload.videoId}`)
    } else {
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
          if (cmdArgs.defaultExecutable.startsWith('mpc')) {
            // For mpc-hc and mpc-be, which require startOffset to be in milliseconds
            args.push(cmdArgs.startOffset, (Math.trunc(payload.watchProgress) * 1000))
          } else if (cmdArgs.startOffset.endsWith('=')) {
            // For players using `=` in arguments
            // e.g. vlc --start-time=xxxxx
            args.push(`${cmdArgs.startOffset}${payload.watchProgress}`)
          } else {
            // For players using space in arguments
            // e.g. smplayer -start xxxxx
            args.push(cmdArgs.startOffset, Math.trunc(payload.watchProgress))
          }
        } else if (!ignoreWarnings) {
          showExternalPlayerUnsupportedActionToast(externalPlayer, i18n.t('Video.External Player.Unsupported Actions.starting video at offset'))
        }
      }

      if (payload.playbackRate != null) {
        if (typeof cmdArgs.playbackRate === 'string') {
          args.push(`${cmdArgs.playbackRate}${payload.playbackRate}`)
        } else if (!ignoreWarnings) {
          showExternalPlayerUnsupportedActionToast(externalPlayer, i18n.t('Video.External Player.Unsupported Actions.setting a playback rate'))
        }
      }

      // Check whether the video is in a playlist
      if (typeof cmdArgs.playlistUrl === 'string' && payload.playlistId != null && payload.playlistId !== '') {
        if (payload.playlistIndex != null) {
          if (typeof cmdArgs.playlistIndex === 'string') {
            args.push(`${cmdArgs.playlistIndex}${payload.playlistIndex}`)
          } else if (!ignoreWarnings) {
            showExternalPlayerUnsupportedActionToast(externalPlayer, i18n.t('Video.External Player.Unsupported Actions.opening specific video in a playlist (falling back to opening the video)'))
          }
        }

        if (payload.playlistReverse) {
          if (typeof cmdArgs.playlistReverse === 'string') {
            args.push(cmdArgs.playlistReverse)
          } else if (!ignoreWarnings) {
            showExternalPlayerUnsupportedActionToast(externalPlayer, i18n.t('Video.External Player.Unsupported Actions.reversing playlists'))
          }
        }

        if (payload.playlistShuffle) {
          if (typeof cmdArgs.playlistShuffle === 'string') {
            args.push(cmdArgs.playlistShuffle)
          } else if (!ignoreWarnings) {
            showExternalPlayerUnsupportedActionToast(externalPlayer, i18n.t('Video.External Player.Unsupported Actions.shuffling playlists'))
          }
        }

        if (payload.playlistLoop) {
          if (typeof cmdArgs.playlistLoop === 'string') {
            args.push(cmdArgs.playlistLoop)
          } else if (!ignoreWarnings) {
            showExternalPlayerUnsupportedActionToast(externalPlayer, i18n.t('Video.External Player.Unsupported Actions.looping playlists'))
          }
        }

        // If the player supports opening playlists but not indexes, send only the video URL if an index is specified
        if (cmdArgs.playlistIndex == null && payload.playlistIndex != null && payload.playlistIndex !== '') {
          args.push(`${cmdArgs.videoUrl}https://youtube.com/watch?v=${payload.videoId}`)
        } else {
          args.push(`${cmdArgs.playlistUrl}https://youtube.com/playlist?list=${payload.playlistId}`)
        }
      } else {
        if (payload.playlistId != null && payload.playlistId !== '' && !ignoreWarnings) {
          showExternalPlayerUnsupportedActionToast(externalPlayer, i18n.t('Video.External Player.Unsupported Actions.opening playlists'))
        }
        if (payload.videoId != null) {
          args.push(`${cmdArgs.videoUrl}https://www.youtube.com/watch?v=${payload.videoId}`)
        }
      }
    }

    const videoOrPlaylist = payload.playlistId != null && payload.playlistId !== ''
      ? i18n.t('Video.External Player.playlist')
      : i18n.t('Video.External Player.video')

    showToast(i18n.t('Video.External Player.OpeningTemplate', { videoOrPlaylist, externalPlayer }))

    if (process.env.IS_ELECTRON) {
      const { ipcRenderer } = require('electron')
      ipcRenderer.send(IpcChannels.OPEN_IN_EXTERNAL_PLAYER, { executable, args })
    }
  },

  /**
   * @param {import('../types/store').ActionContext<typeof state>} context
   * @param {Object} payload
   * @param {string} payload.profileId
   * @param {any} payload.timestamp
   */
  updateLastCommunityRefreshTimestampByProfile ({ commit }, payload) {
    commit('updateLastCommunityRefreshTimestampByProfile', payload)
  },

  /**
   * @param {import('../types/store').ActionContext<typeof state>} context
   * @param {Object} payload
   * @param {string} payload.profileId
   * @param {any} payload.timestamp
   */
  updateLastShortRefreshTimestampByProfile ({ commit }, payload) {
    commit('updateLastShortRefreshTimestampByProfile', payload)
  },

  /**
   * @param {import('../types/store').ActionContext<typeof state>} context
   * @param {Object} payload
   * @param {string} payload.profileId
   * @param {any} payload.timestamp
   */
  updateLastLiveRefreshTimestampByProfile ({ commit }, payload) {
    commit('updateLastLiveRefreshTimestampByProfile', payload)
  },

  /**
   * @param {import('../types/store').ActionContext<typeof state>} context
   * @param {Object} payload
   * @param {string} payload.profileId
   * @param {any} payload.timestamp
   */
  updateLastVideoRefreshTimestampByProfile ({ commit }, payload) {
    commit('updateLastVideoRefreshTimestampByProfile', payload)
  }
}

const mutations = {
  /** @param {typeof state} state */
  toggleSideNav (state) {
    state.isSideNavOpen = !state.isSideNavOpen
  },

  /**
   * @param {typeof state} state
   * @param {boolean} value
   */
  setOutlinesHidden(state, value) {
    state.outlinesHidden = value
  },

  /**
   * @param {typeof state} state
   * @param {boolean} value
   */
  setShowProgressBar (state, value) {
    state.showProgressBar = value
  },

  /**
   * @param {typeof state} state
   * @param {number} value
   */
  setProgressBarPercentage (state, value) {
    state.progressBarPercentage = value
  },

  /**
   * @param {typeof state} state
   * @param {any[]} history
   */
  setSessionSearchHistory (state, history) {
    state.sessionSearchHistory = history
  },

  /**
   * @param {typeof state} state
   * @param {any} cache
   */
  setDeArrowCache (state, cache) {
    state.deArrowCache = cache
  },

  /**
   * @param {typeof state} state
   * @param {any} payload
   */
  addVideoToDeArrowCache (state, payload) {
    const sameVideo = state.deArrowCache[payload.videoId]

    if (!sameVideo) {
      // setting properties directly doesn't trigger watchers in Vue 2,
      // so we need to use Vue's set function
      vueSet(state.deArrowCache, payload.videoId, payload)
    }
  },

  /**
   * @param {typeof state} state
   * @param {any} payload
   */
  addThumbnailToDeArrowCache (state, payload) {
    vueSet(state.deArrowCache, payload.videoId, payload)
  },

  /**
   * @param {typeof state} state
   * @param {any} payload
   */
  addToSessionSearchHistory (state, payload) {
    const sameSearch = state.sessionSearchHistory.findIndex((search) => {
      return search.query === payload.query && searchFiltersMatch(payload.searchSettings, search.searchSettings)
    })

    if (sameSearch !== -1) {
      state.sessionSearchHistory[sameSearch].data = payload.data
      if (payload.nextPageRef) {
        // Local API
        state.sessionSearchHistory[sameSearch].nextPageRef = payload.nextPageRef
      } else if (payload.searchPage) {
        // Invidious API
        state.sessionSearchHistory[sameSearch].searchPage = payload.searchPage
      }
    } else {
      state.sessionSearchHistory.push(payload)
    }
  },

  /**
   * @param {typeof state} state
   * @param {boolean} payload
   */
  setShowAddToPlaylistPrompt (state, payload) {
    state.showAddToPlaylistPrompt = payload
  },

  /**
   * @param {typeof state} state
   * @param {boolean} payload
   */
  setShowCreatePlaylistPrompt (state, payload) {
    state.showCreatePlaylistPrompt = payload
  },

  /**
   * @param {typeof state} state
   * @param {boolean} payload
   */
  setShowSearchFilters (state, payload) {
    state.showSearchFilters = payload
  },

  /**
   * @param {typeof state} state
   * @param {any[]} payload
   */
  setToBeAddedToPlaylistVideoList (state, payload) {
    state.toBeAddedToPlaylistVideoList = payload
  },

  /**
   * @param {typeof state} state
   * @param {any} payload
   */
  setNewPlaylistDefaultProperties (state, payload) {
    state.newPlaylistDefaultProperties = payload
  },
  /** @param {typeof state} state */
  resetNewPlaylistDefaultProperties (state) {
    state.newPlaylistDefaultProperties = {}
  },

  /**
   * @param {typeof state} state
   * @param {any} payload
   */
  setNewPlaylistVideoObject (state, payload) {
    state.newPlaylistVideoObject = payload
  },

  /**
   * @param {typeof state} state
   * @param {any[]} value
   */
  setPopularCache (state, value) {
    state.popularCache = value
  },

  /**
   * @param {typeof state} state
   * @param {Object} payload
   * @param {any[]} payload.value
   * @param {'default' | 'music' | 'gaming' | 'movies'} payload.page
   */
  setTrendingCache (state, { value, page }) {
    state.trendingCache[page] = value
  },

  /**
   * @param {typeof state} state
   * @param {any} timestamp
   */
  setLastTrendingRefreshTimestamp (state, timestamp) {
    state.lastTrendingRefreshTimestamp = timestamp
  },

  /**
   * @param {typeof state} state
   * @param {any} timestamp
   */
  setLastPopularRefreshTimestamp (state, timestamp) {
    state.lastPopularRefreshTimestamp = timestamp
  },

  /**
   * @param {typeof state} state
   * @param {Object} payload
   * @param {string} payload.profileId
   * @param {any} payload.timestamp
   */
  updateLastCommunityRefreshTimestampByProfile (state, { profileId, timestamp }) {
    vueSet(state.lastCommunityRefreshTimestampByProfile, profileId, timestamp)
  },

  /**
   * @param {typeof state} state
   * @param {Object} payload
   * @param {string} payload.profileId
   * @param {any} payload.timestamp
   */
  updateLastShortRefreshTimestampByProfile (state, { profileId, timestamp }) {
    vueSet(state.lastShortRefreshTimestampByProfile, profileId, timestamp)
  },

  /**
   * @param {typeof state} state
   * @param {Object} payload
   * @param {string} payload.profileId
   * @param {any} payload.timestamp
   */
  updateLastLiveRefreshTimestampByProfile (state, { profileId, timestamp }) {
    vueSet(state.lastLiveRefreshTimestampByProfile, profileId, timestamp)
  },

  /**
   * @param {typeof state} state
   * @param {Object} payload
   * @param {string} payload.profileId
   * @param {any} payload.timestamp
   */
  updateLastVideoRefreshTimestampByProfile (state, { profileId, timestamp }) {
    vueSet(state.lastVideoRefreshTimestampByProfile, profileId, timestamp)
  },

  /** @param {typeof state} state */
  clearTrendingCache(state) {
    state.trendingCache = {
      default: null,
      music: null,
      gaming: null,
      movies: null
    }
  },

  /**
   * @param {typeof state} state
   * @param {any | null} value
   */
  setCachedPlaylist(state, value) {
    state.cachedPlaylist = value
  },

  /**
   * @param {typeof state} state
   * @param {boolean} value
   */
  setSearchFilterValueChanged (state, value) {
    state.searchFilterValueChanged = value
  },

  /**
   * @param {typeof state} state
   * @param {string} value
   */
  setSearchSortBy (state, value) {
    state.searchSettings.sortBy = value
  },

  /**
   * @param {typeof state} state
   * @param {string} value
   */
  setSearchTime (state, value) {
    state.searchSettings.time = value
  },

  /**
   * @param {typeof state} state
   * @param {string} value
   */
  setSearchType (state, value) {
    state.searchSettings.type = value
  },

  /**
   * @param {typeof state} state
   * @param {string} value
   */
  setSearchDuration (state, value) {
    state.searchSettings.duration = value
  },

  /**
   * @param {typeof state} state
   * @param {string[]} value
   */
  setSearchFeatures (state, value) {
    state.searchSettings.features = value
  },

  /**
   * @param {typeof state} state
   * @param {string[]} value
   */
  setRegionNames (state, value) {
    state.regionNames = value
  },

  /**
   * @param {typeof state} state
   * @param {string[]} value
   */
  setRegionValues (state, value) {
    state.regionValues = value
  },

  /**
   * @param {typeof state} state
   * @param {any[]} value
   */
  setRecentBlogPosts (state, value) {
    state.recentBlogPosts = value
  },

  /**
   * @param {typeof state} state
   * @param {string[]} value
   */
  setExternalPlayerNames (state, value) {
    state.externalPlayerNames = value
  },

  /**
   * @param {typeof state} state
   * @param {string[]} value
   */
  setExternalPlayerValues (state, value) {
    state.externalPlayerValues = value
  },

  /**
   * @param {typeof state} state
   * @param {any} value
   */
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
