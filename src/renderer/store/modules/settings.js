import electron from 'electron'
import Datastore from 'nedb'
const localDataStorage = electron.remote.app.getPath('userData')

const settingsDb = new Datastore({
  filename: localDataStorage + '/settings.db',
  autoload: true
})

const state = {
  currentTheme: 'lightRed',
  barColor: false,
  listType: 'grid',
  invidiousInstance: 'https://invidio.us',
  backendPreference: 'local',
  useClickBaitRemover: true,
  thumbnailPreference: '',
  backendFallback: true,
  videoFormatPreference: 'dash',
  defaultQuality: 'Auto',
  videoAutoplay: true,
  playlistAutoplay: true,
  playNextVideo: false,
  checkForUpdates: true,
  useTor: false,
  history: true,
  subtitles: false,
  player: 'dash',
  volume: 1,
  rate: '1',
  proxy: 'SOCKS5://127.0.0.1:9050',
  proxyVideos: false,
  region: 'US',
  debugMode: false,
  landingPage: 'subscriptions',
  disctractionFreeMode: false,
  hideWatchedSubs: false,
  profileList: [{ name: 'All Channels', color: '#304FFE' }],
  defaultProfile: 'All Channels'
}

const getters = {
  getBackendFallback: () => {
    return state.backendFallback
  },

  getCheckForUpdates: () => {
    return state.checkForUpdates
  },

  getBarColor: () => {
    return state.barColor
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

  getVideoFormatPreference: () => {
    return state.videoFormatPreference
  },

  getAutoplay: () => {
    return state.videoAutoplay
  }
}

const actions = {
  grabUserSettings ({ commit }) {
    settingsDb.find({}, (err, results) => {
      if (!err) {
        results.forEach((result) => {
          switch (result._id) {
            case 'backendFallback':
              commit('setBackendFallback', result.value)
              break
            case 'checkForUpdates':
              commit('setCheckForUpdates', result.value)
              break
            case 'barColor':
              commit('setBarColor', result.value)
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
          }
        })
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

  updateBarColor ({ commit }, barColor) {
    settingsDb.update({ _id: 'barColor' }, { _id: 'barColor', value: barColor }, { upsert: true }, (err, numReplaced) => {
      if (!err) {
        commit('setBarColor', barColor)
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

  updateUseTor ({ commit }, useTor) {
    settingsDb.update({ _id: useTor }, { value: useTor }, { upsert: true }, (err, useTor) => {
      if (!err) {
        commit('setUseTor', useTor)
      }
    })
  },

  updateSetHistory ({ commit }, history) {
    settingsDb.update({ _id: history }, { value: history }, { upsert: true }, (err, history) => {
      if (!err) {
        commit('setHistory', history)
      }
    })
  },

  updateAutoPlay ({ commit }, autoplay) {
    settingsDb.update({ _id: autoplay }, { value: autoplay }, { upsert: true }, (err, autoplay) => {
      if (!err) {
        commit('setAutoplay', autoplay)
      }
    })
  },

  updateAutoPlayPlaylists ({ commit }, autoplayPlaylists) {
    settingsDb.update({ _id: autoplayPlaylists }, { value: autoplayPlaylists }, { upsert: true }, (err, autoplayPlaylists) => {
      if (!err) {
        commit('setAutoplayPlaylists', autoplayPlaylists)
      }
    })
  }
}

const mutations = {
  setCurrentTheme (state, currentTheme) {
    state.barColor = currentTheme
  },
  setBackendFallback (state, backendFallback) {
    state.backendFallback = backendFallback
  },
  setCheckForUpdates (state, checkForUpdates) {
    state.checkForUpdates = checkForUpdates
  },
  setBarColor (state, barColor) {
    state.barColor = barColor
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
  setUseTor (state, useTor) {
    state.useTor = useTor
  },
  setHistory (state, history) {
    state.history = history
  },
  setAutoplay (state, autoplay) {
    state.autoplay = autoplay
  },
  setAutoplayPlaylists (state, autoplayPlaylists) {
    state.autoplayPlaylists = autoplayPlaylists
  },
  setPlayNextVideo (state, playNextVideo) {
    state.playNextVideo = playNextVideo
  },
  setSubtitles (state, subtitles) {
    state.subtitles = subtitles
  },
  setUpdates (state, updates) {
    state.updates = updates
  },
  setLocalScrape (state, localScrape) {
    state.localScrape = localScrape
  },
  setPlayer (state, player) {
    state.player = player
  },
  setQuality (state, quality) {
    state.quality = quality
  },
  setVolume (state, volume) {
    state.volume = volume
  },
  setRate (state, rate) {
    state.rate = rate
  },
  setProxy (state, proxy) {
    state.proxy = proxy
  },
  setProxyVideos (state, proxyVideos) {
    state.proxyVideos = proxyVideos
  },
  setDebugMode (state, debugMode) {
    state.debugMode = debugMode
  },
  setStartScreen (state, startScreen) {
    state.startScreen = startScreen
  },
  setDistractionFreeMode (state, disctractionFreeMode) {
    state.disctractionFreeMode = disctractionFreeMode
  },
  setHideWatchedSubs (state, hideWatchedSubs) {
    state.hideWatchedSubs = hideWatchedSubs
  },
  setVideoView (state, videoView) {
    state.videoView = videoView
  },
  setProfileList (state, profileList) {
    state.profileList = profileList
  },
  setDefaultProfile (state, defaultProfile) {
    state.defaultProfile = defaultProfile
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
