import i18n from '../../i18n/index'
import { set as vueSet } from 'vue'

import { DefaultFolderKind } from '../../../constants'
import {
  CHANNEL_HANDLE_REGEX,
  createWebURL,
  getVideoParamsFromUrl,
  replaceFilenameForbiddenChars,
  searchFiltersMatch,
  showExternalPlayerUnsupportedActionToast,
  showToast
} from '../../helpers/utils'

const state = {
  isSideNavOpen: false,
  outlinesHidden: true,
  sessionSearchHistory: [],
  popularCache: null,
  trendingCache: {
    default: null,
    music: null,
    gaming: null,
    movies: null
  },
  cachedPlaylist: null,
  deArrowCache: {},
  showProgressBar: false,
  showAddToPlaylistPrompt: false,
  showCreatePlaylistPrompt: false,
  isKeyboardShortcutPromptShown: false,
  showSearchFilters: false,
  searchFilterValueChanged: false,
  progressBarPercentage: 0,
  toBeAddedToPlaylistVideoList: [],
  newPlaylistDefaultProperties: {},
  newPlaylistVideoObject: [],
  regionNames: [],
  regionValues: [],
  recentBlogPosts: [],
  searchSettings: {
    sortBy: 'relevance',
    time: '',
    type: 'all',
    duration: '',
    features: [],
  },
  externalPlayerNames: [],
  externalPlayerValues: [],
  externalPlayerCmdArguments: {},
  lastPopularRefreshTimestamp: '',
  lastTrendingRefreshTimestamp: {
    default: '',
    music: '',
    gaming: '',
    movies: ''
  },
  subscriptionFirstAutoFetchRunData: {
    videos: false,
    liveStreams: false,
    shorts: false,
    posts: false,
  },
  appTitle: ''
}

const getters = {
  getIsSideNavOpen(state) {
    return state.isSideNavOpen
  },

  getOutlinesHidden(state) {
    return state.outlinesHidden
  },

  getSessionSearchHistory(state) {
    return state.sessionSearchHistory
  },

  getDeArrowCache: (state) => {
    return state.deArrowCache
  },

  getPopularCache(state) {
    return state.popularCache
  },

  getTrendingCache(state) {
    return state.trendingCache
  },

  getCachedPlaylist(state) {
    return state.cachedPlaylist
  },

  getSearchSettings(state) {
    return state.searchSettings
  },

  getSearchFilterValueChanged(state) {
    return state.searchFilterValueChanged
  },

  getIsKeyboardShortcutPromptShown(state) {
    return state.isKeyboardShortcutPromptShown
  },

  getShowAddToPlaylistPrompt(state) {
    return state.showAddToPlaylistPrompt
  },

  getShowCreatePlaylistPrompt(state) {
    return state.showCreatePlaylistPrompt
  },

  getShowSearchFilters(state) {
    return state.showSearchFilters
  },

  getToBeAddedToPlaylistVideoList(state) {
    return state.toBeAddedToPlaylistVideoList
  },

  getNewPlaylistDefaultProperties(state) {
    return state.newPlaylistDefaultProperties
  },

  getNewPlaylistVideoObject(state) {
    return state.newPlaylistVideoObject
  },

  getShowProgressBar(state) {
    return state.showProgressBar
  },

  getProgressBarPercentage(state) {
    return state.progressBarPercentage
  },

  getRegionNames(state) {
    return state.regionNames
  },

  getRegionValues(state) {
    return state.regionValues
  },

  getRecentBlogPosts(state) {
    return state.recentBlogPosts
  },

  getExternalPlayerNames(state) {
    return state.externalPlayerNames
  },

  getExternalPlayerValues(state) {
    return state.externalPlayerValues
  },

  getExternalPlayerCmdArguments (state) {
    return state.externalPlayerCmdArguments
  },

  getLastTrendingRefreshTimestamp(state) {
    return state.lastTrendingRefreshTimestamp
  },

  getLastPopularRefreshTimestamp(state) {
    return state.lastPopularRefreshTimestamp
  },

  getSubscriptionForVideosFirstAutoFetchRun(state) {
    return state.subscriptionFirstAutoFetchRunData.videos === true
  },
  getSubscriptionForLiveStreamsFirstAutoFetchRun (state) {
    return state.subscriptionFirstAutoFetchRunData.liveStreams === true
  },
  getSubscriptionForShortsFirstAutoFetchRun (state) {
    return state.subscriptionFirstAutoFetchRunData.shorts === true
  },
  getSubscriptionForPostsFirstAutoFetchRun (state) {
    return state.subscriptionFirstAutoFetchRunData.posts === true
  },
  getAppTitle (state) {
    return state.appTitle
  }
}

const actions = {
  showOutlines({ commit }) {
    commit('setOutlinesHidden', false)
  },

  hideOutlines({ commit }) {
    commit('setOutlinesHidden', true)
  },

  async downloadMedia({ rootState }, { url, title, mimeType }) {
    const extension = mimeType === 'audio/mp4' ? 'm4a' : mimeType.split('/')[1]

    const fileName = `${replaceFilenameForbiddenChars(title)}.${extension}`

    if (rootState.settings.downloadAskPath) {
      /** @type {FileSystemFileHandle} */
      let handle

      try {
        handle = await window.showSaveFilePicker({
          excludeAcceptAllOption: true,
          id: 'downloads',
          startIn: 'downloads',
          suggestedName: fileName,
          types: [{
            accept: {
              [mimeType]: [`.${extension}`]
            }
          }]
        })
      } catch (error) {
        // user pressed cancel in the file picker
        if (error.name === 'AbortError') {
          return
        }

        console.error(error)
        showToast(i18n.t('Downloading failed', { videoTitle: title }))
        return
      }

      showToast(i18n.t('Starting download', { videoTitle: title }))

      let writeableFileStream

      try {
        const response = await fetch(url)

        if (response.ok) {
          writeableFileStream = await handle.createWritable()

          await response.body.pipeTo(writeableFileStream, { preventClose: true })
          showToast(i18n.t('Downloading has completed', { videoTitle: title }))
        } else {
          throw new Error(`Bad status code: ${response.status}`)
        }
      } catch (error) {
        console.error(error)
        showToast(i18n.t('Downloading failed', { videoTitle: title }))
      } finally {
        if (writeableFileStream) {
          await writeableFileStream.close()
        }
      }
    } else {
      showToast(i18n.t('Starting download', { videoTitle: title }))

      try {
        const response = await fetch(url)

        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer()

          if (process.env.IS_ELECTRON) {
            await window.ftElectron.writeToDefaultFolder(DefaultFolderKind.DOWNLOADS, fileName, arrayBuffer)
          }

          showToast(i18n.t('Downloading has completed', { videoTitle: title }))
        } else {
          throw new Error(`Bad status code: ${response.status}`)
        }
      } catch (error) {
        console.error(error)
        showToast(i18n.t('Downloading failed', { videoTitle: title }))
      }
    }
  },

  parseScreenshotCustomFileName: function({ rootState }, payload) {
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
      throw new Error(i18n.t('Settings.Player Settings.Screenshot.Error.Forbidden Characters'))
    }

    if (!parsedString) {
      throw new Error(i18n.t('Settings.Player Settings.Screenshot.Error.Empty File Name'))
    }

    return parsedString
  },

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
        'lengthSeconds',

        // These two properties will be missing for shorts added to a playlist from anywhere but the watch page
        // 'author',
        // 'authorId',

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

  hideAddToPlaylistPrompt ({ commit }) {
    commit('setShowAddToPlaylistPrompt', false)
    // The default value properties are only valid until prompt is closed
    commit('resetNewPlaylistDefaultProperties')
  },

  showCreatePlaylistPrompt ({ commit }, data) {
    commit('setShowCreatePlaylistPrompt', true)
    commit('setNewPlaylistVideoObject', data)
  },

  showKeyboardShortcutPrompt ({ commit }) {
    commit('setIsKeyboardShortcutPromptShown', true)
  },

  hideKeyboardShortcutPrompt ({ commit }) {
    commit('setIsKeyboardShortcutPromptShown', false)
  },

  showSearchFilters ({ commit }) {
    commit('setShowSearchFilters', true)
  },

  hideSearchFilters ({ commit }) {
    commit('setShowSearchFilters', false)
  },

  updateShowProgressBar ({ commit }, value) {
    commit('setShowProgressBar', value)
  },

  async getRegionData ({ commit }, locale) {
    const localePathExists = process.env.GEOLOCATION_NAMES.includes(locale)

    const url = createWebURL(`/static/geolocations/${localePathExists ? locale : 'en-US'}.json`)

    const countries = await (await fetch(url)).json()

    commit('setRegionNames', countries.names)
    commit('setRegionValues', countries.codes)
  },

  async getYoutubeUrlInfo({ rootState, state }, urlStr) {
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
      /^\/(?:(?:channel|user|c)\/)?(?<channelId>[^/]+)(?:\/(?<tab>join|featured|videos|shorts|live|streams|podcasts|releases|courses|playlists|about|community|channels))?\/?$/

    const hashtagPattern = /^\/hashtag\/(?<tag>[^#&/?]+)$/

    const postPattern = /^\/post\/(?<postId>.+)/
    const feedPattern = /^\/feed\/(?<type>trending|subscriptions|history|playlists|you|library)/
    const typePatterns = new Map([
      ['playlist', /^(\/playlist\/?|\/embed(\/?videoseries)?)$/],
      ['search', /^\/results|search\/?$/],
      ['hashtag', hashtagPattern],
      ['post', postPattern],
      ['feed', feedPattern],
      ['channel', channelPattern],
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

      case 'post': {
        const match = url.pathname.match(postPattern)
        const postId = match.groups.postId
        const query = { authorId: url.searchParams.get('ucid') }
        return {
          urlType: 'post',
          postId,
          query
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
          case 'courses':
            subPath = 'courses'
            break
          case 'releases':
            subPath = 'releases'
            break
          case 'channels':
          case 'about':
            subPath = 'about'
            break
          case 'community':
            if (url.searchParams.has('lb')) {
              // if it has the lb search parameter then it is linking a specific community post
              const postId = url.searchParams.get('lb')
              const query = { authorId: channelId }
              return {
                urlType: 'post',
                postId,
                query
              }
            }
            subPath = 'community'
            break
          case 'videos':
            subPath = 'videos'
            break
          default:
            subPath = rootState.settings.backendPreference === 'local' && !rootState.settings.hideChannelHome ? 'home' : 'videos'
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
      case 'feed': {
        /** @type {'trending' | 'subscriptions' | 'history' | 'playlists' | 'you' | 'library'} */
        const feedType = url.pathname.match(feedPattern).groups.type

        if (feedType === 'playlists' || feedType === 'you' || feedType === 'library') {
          return { urlType: 'userplaylists' }
        } else {
          return { urlType: feedType }
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
      if (typeof customArgs === 'string' && customArgs !== '[]') {
        const custom = JSON.parse(customArgs)
        args.push(...custom)
      }
      if (payload.videoId != null) args.push(`${cmdArgs.videoUrl}https://www.youtube.com/watch?v=${payload.videoId}`)
    } else {
      // Append custom user-defined arguments,
      // or use the default ones specified for the external player.
      if (typeof customArgs === 'string' && customArgs !== '[]') {
        const custom = JSON.parse(customArgs)
        args.push(...custom)
      } else if (Array.isArray(cmdArgs.defaultCustomArguments)) {
        args.push(...cmdArgs.defaultCustomArguments)
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
      window.ftElectron.openInExternalPlayer(executable, args)
    }
  },
}

const mutations = {
  toggleSideNav (state) {
    state.isSideNavOpen = !state.isSideNavOpen
  },

  setOutlinesHidden(state, value) {
    state.outlinesHidden = value
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

  setDeArrowCache (state, cache) {
    state.deArrowCache = cache
  },

  addVideoToDeArrowCache (state, payload) {
    const sameVideo = state.deArrowCache[payload.videoId]

    if (!sameVideo) {
      // setting properties directly doesn't trigger watchers in Vue 2,
      // so we need to use Vue's set function
      vueSet(state.deArrowCache, payload.videoId, payload)
    }
  },

  addThumbnailToDeArrowCache (state, payload) {
    vueSet(state.deArrowCache, payload.videoId, payload)
  },

  removeFromSessionSearchHistory (state, query) {
    state.sessionSearchHistory = state.sessionSearchHistory.filter((search) => search.query !== query)
  },

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

  setShowAddToPlaylistPrompt (state, payload) {
    state.showAddToPlaylistPrompt = payload
  },

  setShowCreatePlaylistPrompt (state, payload) {
    state.showCreatePlaylistPrompt = payload
  },

  setIsKeyboardShortcutPromptShown (state, payload) {
    state.isKeyboardShortcutPromptShown = payload
  },

  setShowSearchFilters (state, payload) {
    state.showSearchFilters = payload
  },

  setToBeAddedToPlaylistVideoList (state, payload) {
    state.toBeAddedToPlaylistVideoList = payload
  },

  setNewPlaylistDefaultProperties (state, payload) {
    state.newPlaylistDefaultProperties = payload
  },
  resetNewPlaylistDefaultProperties (state) {
    state.newPlaylistDefaultProperties = {}
  },

  setNewPlaylistVideoObject (state, payload) {
    state.newPlaylistVideoObject = payload
  },

  setPopularCache (state, value) {
    state.popularCache = value
  },

  setTrendingCache (state, { value, page }) {
    state.trendingCache[page] = value
  },

  /**
   * @param {typeof state} state
   * @param {{page: 'default' | 'music' | 'gaming' | 'movies', timestamp: Date}} param1
   */
  setLastTrendingRefreshTimestamp (state, { page, timestamp }) {
    state.lastTrendingRefreshTimestamp[page] = timestamp
  },

  setLastPopularRefreshTimestamp (state, timestamp) {
    state.lastPopularRefreshTimestamp = timestamp
  },

  /**
   * @param {typeof state} state
   * @param {'default' | 'music' | 'gaming' | 'movies'} page
   */
  clearTrendingCache(state, page) {
    state.trendingCache[page] = null
  },

  setCachedPlaylist(state, value) {
    state.cachedPlaylist = value
  },

  setSearchFilterValueChanged (state, value) {
    state.searchFilterValueChanged = value
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

  setSearchFeatures (state, value) {
    state.searchSettings.features = value
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

  setExternalPlayerValues (state, value) {
    state.externalPlayerValues = value
  },

  setExternalPlayerCmdArguments (state, value) {
    state.externalPlayerCmdArguments = value
  },

  // Use this to set the app title / document.title
  setAppTitle (state, value) {
    state.appTitle = value
  },

  setSubscriptionForVideosFirstAutoFetchRun (state) {
    state.subscriptionFirstAutoFetchRunData.videos = true
  },
  setSubscriptionForLiveStreamsFirstAutoFetchRun (state) {
    state.subscriptionFirstAutoFetchRunData.liveStreams = true
  },
  setSubscriptionForShortsFirstAutoFetchRun (state) {
    state.subscriptionFirstAutoFetchRunData.shorts = true
  },
  setSubscriptionForPostsFirstAutoFetchRun (state) {
    state.subscriptionFirstAutoFetchRunData.posts = true
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
