import { settingsDb } from '../datastores'

/*
 * Due to the complexity of the settings module in FreeTube, a more
 * in-depth explanation for adding new settings is required.
 *
 * The explanation will be written with the assumption that
 * the reader knows how Vuex works.
 *
 * And no, there's no need to read the entire wall of text.
 * We'll direct you where you need to go as we walk you through it.
 * Additionally, the text actually looks bigger than it truly is.
 * Each line has, at most, 72 characters.
 *
 ****
 * Introduction
 *
 * You can add a new setting in three different methods.
 *
 * The first two methods benefit from the auto-generation of
 * a getter, a mutation and a few actions related to the setting.
 * Those two methods should be preferred whenever possible:
 * - `state`
 * - `stateWithSideEffects`
 *
 * The last one DOES NOT feature any kind of auto-generation and should
 * only be used in scenarios that don't fall under the other 2 options:
 * - `customState`
 *
 ****
 * ASIDE:
 * The aforementioned "side effects" cover a large area
 * of interactions with other modules
 * A good example would be a setting that utilizes the Electron API
 * when its value changes.
 *
 ****
 * First and foremost, you have to understand what type of setting
 * you intend to add to the app.
 *
 * You'll have to select one of these three scenarios:
 *
 * 1) You just want to add a simple setting that does not actively
 *    interact with the Electron API, `localStorage` or
 *    other parts outside of the settings module.
 * -> Please consult the `state` section.
 *
 * 2) You want to add a more complex setting that interacts
 *    with other parts of the app and tech stack.
 * -> Please consult the `state` and `stateWithSideEffects` sections.
 *
 * 3) You want to add a completely custom state based setting
 *    that does not work like the usual settings.
 * -> Please consult the `state` and `customState` sections.
 *
 ****
 * `state`
 * This object contains settings that have NO SIDE EFFECTS.
 *
 * A getter, mutation and an action function is auto-generated
 * for every setting present in the `state` object.
 * They have the following format (exemplified with setting 'example'):
 *
 * Getter: `getExample` (gets the value from current state)
 * Mutation:
 *   `setExample`
 *     (takes a value
 *      and uses it to update the current state)
 * Action:
 *   `updateExample`
 *     (takes a value,
 *      saves it to the database
 *      and calls `setExample` with it)
 *
 ***
 * `stateWithSideEffects`
 * This object contains settings that have SIDE EFFECTS.
 *
 * Each one of these settings must specify an object
 * with the following properties:
 * - `defaultValue`
 *      (which is the value you would put down if
 *       you were to add the setting to the regular `state` object)
 *
 * - `sideEffectsHandler`
 *      (which should essentially be a callback of type
 *         `(store, value) => void`
 *       that deals with the side effects for that setting)
 *
 * NOTE: Example implementations of such settings can be found
 * in the `stateWithSideEffects` object in case
 * the explanation isn't clear enough.
 *
 * All functions auto-generated for settings in `state`
 * (if you haven't read the `state` section, do it now),
 * are also auto-generated for settings in `stateWithSideEffects`,
 * with a few key differences (exemplified with setting 'example'):
 *
 * - an additional action is auto-generated:
 *   - `triggerExampleSideEffects`
 *       (triggers the `sideEffectsHandler` for that setting;
 *        you'll most likely never call this directly)
 *
 * - the behavior of `updateExample` changes a bit:
 *   - `updateExample`
 *       (saves value to the database,
 *        calls `triggerExampleSideEffects` and calls `setExample`)
 *
 ***
 * `customState`
 * This object contains settings that
 * don't linearly fall under the other two options.
 *
 * No auto-generation of any kind is performed
 * when a setting is added to `customState`
 *
 * You must manually add any getters, mutations and actions to
 * `customGetters`, `customMutations` and `customActions` respectively
 * that you find appropriate for that setting.
 *
 * NOTE:
 * When adding a setting to the `customState`,
 * additional consultation with the FreeTube team is preferred
 * to evaluate if it is truly necessary
 * and to ensure that the implementation works as intended.
 *
 * A good example of a setting of this type would be `usingElectron`.
 * This setting doesn't need to be persisted in the database
 * and it doesn't change over time.
 * Therefore, it needs a getter (which we add to `customGetters`), but
 * has no need for a mutation or any sort of action.
 *
 ****
 * ENDING NOTES
 *
 * Only two more things that need mentioning.
 *
 * 1) It's perfectly fine to add extra functionality
 *    to the `customGetters`, `customMutations` and `customActions`,
 *    whether it's related to a setting or just serving as
 *    standalone functionality for the module
 *    (e.g. `grabUserSettings` (standalone action))
 *
 * 2) It's also possible to OVERRIDE auto-generated functionality by
 *    adding functions with the same identifier to
 *    the respective `custom__` object,
 *    but you must have an acceptable reason for doing so.
 ****
 */

// HELPERS
const capitalize = str => str.replace(/^\w/, c => c.toUpperCase())
const defaultGetterId = settingId => 'get' + capitalize(settingId)
const defaultMutationId = settingId => 'set' + capitalize(settingId)
const defaultUpdaterId = settingId => 'update' + capitalize(settingId)
const defaultSideEffectsTriggerId = settingId =>
  'trigger' + capitalize(settingId) + 'SideEffects'
/*****/

const state = {
  autoplayPlaylists: true,
  autoplayVideos: true,
  backendFallback: true,
  backendPreference: 'local',
  barColor: false,
  checkForBlogPosts: true,
  checkForUpdates: true,
  // currentTheme: 'lightRed',
  defaultCaptionSettings: '{}',
  defaultInterval: 5,
  defaultPlayback: 1,
  defaultProfile: 'allChannels',
  defaultQuality: '720',
  defaultTheatreMode: false,
  defaultVideoFormat: 'dash',
  disableSmoothScrolling: false,
  displayVideoPlayButton: true,
  enableSearchSuggestions: true,
  enableSubtitles: true,
  externalPlayer: '',
  externalPlayerExecutable: '',
  externalPlayerIgnoreWarnings: false,
  externalPlayerCustomArgs: '',
  forceLocalBackendForLegacy: false,
  hideActiveSubscriptions: false,
  hideChannelSubscriptions: false,
  hideCommentLikes: false,
  hideLiveChat: false,
  hidePlaylists: false,
  hidePopularVideos: false,
  hideRecommendedVideos: false,
  hideTrendingVideos: false,
  hideVideoLikesAndDislikes: false,
  hideVideoViews: false,
  hideWatchedSubs: false,
  invidiousInstance: 'https://invidious.snopyta.org',
  landingPage: 'subscriptions',
  listType: 'grid',
  playNextVideo: false,
  proxyHostname: '127.0.0.1',
  proxyPort: '9050',
  proxyProtocol: 'socks5',
  proxyVideos: false,
  region: 'US',
  rememberHistory: true,
  removeVideoMetaFiles: true,
  saveWatchedProgress: true,
  sponsorBlockShowSkippedToast: true,
  sponsorBlockUrl: 'https://sponsor.ajay.app',
  thumbnailPreference: '',
  useProxy: false,
  useRssFeeds: false,
  useSponsorBlock: false,
  videoVolumeMouseScroll: false
}

const stateWithSideEffects = {
  defaultVolume: {
    defaultValue: 1,
    sideEffectsHandler: (_, value) => {
      sessionStorage.setItem('volume', value)
    }
  },

  uiScale: {
    defaultValue: 100,
    sideEffectsHandler: ({ state: { usingElectron } }, value) => {
      if (usingElectron) {
        const { webFrame } = require('electron')
        webFrame.setZoomFactor(value / 100)
      }
    }
  }
}

const customState = {
  usingElectron: (window?.process?.type === 'renderer')
}

const customGetters = {
  getUsingElectron: (state) => state.usingElectron
}

const customMutations = {}

/**********/
/*
 * DO NOT TOUCH THIS SECTION
 * If you wanna add to custom data or logic to the module,
 * do so in the aproppriate `custom_` variable
 *
 * Some of the custom actions below use these properties, so I'll be
 * adding them here instead of further down for clarity's sake
 */
Object.assign(customState, {
  settingsWithSideEffects: Object.keys(stateWithSideEffects)
})

Object.assign(customGetters, {
  settingHasSideEffects: (state) => {
    return (id) => state.settingsWithSideEffects.includes(id)
  }
})
/**********/

const customActions = {
  grabUserSettings: ({ commit, dispatch, getters }) => {
    return new Promise((resolve, reject) => {
      settingsDb.find(
        { _id: { $ne: 'bounds' } },
        (err, userSettings) => {
          if (err) {
            reject(err)
            return
          }

          for (const setting of userSettings) {
            const { _id, value } = setting
            if (getters.settingHasSideEffects(_id)) {
              dispatch(defaultSideEffectsTriggerId(_id), value)
            }

            commit(defaultMutationId(_id), value)
          }

          resolve()
        }
      )
    })
  },

  setUpListenerToSyncSettings: ({ commit, dispatch, getters }) => {
    const {
      getUsingElectron: usingElectron,
      settingHasSideEffects
    } = getters

    if (usingElectron) {
      const { ipcRenderer } = require('electron')
      ipcRenderer.on('syncSetting', (_, setting) => {
        const { _id, value } = setting
        if (settingHasSideEffects(_id)) {
          dispatch(defaultSideEffectsTriggerId(_id), value)
        }

        commit(defaultMutationId(_id), value)
      })
    }
  }
}

/**********************/
/*
 * DO NOT TOUCH ANYTHING BELOW
 * (unless you plan to change the architecture of this module)
 */

const getters = {}
const mutations = {}
const actions = {}

// Add settings that contain side effects to the state
Object.assign(
  state,
  Object.fromEntries(
    Object.keys(stateWithSideEffects).map(
      (key) => [
        key,
        stateWithSideEffects[key].defaultValue
      ]
    )
  )
)

// Build default getters, mutations and actions for every setting id
for (const settingId of Object.keys(state)) {
  const getterId = defaultGetterId(settingId)
  const mutationId = defaultMutationId(settingId)
  const updaterId = defaultUpdaterId(settingId)
  const triggerId = defaultSideEffectsTriggerId(settingId)

  getters[getterId] = (state) => state[settingId]
  mutations[mutationId] = (state, value) => { state[settingId] = value }

  // If setting has side effects, generate action to handle them
  if (Object.keys(stateWithSideEffects).includes(settingId)) {
    actions[triggerId] = stateWithSideEffects[settingId].sideEffectsHandler
  }

  actions[updaterId] = ({ commit, dispatch, getters }, value) => {
    settingsDb.update(
      { _id: settingId },
      { _id: settingId, value: value },
      { upsert: true },
      (err, _) => {
        if (err) return

        const {
          getUsingElectron: usingElectron,
          settingHasSideEffects
        } = getters

        if (settingHasSideEffects(settingId)) {
          dispatch(triggerId, value)
        }
        commit(mutationId, value)

        if (usingElectron) {
          const { ipcRenderer } = require('electron')

          // Propagate settings to all other existing windows
          ipcRenderer.send('syncSetting', {
            _id: settingId, value: value
          })
        }
      }
    )
  }
}

// Add all custom data/logic to their respective objects
Object.assign(state, customState)
Object.assign(getters, customGetters)
Object.assign(mutations, customMutations)
Object.assign(actions, customActions)

export default {
  state,
  getters,
  actions,
  mutations
}
