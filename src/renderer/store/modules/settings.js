import Datastore from 'nedb'

let dbLocation
let webframe = null

const usingElectron = window?.process?.type === 'renderer'

if (usingElectron) {
  // Electron is being used
  /* let dbLocation = localStorage.getItem('dbLocation')

  if (dbLocation === null) {
    const electron = require('electron')
    dbLocation = electron.remote.app.getPath('userData')
  } */

  const electron = require('electron')
  const ipcRenderer = electron.ipcRenderer
  dbLocation = ipcRenderer.sendSync('getUserDataPathSync')
  dbLocation = dbLocation + '/settings.db'
  webframe = electron.webframe
} else {
  dbLocation = 'settings.db'
}

console.log(dbLocation)

const settingsDb = new Datastore({
  filename: dbLocation,
  autoload: true
})

/**
 * NOTE: If someone wants to add a new setting to the app,
 * all that needs to be done in this file is adding
 * the setting name and its default value to the `state` object
 *
 * The respective getter, mutation (setter) and action (updater) will
 * be automatically generated with the following pattern:
 *
 * Setting: example
 * Getter: getExample
 * Mutation: setExample
 * Action: updateExample
 *
 * For more details on this, see the expanded exemplification below
 *
 * If, for whatever reason, the setting needs less or more
 * functionality than what these auto-generated functions can provide,
 * then that setting and its necessary functions must be manually added
 * only AFTER the generic ones have been auto-generated
 * Example: `usingElectron` (doesn't need an action)
 *
 * The same rule applies for standalone getters, mutations and actions
 * Example: `grabUserSettings` (standalone action)
 */
const state = {
  currentTheme: 'lightRed',
  uiScale: 100,
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
  removeVideoMetaFiles: true,
  autoplayVideos: true,
  autoplayPlaylists: true,
  playNextVideo: false,
  enableSubtitles: true,
  forceLocalBackendForLegacy: false,
  proxyVideos: false,
  defaultTheatreMode: false,
  defaultInterval: 5,
  defaultVolume: 1,
  defaultPlayback: 1,
  defaultVideoFormat: 'dash',
  defaultQuality: '720',
  useProxy: false,
  proxyProtocol: 'socks5',
  proxyHostname: '127.0.0.1',
  proxyPort: '9050',
  debugMode: false,
  disableSmoothScrolling: false,
  hideWatchedSubs: false,
  useRssFeeds: false,
  hideVideoViews: false,
  hideVideoLikesAndDislikes: false,
  hideChannelSubscriptions: false,
  hideCommentLikes: false,
  hideRecommendedVideos: false,
  hideTrendingVideos: false,
  hidePopularVideos: false,
  hidePlaylists: false,
  hideLiveChat: false,
  hideActiveSubscriptions: false,
  videoVolumeMouseScroll: false,
  useSponsorBlock: false,
  sponsorBlockUrl: 'https://sponsor.ajay.app',
  sponsorBlockShowSkippedToast: true,
  displayVideoPlayButton: true
}

const getters = {}
const mutations = {}
const actions = {}

/**
 * Build getters, mutations and actions for every setting id
 * e.g.:
 * Setting id: uiScale
 * Getter:
 *   getUiScale: (state) => state.uiScale
 * Mutation:
 *   setUiScale: (state, uiScaleValue) => state.uiScale = uiScaleValue
 * Action:
 *   updateUiScale: ({ commit }, uiScaleValue) => {
 *     await settingsDb.update(
 *       { _id: 'uiScale' },
 *       { _id: 'uiScale', value: uiScaleValue },
 *       { upsert: true },
 *       (err, _) => {
 *         commit('setUiScale', uiScaleValue)
 *       }
 *     )
 */
for (const settingId of Object.keys(state)) {
  const capitalizedSettingId =
    settingId.replace(/^\w/, (c) => c.toUpperCase())

  const getterId = 'get' + capitalizedSettingId
  const mutationId = 'set' + capitalizedSettingId
  const actionId = 'update' + capitalizedSettingId

  getters[getterId] = (state) => state[settingId]
  mutations[mutationId] = (state, value) => { state[settingId] = value }
  actions[actionId] = ({ commit }, value) => {
    settingsDb.update(
      { _id: settingId },
      { _id: settingId, value: value },
      { upsert: true },
      (err, _) => {
        if (!err) {
          commit(mutationId, value)
        }
      }
    )
  }
}

// Custom state
Object.assign(state, {
  // Add `usingElectron` to the state
  usingElectron: usingElectron
})

// Custom getters
Object.assign(getters, {
  // Getter for `usingElectron`
  getUsingElectron: (state) => state.usingElectron
})

// Custom mutations
// Object.assign(mutations, {})

// Custom actions
Object.assign(actions, {
  // Add `grabUserSettings` to actions
  grabUserSettings: ({ dispatch, commit }) => {
    return new Promise((resolve, reject) => {
      settingsDb.find({}, (err, results) => {
        if (!err) {
          console.log(results)
          results.forEach((result) => {
            switch (result._id) {
              case 'invidiousInstance':
                if (result.value === '') {
                  dispatch(
                    'updateInvidiousInstance',
                    'https://invidious.snopyta.org'
                  )
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
              case 'uiScale':
                if (webframe) {
                  webframe.setZoomFactor(parseInt(result.value) / 100)
                }
                commit('setUiScale', result.value)
                break
              case 'disableSmoothScrolling':
                commit('setDisableSmoothScrolling', result.value)
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
              case 'removeVideoMetaFiles':
                commit('setRemoveVideoMetaFiles', result.value)
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
              case 'useProxy':
                commit('setUseProxy', result.value)
                break
              case 'proxyProtocol':
                commit('setProxyProtocol', result.value)
                break
              case 'proxyHostname':
                commit('setProxyHostname', result.value)
                break
              case 'proxyPort':
                commit('setProxyPort', result.value)
                break
              case 'defaultTheatreMode':
                commit('setDefaultTheatreMode', result.value)
                break
              case 'defaultInterval':
                commit('setDefaultInterval', result.value)
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
              case 'hidePlaylists':
                commit('setHidePlaylists', result.value)
                break
              case 'hideLiveChat':
                commit('setHideLiveChat', result.value)
                break
              case 'hideActiveSubscriptions':
                commit('setHideActiveSubscriptions', result.value)
                break
              case 'videoVolumeMouseScroll':
                commit('setVideoVolumeMouseScroll', result.value)
                break
              case 'useSponsorBlock':
                commit('setUseSponsorBlock', result.value)
                break
              case 'sponsorBlockUrl':
                commit('setSponsorBlockUrl', result.value)
                break
              case 'sponsorBlockShowSkippedToast':
                commit('setSponsorBlockShowSkippedToast', result.value)
                break
              case 'displayVideoPlayButton':
                commit('setDisplayVideoPlayButton', result.value)
            }
          })
          resolve()
        }
        reject(err)
      })
    })
  }
})

export default {
  state,
  getters,
  actions,
  mutations
}
