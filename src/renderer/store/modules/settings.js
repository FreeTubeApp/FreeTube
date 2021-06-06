import Datastore from 'nedb'

let dbLocation

const usingElectron = window?.process?.type === 'renderer'

if (usingElectron) {
  // Electron is being used
  /* let dbLocation = localStorage.getItem('dbLocation')

  if (dbLocation === null) {
    const electron = require('electron')
    dbLocation = electron.remote.app.getPath('userData')
  } */

  const { ipcRenderer } = require('electron')
  dbLocation = ipcRenderer.sendSync('getUserDataPathSync')
  dbLocation = dbLocation + '/settings.db'
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
  grabUserSettings: ({ commit }) => {
    return new Promise((resolve, reject) => {
      settingsDb.find(
        { _id: { $ne: 'bounds' } },
        (err, userSettings) => {
          if (err) {
            reject(err)
            return
          }

          const specialSettings = new Map([
            ['uiScale',
              (value) => {
                if (usingElectron) {
                  const { webFrame } = require('electron')
                  webFrame.setZoomFactor(parseInt(value) / 100)
                }
                commit('setUiScale', value)
              }
            ],
            ['defaultVolume',
              (value) => {
                sessionStorage.setItem('volume', value)
                commit('setDefaultVolume', value)
              }
            ]
          ])

          for (const setting of userSettings) {
            if (specialSettings.has(setting._id)) {
              const specialSettingHandler = specialSettings.get(setting._id)
              specialSettingHandler(setting.value)
              continue
            }

            const capitalizedSettingId =
              setting._id.replace(/^\w/, (c) => c.toUpperCase())

            commit('set' + capitalizedSettingId, setting.value)
          }

          resolve()
        }
      )
    })
  }
})

export default {
  state,
  getters,
  actions,
  mutations
}
