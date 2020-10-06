import Datastore from 'nedb'

let dbLocation

if (window && window.process && window.process.type === 'renderer') {
  // Electron is being used
  /* let dbLocation = localStorage.getItem('dbLocation')

  if (dbLocation === null) {
    const electron = require('electron')
    dbLocation = electron.remote.app.getPath('userData')
  } */

  const electron = require('electron')
  dbLocation = electron.remote.app.getPath('userData')

  dbLocation = dbLocation + '/settings.db'
} else {
  dbLocation = 'settings.db'
}

console.log(dbLocation)

const settingsDb = new Datastore({
  filename: dbLocation,
  autoload: true
})

const state = {
  currentTheme: 'lightRed',
  backendFallback: true,
  checkForUpdates: true,
  checkForBlogPosts: true,
  backendPreference: 'local',
  landingPage: 'subscriptions',
  region: 'US',
  listType: 'grid',
  thumbnailPreference: '',
  invidiousInstance: 'https://invidious.snopyta.org',
  defaultProfile: 'allChannels',
  barColor: false,
  enableSearchSuggestions: true,
  rememberHistory: true,
  saveWatchedProgress: true,
  autoplayVideos: true,
  autoplayPlaylists: true,
  playNextVideo: false,
  enableSubtitles: true,
  forceLocalBackendForLegacy: false,
  proxyVideos: false,
  defaultTheatreMode: false,
  defaultVolume: 1,
  defaultPlayback: 1,
  defaultVideoFormat: 'dash',
  defaultQuality: '720',
  useTor: false,
  proxy: 'SOCKS5://127.0.0.1:9050',
  debugMode: false,
  disctractionFreeMode: false,
  hideWatchedSubs: false,
  useRssFeeds: false,
  usingElectron: true,
  hideVideoViews: false,
  hideVideoLikesAndDislikes: false,
  hideChannelSubscriptions: false,
  hideCommentLikes: false,
  hideRecommendedVideos: false,
  hideTrendingVideos: false,
  hidePopularVideos: false,
  hideLiveChat: false
}

const getters = {
  getBackendFallback: () => {
    return state.backendFallback
  },

  getCheckForUpdates: () => {
    return state.checkForUpdates
  },

  getCheckForBlogPosts: () => {
    return state.checkForBlogPosts
  },

  getBarColor: () => {
    return state.barColor
  },

  getEnableSearchSuggestions: () => {
    return state.enableSearchSuggestions
  },

  getBackendPreference: () => {
    return state.backendPreference
  },

  getLandingPage: () => {
    return state.landingPage
  },

  getRegion: () => {
    return state.region
  },

  getListType: () => {
    return state.listType
  },

  getThumbnailPreference: () => {
    return state.thumbnailPreference
  },

  getInvidiousInstance: () => {
    return state.invidiousInstance
  },

  getDefaultProfile: () => {
    return state.defaultProfile
  },

  getRememberHistory: () => {
    return state.rememberHistory
  },

  getSaveWatchedProgress: () => {
    return state.saveWatchedProgress
  },

  getAutoplayVideos: () => {
    return state.autoplayVideos
  },

  getAutoplayPlaylists: () => {
    return state.autoplayPlaylists
  },

  getPlayNextVideo: () => {
    return state.playNextVideo
  },

  getEnableSubtitles: () => {
    return state.enableSubtitles
  },

  getForceLocalBackendForLegacy: () => {
    return state.forceLocalBackendForLegacy
  },

  getProxyVideos: () => {
    return state.proxyVideos
  },

  getDefaultTheatreMode: () => {
    return state.defaultTheatreMode
  },

  getDefaultVolume: () => {
    return state.defaultVolume
  },

  getDefaultPlayback: () => {
    return state.defaultPlayback
  },

  getDefaultVideoFormat: () => {
    return state.defaultVideoFormat
  },

  getDefaultQuality: () => {
    return state.defaultQuality
  },

  getHideWatchedSubs: () => {
    return state.hideWatchedSubs
  },

  getUseRssFeeds: () => {
    return state.useRssFeeds
  },

  getUsingElectron: () => {
    return state.usingElectron
  },

  getHideVideoViews: () => {
    return state.hideVideoViews
  },

  getHideVideoLikesAndDislikes: () => {
    return state.hideVideoLikesAndDislikes
  },

  getHideChannelSubscriptions: () => {
    return state.hideChannelSubscriptions
  },

  getHideCommentLikes: () => {
    return state.hideCommentLikes
  },

  getHideRecommendedVideos: () => {
    return state.hideRecommendedVideos
  },

  getHideTrendingVideos: () => {
    return state.hideTrendingVideos
  },

  getHidePopularVideos: () => {
    return state.hidePopularVideos
  },
  getHideLiveChat: () => {
    return state.hideLiveChat
  }
}

const actions = {
  grabUserSettings ({ dispatch, commit, rootState }) {
    settingsDb.find({}, (err, results) => {
      if (!err) {
        console.log(results)
        results.forEach((result) => {
          switch (result._id) {
            case 'invidiousInstance':
              if (result.value === '') {
                dispatch('updateInvidiousInstance', 'https://invidious.snopyta.org')
              } else {
                commit('setInvidiousInstance', result.value)
              }
              break
            case 'backendFallback':
              commit('setBackendFallback', result.value)
              break
            case 'defaultProfile':
              commit('setDefaultProfile', result.value)
              break
            case 'checkForUpdates':
              commit('setCheckForUpdates', result.value)
              break
            case 'checkForBlogPosts':
              commit('setCheckForBlogPosts', result.value)
              break
            case 'enableSearchSuggestions':
              commit('setEnableSearchSuggestions', result.value)
              break
            case 'backendPreference':
              commit('setBackendPreference', result.value)
              break
            case 'landingPage':
              commit('setLandingPage', result.value)
              break
            case 'region':
              commit('setRegion', result.value)
              break
            case 'listType':
              commit('setListType', result.value)
              break
            case 'thumbnailPreference':
              commit('setThumbnailPreference', result.value)
              break
            case 'barColor':
              commit('setBarColor', result.value)
              break
            case 'hideWatchedSubs':
              commit('setHideWatchedSubs', result.value)
              break
            case 'useRssFeeds':
              commit('setUseRssFeeds', result.value)
              break
            case 'rememberHistory':
              commit('setRememberHistory', result.value)
              break
            case 'saveWatchedProgress':
              commit('setSaveWatchedProgress', result.value)
              break
            case 'autoplayVideos':
              commit('setAutoplayVideos', result.value)
              break
            case 'autoplayPlaylists':
              commit('setAutoplayPlaylists', result.value)
              break
            case 'playNextVideo':
              commit('setPlayNextVideo', result.value)
              break
            case 'enableSubtitles':
              commit('setEnableSubtitles', result.value)
              break
            case 'forceLocalBackendForLegacy':
              commit('setForceLocalBackendForLegacy', result.value)
              break
            case 'proxyVideos':
              commit('setProxyVideos', result.value)
              break
            case 'defaultTheatreMode':
              commit('setDefaultTheatreMode', result.value)
              break
            case 'defaultVolume':
              commit('setDefaultVolume', result.value)
              sessionStorage.setItem('volume', result.value)
              break
            case 'defaultPlayback':
              commit('setDefaultPlayback', result.value)
              break
            case 'defaultVideoFormat':
              commit('setDefaultVideoFormat', result.value)
              break
            case 'defaultQuality':
              commit('setDefaultQuality', result.value)
              break
            case 'hideVideoViews':
              commit('setHideVideoViews', result.value)
              break
            case 'hideVideoLikesAndDislikes':
              commit('setHideVideoLikesAndDislikes', result.value)
              break
            case 'hideChannelSubscriptions':
              commit('setHideChannelSubscriptions', result.value)
              break
            case 'hideCommentLikes':
              commit('setHideCommentLikes', result.value)
              break
            case 'hideRecommendedVideos':
              commit('setHideRecommendedVideos', result.value)
              break
            case 'hideTrendingVideos':
              commit('setHideTrendingVideos', result.value)
              break
            case 'hidePopularVideos':
              commit('setHidePopularVideos', result.value)
              break
            case 'hideLiveChat':
              commit('setHideLiveChat', result.value)
              break
          }
        })
      }
    })
  },

  updateInvidiousInstance ({ commit }, invidiousInstance) {
    console.log(invidiousInstance)
    settingsDb.update({ _id: 'invidiousInstance' }, { _id: 'invidiousInstance', value: invidiousInstance }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setInvidiousInstance', invidiousInstance)
      }
    })
  },

  updateDefaultProfile ({ commit }, defaultProfile) {
    settingsDb.update({ _id: 'defaultProfile' }, { _id: 'defaultProfile', value: defaultProfile }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setDefaultProfile', defaultProfile)
      }
    })
  },

  updateBackendFallback ({ commit }, backendFallback) {
    settingsDb.update({ _id: 'backendFallback' }, { _id: 'backendFallback', value: backendFallback }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setBackendFallback', backendFallback)
      }
    })
  },

  updateCheckForUpdates ({ commit }, checkForUpdates) {
    settingsDb.update({ _id: 'checkForUpdates' }, { _id: 'checkForUpdates', value: checkForUpdates }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setCheckForUpdates', checkForUpdates)
      }
    })
  },

  updateCheckForBlogPosts ({ commit }, checkForBlogPosts) {
    settingsDb.update({ _id: 'checkForBlogPosts' }, { _id: 'checkForBlogPosts', value: checkForBlogPosts }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setCheckForBlogPosts', checkForBlogPosts)
      }
    })
  },

  updateEnableSearchSuggestions ({ commit }, enableSearchSuggestions) {
    settingsDb.update({ _id: 'enableSearchSuggestions' }, { _id: 'enableSearchSuggestions', value: enableSearchSuggestions }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setEnableSearchSuggestions', enableSearchSuggestions)
      }
    })
  },

  updateBackendPreference ({ commit }, backendPreference) {
    settingsDb.update({ _id: 'backendPreference' }, { _id: 'backendPreference', value: backendPreference }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setBackendPreference', backendPreference)
      }
    })
  },

  updateLandingPage ({ commit }, landingPage) {
    settingsDb.update({ _id: 'landingPage' }, { _id: 'landingPage', value: landingPage }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setLandingPage', landingPage)
      }
    })
  },

  updateRegion ({ commit }, region) {
    settingsDb.update({ _id: 'region' }, { _id: 'region', value: region }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setRegion', region)
      }
    })
  },

  updateListType ({ commit }, listType) {
    settingsDb.update({ _id: 'listType' }, { _id: 'listType', value: listType }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setListType', listType)
      }
    })
  },

  updateThumbnailPreference ({ commit }, thumbnailPreference) {
    settingsDb.update({ _id: 'thumbnailPreference' }, { _id: 'thumbnailPreference', value: thumbnailPreference }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setThumbnailPreference', thumbnailPreference)
      }
    })
  },

  updateBarColor ({ commit }, barColor) {
    settingsDb.update({ _id: 'barColor' }, { _id: 'barColor', value: barColor }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setBarColor', barColor)
      }
    })
  },

  updateHideWatchedSubs ({ commit }, hideWatchedSubs) {
    settingsDb.update({ _id: 'hideWatchedSubs' }, { _id: 'hideWatchedSubs', value: hideWatchedSubs }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setHideWatchedSubs', hideWatchedSubs)
      }
    })
  },

  updateUseRssFeeds ({ commit }, useRssFeeds) {
    settingsDb.update({ _id: 'useRssFeeds' }, { _id: 'useRssFeeds', value: useRssFeeds }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setUseRssFeeds', useRssFeeds)
      }
    })
  },

  updateRememberHistory ({ commit }, history) {
    settingsDb.update({ _id: 'rememberHistory' }, { _id: 'rememberHistory', value: history }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setRememberHistory', history)
      }
    })
  },

  updateSaveWatchedProgress ({ commit }, saveWatchedProgress) {
    settingsDb.update({ _id: 'saveWatchedProgress' }, { _id: 'saveWatchedProgress', value: saveWatchedProgress }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setSaveWatchedProgress', saveWatchedProgress)
      }
    })
  },

  updateAutoplayVideos ({ commit }, autoplayVideos) {
    settingsDb.update({ _id: 'autoplayVideos' }, { _id: 'autoplayVideos', value: autoplayVideos }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setAutoplayVideos', autoplayVideos)
      }
    })
  },

  updateAutoplayPlaylists ({ commit }, autoplayPlaylists) {
    settingsDb.update({ _id: 'autoplayPlaylists' }, { _id: 'autoplayPlaylists', value: autoplayPlaylists }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setAutoplayPlaylists', autoplayPlaylists)
      }
    })
  },

  updatePlayNextVideo ({ commit }, playNextVideo) {
    settingsDb.update({ _id: 'playNextVideo' }, { _id: 'playNextVideo', value: playNextVideo }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setPlayNextVideo', playNextVideo)
      }
    })
  },

  updateEnableSubtitles ({ commit }, enableSubtitles) {
    settingsDb.update({ _id: 'enableSubtitles' }, { _id: 'enableSubtitles', value: enableSubtitles }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setEnableSubtitles', enableSubtitles)
      }
    })
  },

  updateForceLocalBackendForLegacy ({ commit }, forceLocalBackendForLegacy) {
    settingsDb.update({ _id: 'forceLocalBackendForLegacy' }, { _id: 'forceLocalBackendForLegacy', value: forceLocalBackendForLegacy }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setForceLocalBackendForLegacy', forceLocalBackendForLegacy)
      }
    })
  },

  updateProxyVideos ({ commit }, proxyVideos) {
    settingsDb.update({ _id: 'proxyVideos' }, { _id: 'proxyVideos', value: proxyVideos }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setProxyVideos', proxyVideos)
      }
    })
  },

  updateDefaultTheatreMode ({ commit }, defaultTheatreMode) {
    settingsDb.update({ _id: 'defaultTheatreMode' }, { _id: 'defaultTheatreMode', value: defaultTheatreMode }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setDefaultTheatreMode', defaultTheatreMode)
      }
    })
  },

  updateDefaultVolume ({ commit }, defaultVolume) {
    settingsDb.update({ _id: 'defaultVolume' }, { _id: 'defaultVolume', value: defaultVolume }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setDefaultVolume', defaultVolume)
        sessionStorage.setItem('volume', defaultVolume)
      }
    })
  },

  updateDefaultPlayback ({ commit }, defaultPlayback) {
    settingsDb.update({ _id: 'defaultPlayback' }, { _id: 'defaultPlayback', value: defaultPlayback }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setDefaultPlayback', defaultPlayback)
      }
    })
  },

  updateDefaultVideoFormat ({ commit }, defaultVideoFormat) {
    settingsDb.update({ _id: 'defaultVideoFormat' }, { _id: 'defaultVideoFormat', value: defaultVideoFormat }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setDefaultVideoFormat', defaultVideoFormat)
      }
    })
  },

  updateDefaultQuality ({ commit }, defaultQuality) {
    settingsDb.update({ _id: 'defaultQuality' }, { _id: 'defaultQuality', value: defaultQuality }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setDefaultQuality', defaultQuality)
      }
    })
  },

  updateUseTor ({ commit }, useTor) {
    settingsDb.update({ _id: useTor }, { value: useTor }, { upsert: true }, (err, useTor) => {
      if (!err) {
        commit('setUseTor', useTor)
      }
    })
  },

  updateHideVideoViews ({ commit }, hideVideoViews) {
    settingsDb.update({ _id: 'hideVideoViews' }, { _id: 'hideVideoViews', value: hideVideoViews }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setHideVideoViews', hideVideoViews)
      }
    })
  },

  updateHideVideoLikesAndDislikes ({ commit }, hideVideoLikesAndDislikes) {
    settingsDb.update({ _id: 'hideVideoLikesAndDislikes' }, { _id: 'hideVideoLikesAndDislikes', value: hideVideoLikesAndDislikes }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setHideVideoLikesAndDislikes', hideVideoLikesAndDislikes)
      }
    })
  },

  updateHideChannelSubscriptions ({ commit }, hideChannelSubscriptions) {
    settingsDb.update({ _id: 'hideChannelSubscriptions' }, { _id: 'hideChannelSubscriptions', value: hideChannelSubscriptions }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setHideChannelSubscriptions', hideChannelSubscriptions)
      }
    })
  },

  updateHideCommentLikes ({ commit }, hideCommentLikes) {
    settingsDb.update({ _id: 'hideCommentLikes' }, { _id: 'hideCommentLikes', value: hideCommentLikes }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setHideCommentLikes', hideCommentLikes)
      }
    })
  },

  updateHideRecommendedVideos ({ commit }, hideRecommendedVideos) {
    settingsDb.update({ _id: 'hideRecommendedVideos' }, { _id: 'hideRecommendedVideos', value: hideRecommendedVideos }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setHideRecommendedVideos', hideRecommendedVideos)
      }
    })
  },

  updateHideTrendingVideos ({ commit }, hideTrendingVideos) {
    settingsDb.update({ _id: 'hideTrendingVideos' }, { _id: 'hideTrendingVideos', value: hideTrendingVideos }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setHideTrendingVideos', hideTrendingVideos)
      }
    })
  },

  updateHidePopularVideos ({ commit }, hidePopularVideos) {
    settingsDb.update({ _id: 'hidePopularVideos' }, { _id: 'hidePopularVideos', value: hidePopularVideos }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setHidePopularVideos', hidePopularVideos)
      }
    })
  },

  updateHideLiveChat ({ commit }, hideLiveChat) {
    settingsDb.update({ _id: 'hideLiveChat' }, { _id: 'hideLiveChat', value: hideLiveChat }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setHideLiveChat', hideLiveChat)
      }
    })
  }
}

const mutations = {
  setInvidiousInstance (state, invidiousInstance) {
    state.invidiousInstance = invidiousInstance
  },
  setCurrentTheme (state, currentTheme) {
    state.barColor = currentTheme
  },
  setDefaultProfile (state, defaultProfile) {
    state.defaultProfile = defaultProfile
  },
  setBackendFallback (state, backendFallback) {
    state.backendFallback = backendFallback
  },
  setCheckForUpdates (state, checkForUpdates) {
    state.checkForUpdates = checkForUpdates
  },
  setCheckForBlogPosts (state, checkForBlogPosts) {
    state.checkForBlogPosts = checkForBlogPosts
  },
  setBackendPreference (state, backendPreference) {
    state.backendPreference = backendPreference
  },
  setLandingPage (state, defaultLandingPage) {
    state.defaultLandingPage = defaultLandingPage
  },
  setRegion (state, region) {
    state.region = region
  },
  setListType (state, listType) {
    state.listType = listType
  },
  setThumbnailPreference (state, thumbnailPreference) {
    state.thumbnailPreference = thumbnailPreference
  },
  setBarColor (state, barColor) {
    state.barColor = barColor
  },
  setEnableSearchSuggestions (state, enableSearchSuggestions) {
    state.enableSearchSuggestions = enableSearchSuggestions
  },
  setRememberHistory (state, rememberHistory) {
    state.rememberHistory = rememberHistory
  },
  setSaveWatchedProgress (state, saveWatchedProgress) {
    state.saveWatchedProgress = saveWatchedProgress
  },
  setAutoplayVideos (state, autoplayVideos) {
    state.autoplayVideos = autoplayVideos
  },
  setAutoplayPlaylists (state, autoplayPlaylists) {
    state.autoplayPlaylists = autoplayPlaylists
  },
  setPlayNextVideo (state, playNextVideo) {
    state.playNextVideo = playNextVideo
  },
  setEnableSubtitles (state, enableSubtitles) {
    state.enableSubtitles = enableSubtitles
  },
  setForceLocalBackendForLegacy (state, forceLocalBackendForLegacy) {
    state.forceLocalBackendForLegacy = forceLocalBackendForLegacy
  },
  setProxyVideos (state, proxyVideos) {
    state.proxyVideos = proxyVideos
  },
  setDefaultVolume (state, defaultVolume) {
    state.defaultVolume = defaultVolume
  },
  setDefaultPlayback (state, defaultPlayback) {
    state.defaultPlayback = defaultPlayback
  },
  setDefaultVideoFormat (state, defaultVideoFormat) {
    state.defaultVideoFormat = defaultVideoFormat
  },
  setDefaultQuality (state, defaultQuality) {
    state.defaultQuality = defaultQuality
  },
  setProxy (state, proxy) {
    state.proxy = proxy
  },
  setDefaultTheatreMode (state, defaultTheatreMode) {
    state.defaultTheatreMode = defaultTheatreMode
  },
  setUseTor (state, useTor) {
    state.useTor = useTor
  },
  setDebugMode (state, debugMode) {
    state.debugMode = debugMode
  },
  setDistractionFreeMode (state, disctractionFreeMode) {
    state.disctractionFreeMode = disctractionFreeMode
  },
  setHideWatchedSubs (state, hideWatchedSubs) {
    state.hideWatchedSubs = hideWatchedSubs
  },
  setUseRssFeeds (state, useRssFeeds) {
    state.useRssFeeds = useRssFeeds
  },
  setUsingElectron (state, usingElectron) {
    state.usingElectron = usingElectron
  },
  setVideoView (state, videoView) {
    state.videoView = videoView
  },
  setProfileList (state, profileList) {
    state.profileList = profileList
  },
  setHideVideoViews (state, hideVideoViews) {
    state.hideVideoViews = hideVideoViews
  },
  setHideVideoLikesAndDislikes (state, hideVideoLikesAndDislikes) {
    state.hideVideoLikesAndDislikes = hideVideoLikesAndDislikes
  },
  setHideChannelSubscriptions (state, hideChannelSubscriptions) {
    state.hideChannelSubscriptions = hideChannelSubscriptions
  },
  setHideCommentLikes (state, hideCommentLikes) {
    state.hideCommentLikes = hideCommentLikes
  },
  setHideRecommendedVideos (state, hideRecommendedVideos) {
    state.hideRecommendedVideos = hideRecommendedVideos
  },
  setHideTrendingVideos (state, hideTrendingVideos) {
    state.hideTrendingVideos = hideTrendingVideos
  },
  setHidePopularVideos (state, hidePopularVideos) {
    state.hidePopularVideos = hidePopularVideos
  },
  setHideLiveChat (state, hideLiveChat) {
    state.hideLiveChat = hideLiveChat
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
