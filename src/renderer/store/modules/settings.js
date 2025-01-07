import i18n, { loadLocale } from '../../i18n/index'
import allLocales from '../../../../static/locales/activeLocales.json'
import { MAIN_PROFILE_ID, IpcChannels, SyncEvents } from '../../../constants'
import { DBSettingHandlers } from '../../../datastores/handlers/index'
import { getSystemLocale, showToast } from '../../helpers/utils'

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
 * You can add a new setting in two different methods.
 *
 * The first method benefits from the auto-generation of
 * a getter, a mutation and a few actions related to the setting.
 * This method should be preferred whenever possible:
 * - `state`
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
 * -> Please consult the `state` and `sideEffectHandlers` sections.
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
 * `sideEffectHandlers`
 * This object contains the side-effect handlers for settings that have SIDE EFFECTS.
 *
 * Each one of these settings must specify a handler,
 *   which should essentially be a callback of type
 *   `(store, value) => void` (the same as you would use for an `action`)
 *   that deals with the side effects for that setting
 *
 * NOTE: Example implementations of such handlers can be found
 * in the `sideEffectHandlers` object in case
 * the explanation isn't clear enough.
 *
 * All functions auto-generated for settings in `state`
 * (if you haven't read the `state` section, do it now),
 * are also auto-generated for settings in `sideEffectHandlers,
 * with a few key differences (exemplified with setting 'example'):
 *
 * - an additional action is auto-generated:
 *   - `triggerExampleSideEffects`
 *       (triggers the `handler` for that setting;
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
const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1)
const defaultGetterId = settingId => 'get' + capitalize(settingId)
const defaultMutationId = settingId => 'set' + capitalize(settingId)
const defaultUpdaterId = settingId => 'update' + capitalize(settingId)
const defaultSideEffectsTriggerId = settingId =>
  'trigger' + capitalize(settingId) + 'SideEffects'
/*****/

const state = {
  autoplayPlaylists: true,
  autoplayVideos: true,
  backendFallback: process.env.SUPPORTS_LOCAL_API,
  backendPreference: !process.env.SUPPORTS_LOCAL_API ? 'invidious' : 'local',
  barColor: false,
  checkForBlogPosts: true,
  checkForUpdates: true,
  baseTheme: 'system',
  mainColor: 'Red',
  secColor: 'Blue',
  defaultAutoplayInterruptionIntervalHours: 3,
  defaultCaptionSettings: '{}',
  defaultInterval: 5,
  defaultPlayback: 1,
  defaultProfile: MAIN_PROFILE_ID,
  defaultQuality: '720',
  defaultSkipInterval: 5,
  defaultTheatreMode: false,
  defaultVideoFormat: 'dash',
  disableSmoothScrolling: false,
  displayVideoPlayButton: false,
  enableSearchSuggestions: true,
  enableSubtitlesByDefault: false,
  enterFullscreenOnDisplayRotate: false,
  externalLinkHandling: '',
  externalPlayer: '',
  externalPlayerExecutable: '',
  externalPlayerIgnoreWarnings: false,
  externalPlayerIgnoreDefaultArgs: false,
  externalPlayerCustomArgs: '[]',
  expandSideBar: false,
  hideActiveSubscriptions: false,
  hideChannelCommunity: false,
  hideChannelHome: false,
  hideChannelPlaylists: false,
  hideChannelReleases: false,
  hideChannelPodcasts: false,
  hideChannelShorts: false,
  hideChannelSubscriptions: false,
  hideCommentLikes: false,
  hideCommentPhotos: false,
  hideComments: false,
  hideFeaturedChannels: false,
  channelsHidden: '[]',
  forbiddenTitles: '[]',
  showAddedChannelsHidden: true,
  showAddedForbiddenTitles: true,
  hideVideoDescription: false,
  hideLiveChat: false,
  hideLiveStreams: false,
  hideHeaderLogo: false,
  hidePlaylists: false,
  hidePopularVideos: false,
  hideRecommendedVideos: false,
  hideSearchBar: false,
  hideSharingActions: false,
  hideSubscriptionsVideos: false,
  hideSubscriptionsShorts: false,
  hideSubscriptionsLive: false,
  hideSubscriptionsCommunity: false,
  hideTrendingVideos: false,
  hideUnsubscribeButton: false,
  hideUpcomingPremieres: false,
  hideVideoLikesAndDislikes: false,
  hideVideoViews: false,
  hideWatchedSubs: false,
  unsubscriptionPopupStatus: false,
  hideLabelsSideBar: false,
  hideChapters: false,
  showDistractionFreeTitles: false,
  landingPage: 'subscriptions',
  listType: 'grid',
  maxVideoPlaybackRate: 3,
  onlyShowLatestFromChannel: false,
  onlyShowLatestFromChannelNumber: 1,
  openDeepLinksInNewWindow: false,
  playNextVideo: false,
  proxyHostname: '127.0.0.1',
  proxyPort: '9050',
  proxyProtocol: 'socks5',
  proxyVideos: !process.env.SUPPORTS_LOCAL_API,
  region: 'US',
  rememberHistory: true,
  rememberSearchHistory: true,
  saveWatchedProgress: true,
  saveVideoHistoryWithLastViewedPlaylist: true,
  showFamilyFriendlyOnly: false,
  sponsorBlockShowSkippedToast: true,
  sponsorBlockUrl: 'https://sponsor.ajay.app',
  sponsorBlockSponsor: {
    color: 'Green',
    skip: 'autoSkip'
  },
  sponsorBlockSelfPromo: {
    color: 'Yellow',
    skip: 'showInSeekBar'
  },
  sponsorBlockInteraction: {
    color: 'Pink',
    skip: 'showInSeekBar'
  },
  sponsorBlockIntro: {
    color: 'Cyan',
    skip: 'doNothing'
  },
  sponsorBlockOutro: {
    color: 'Blue',
    skip: 'doNothing'
  },
  sponsorBlockRecap: {
    color: 'Indigo',
    skip: 'doNothing'
  },
  sponsorBlockMusicOffTopic: {
    color: 'Orange',
    skip: 'doNothing'
  },
  sponsorBlockFiller: {
    color: 'Purple',
    skip: 'doNothing'
  },
  thumbnailPreference: '',
  blurThumbnails: false,
  useProxy: false,
  userPlaylistSortOrder: 'date_added_descending',
  useRssFeeds: false,
  useSponsorBlock: false,
  videoVolumeMouseScroll: false,
  videoPlaybackRateMouseScroll: false,
  videoSkipMouseScroll: false,
  videoPlaybackRateInterval: 0.25,
  downloadAskPath: true,
  downloadFolderPath: '',
  downloadBehavior: 'open',
  enableScreenshot: false,
  screenshotFormat: 'png',
  screenshotQuality: 95,
  screenshotAskPath: !process.env.IS_ELECTRON,
  screenshotFolderPath: '',
  screenshotFilenamePattern: '%Y%M%D-%H%N%S',
  settingsSectionSortEnabled: false,
  fetchSubscriptionsAutomatically: true,
  settingsPassword: '',
  useDeArrowTitles: false,
  useDeArrowThumbnails: false,
  deArrowThumbnailGeneratorUrl: 'https://dearrow-thumb.ajay.app',
  // This makes the `favorites` playlist uses as quick bookmark target
  // If the playlist is removed quick bookmark is disabled
  quickBookmarkTargetPlaylistId: 'favorites',
  generalAutoLoadMorePaginatedItemsEnabled: false,

  // The settings below have side effects
  currentLocale: 'system',
  defaultInvidiousInstance: '',
  defaultVolume: 1,
  uiScale: 100,
}

const sideEffectHandlers = {
  currentLocale: async ({ dispatch }, value) => {
    const fallbackLocale = 'en-US'

    let targetLocale = value
    if (value === 'system') {
      const systemLocaleName = (await getSystemLocale()).replace('_', '-') // ex: en-US
      const systemLocaleSplit = systemLocaleName.split('-') // ex: en
      const targetLocaleOptions = allLocales.filter((locale) => {
        // filter out other languages
        const localeLang = locale.split('-')[0]
        return localeLang.includes(systemLocaleSplit[0])
      }).sort((aLocaleName, bLocaleName) => {
        const aLocale = aLocaleName.split('-') // ex: [en, US]
        const bLocale = bLocaleName.split('-')

        if (aLocaleName === systemLocaleName) { // country & language match, prefer a
          return -1
        } else if (bLocaleName === systemLocaleName) { // country & language match, prefer b
          return 1
        } else if (aLocale.length === 1) { // no country code for a, prefer a
          return -1
        } else if (bLocale.length === 1) { // no country code for b, prefer b
          return 1
        } else { // a & b have different country code from system, sort alphabetically
          return aLocaleName.localeCompare(bLocaleName)
        }
      })

      if (targetLocaleOptions.length > 0) {
        targetLocale = targetLocaleOptions[0]
      } else {
        // Go back to default value if locale is unavailable
        targetLocale = fallbackLocale
        // Translating this string isn't necessary
        // because the user will always see it in the default locale
        // (in this case, English (US))
        showToast(`Locale not found, defaulting to ${fallbackLocale}`)
      }
    }

    const loadPromises = []

    if (targetLocale !== fallbackLocale) {
      // "en-US" is used as a fallback for missing strings in other locales
      loadPromises.push(
        loadLocale(fallbackLocale)
      )
    }

    // "es" is used as a fallback for "es-AR" and "es-MX"
    if (targetLocale === 'es-AR' || targetLocale === 'es-MX') {
      loadPromises.push(
        loadLocale('es')
      )
    }

    // "pt" is used as a fallback for "pt-PT" and "pt-BR"
    if (targetLocale === 'pt-PT' || targetLocale === 'pt-BR') {
      loadPromises.push(
        loadLocale('pt')
      )
    }

    loadPromises.push(
      loadLocale(targetLocale)
    )

    await Promise.allSettled(loadPromises)

    i18n.locale = targetLocale
    await dispatch('getRegionData', targetLocale)
  },

  defaultInvidiousInstance: ({ commit, rootState }, value) => {
    if (value !== '' && rootState.invidious.currentInvidiousInstance !== value) {
      commit('setCurrentInvidiousInstance', value)
    }
  },

  defaultVolume: (_, value) => {
    sessionStorage.setItem('volume', value)
    value === 0 ? sessionStorage.setItem('muted', 'true') : sessionStorage.setItem('muted', 'false')
    sessionStorage.setItem('defaultVolume', value)
  },

  uiScale: (_, value) => {
    if (process.env.IS_ELECTRON) {
      const { webFrame } = require('electron')
      webFrame.setZoomFactor(value / 100)
    }
  }
}

const settingsWithSideEffects = Object.keys(sideEffectHandlers)

const customState = {
}

const customGetters = {
}

const customMutations = {}

const customActions = {
  grabUserSettings: async ({ commit, dispatch, state }) => {
    try {
      const userSettings = await DBSettingHandlers.find()

      const mutationIds = Object.keys(mutations)

      const alreadyTriggeredSideEffects = []

      for (const { _id, value } of userSettings) {
        if (settingsWithSideEffects.includes(_id)) {
          dispatch(defaultSideEffectsTriggerId(_id), value)
          alreadyTriggeredSideEffects.push(_id)
        }

        if (mutationIds.includes(defaultMutationId(_id))) {
          commit(defaultMutationId(_id), value)
        }
      }

      for (const _id of settingsWithSideEffects) {
        if (!alreadyTriggeredSideEffects.includes(_id)) {
          dispatch(defaultSideEffectsTriggerId(_id), state[_id])
        }
      }
    } catch (errMessage) {
      console.error(errMessage)
    }
  },

  // Should be a root action, but we'll tolerate
  setupListenersToSyncWindows: ({ commit, dispatch }) => {
    if (process.env.IS_ELECTRON) {
      const { ipcRenderer } = require('electron')

      ipcRenderer.on(IpcChannels.SYNC_SETTINGS, (_, { event, data }) => {
        switch (event) {
          case SyncEvents.GENERAL.UPSERT:
            if (settingsWithSideEffects.includes(data._id)) {
              dispatch(defaultSideEffectsTriggerId(data._id), data.value)
            }

            commit(defaultMutationId(data._id), data.value)
            break

          default:
            console.error('settings: invalid sync event received')
        }
      })

      ipcRenderer.on(IpcChannels.SYNC_HISTORY, (_, { event, data }) => {
        switch (event) {
          case SyncEvents.GENERAL.UPSERT:
            commit('upsertToHistoryCache', data)
            break

          case SyncEvents.HISTORY.OVERWRITE: {
            const byId = {}
            data.forEach(video => {
              byId[video.videoId] = video
            })

            // It comes pre-sorted, so we don't have to sort it here
            commit('setHistoryCacheSorted', data)
            commit('setHistoryCacheById', byId)
            break
          }

          case SyncEvents.HISTORY.UPDATE_WATCH_PROGRESS:
            commit('updateRecordWatchProgressInHistoryCache', data)
            break

          case SyncEvents.HISTORY.UPDATE_PLAYLIST:
            commit('updateRecordLastViewedPlaylistIdInHistoryCache', data)
            break

          case SyncEvents.GENERAL.DELETE:
            commit('removeFromHistoryCacheById', data)
            break

          case SyncEvents.GENERAL.DELETE_ALL:
            commit('setHistoryCacheSorted', [])
            commit('setHistoryCacheById', {})
            break

          default:
            console.error('history: invalid sync event received')
        }
      })

      ipcRenderer.on(IpcChannels.SYNC_SEARCH_HISTORY, (_, { event, data }) => {
        switch (event) {
          case SyncEvents.GENERAL.UPSERT:
            commit('upsertSearchHistoryEntryToList', data)
            break

          case SyncEvents.GENERAL.DELETE:
            commit('removeSearchHistoryEntryFromList', data)
            break

          case SyncEvents.GENERAL.DELETE_ALL:
            commit('setSearchHistoryEntries', [])
            break

          default:
            console.error('search history: invalid sync event received')
        }
      })

      ipcRenderer.on(IpcChannels.SYNC_PROFILES, (_, { event, data }) => {
        switch (event) {
          case SyncEvents.GENERAL.CREATE:
            commit('addProfileToList', data)
            break

          case SyncEvents.GENERAL.UPSERT:
            commit('upsertProfileToList', data)
            break

          case SyncEvents.PROFILES.ADD_CHANNEL:
            commit('addChannelToProfiles', data)
            break

          case SyncEvents.PROFILES.REMOVE_CHANNEL:
            commit('removeChannelFromProfiles', data)
            break

          case SyncEvents.GENERAL.DELETE:
            commit('removeProfileFromList', data)
            break

          default:
            console.error('profiles: invalid sync event received')
        }
      })

      ipcRenderer.on(IpcChannels.SYNC_PLAYLISTS, (_, { event, data }) => {
        switch (event) {
          case SyncEvents.GENERAL.CREATE:
            commit('addPlaylists', data)
            break

          case SyncEvents.GENERAL.DELETE:
            commit('removePlaylist', data)
            break

          case SyncEvents.GENERAL.UPSERT:
            commit('upsertPlaylistToList', data)
            break

          case SyncEvents.PLAYLISTS.UPSERT_VIDEO:
            commit('addVideo', data)
            break

          case SyncEvents.PLAYLISTS.UPSERT_VIDEOS:
            commit('addVideos', data)
            break

          case SyncEvents.PLAYLISTS.DELETE_VIDEO:
            commit('removeVideo', data)
            break

          default:
            console.error('playlists: invalid sync event received')
        }
      })

      ipcRenderer.on(IpcChannels.SYNC_SUBSCRIPTION_CACHE, (_, { event, data }) => {
        switch (event) {
          case SyncEvents.SUBSCRIPTION_CACHE.UPDATE_VIDEOS_BY_CHANNEL:
            commit('updateVideoCacheByChannel', data)
            break

          case SyncEvents.SUBSCRIPTION_CACHE.UPDATE_LIVE_STREAMS_BY_CHANNEL:
            commit('updateLiveCacheByChannel', data)
            break

          case SyncEvents.SUBSCRIPTION_CACHE.UPDATE_SHORTS_BY_CHANNEL:
            commit('updateShortsCacheByChannel', data)
            break

          case SyncEvents.SUBSCRIPTION_CACHE.UPDATE_SHORTS_WITH_CHANNEL_PAGE_SHORTS_BY_CHANNEL:
            commit('updateShortsCacheWithChannelPageShorts', data)
            break

          case SyncEvents.SUBSCRIPTION_CACHE.UPDATE_COMMUNITY_POSTS_BY_CHANNEL:
            commit('updatePostsCacheByChannel', data)
            break

          case SyncEvents.GENERAL.DELETE_MULTIPLE:
            commit('clearCachesForManyChannels', data)
            break

          case SyncEvents.GENERAL.DELETE_ALL:
            commit('clearCaches', data)
            break

          default:
            console.error('subscription-cache: invalid sync event received')
        }
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

// Build default getters, mutations and actions for every setting id
for (const settingId of Object.keys(state)) {
  const getterId = defaultGetterId(settingId)
  const mutationId = defaultMutationId(settingId)
  const updaterId = defaultUpdaterId(settingId)

  getters[getterId] = (state) => state[settingId]
  mutations[mutationId] = (state, value) => { state[settingId] = value }

  if (settingsWithSideEffects.includes(settingId)) {
    const triggerId = defaultSideEffectsTriggerId(settingId)

    // If setting has side effects, generate action to handle them
    actions[triggerId] = sideEffectHandlers[settingId]

    actions[updaterId] = async ({ commit, dispatch }, value) => {
      try {
        await DBSettingHandlers.upsert(settingId, value)

        dispatch(triggerId, value)

        commit(mutationId, value)
      } catch (errMessage) {
        console.error(errMessage)
      }
    }
  } else {
    actions[updaterId] = async ({ commit }, value) => {
      try {
        await DBSettingHandlers.upsert(settingId, value)

        commit(mutationId, value)
      } catch (errMessage) {
        console.error(errMessage)
      }
    }
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
