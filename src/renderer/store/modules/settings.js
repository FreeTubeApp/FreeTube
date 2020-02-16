import electron from 'electron'
import Datastore from 'nedb'
const localDataStorage = electron.remote.app.getPath('userData')

const settingsDb = new Datastore({
  filename: localDataStorage + '/settings.db',
  autoload: true
})

const state = {
  listType: 'grid',
  invidiousInstance: 'https://invidio.us',
  backendPreference: 'invidious',
  useClickBaitRemover: true,
  clickBaitRemoverPreference: '',
  backendFallback: true,
  autoplay: true,
  useTor: false,
  history: true,
  autoplayPlaylists: true,
  playNextVideo: false,
  subtitles: false,
  updates: true,
  localScrape: true,
  player: 'dash',
  quality: 'Auto',
  volume: 1,
  rate: '1',
  proxy: 'SOCKS5://127.0.0.1:9050',
  proxyVideos: false,
  region: 'US',
  debugMode: false,
  startScreen: 'subscriptions',
  disctractionFreeMode: false,
  hideWatchedSubs: false,
  videoView: 'grid',
  profileList: [{ name: 'All Channels', color: '#304FFE' }],
  defaultProfile: 'All Channels'
}

const getters = {
  getListType: () => {
    return state.listType
  },

  getBackendPreference: () => {
    return state.backendPreference
  },

  getBackendFallback: () => {
    return state.backendFallback
  },

  getInvidiousInstance: () => {
    return state.invidiousInstance
  },

  getUseClickBaitRemover: () => {
    return state.useClickBaitRemover
  },

  getClickBaitRemoverPreference: () => {
    return state.clickBaitRemoverPreference
  }
}

const actions = {
  save: ({ rootState }) => {
    console.log(rootState)
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
  setRegion (state, region) {
    state.region = region
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
