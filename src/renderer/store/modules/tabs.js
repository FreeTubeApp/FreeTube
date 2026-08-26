import router from '../../router/index'

let nextTabId = 1

const state = {
  /**
   * @type {{
   *   id: number,
   *   path: string,
   *   query: object,
   *   title: string,
   *   hasBeenActivated: boolean
   * }[]}
   */
  tabs: [],
  activeTabId: null
}

const getters = {
  getTabs(state) {
    return state.tabs
  },

  getActiveTabId(state) {
    return state.activeTabId
  },

  getActiveTab(state) {
    return state.tabs.find((tab) => tab.id === state.activeTabId) ?? null
  }
}

const actions = {
  /**
   * Seeds the tab strip with a single tab matching whatever route the app
   * happens to be showing on startup (deep link, restored URL, landing page...).
   * @param {{ path: string, query?: object, title?: string }} param1
   */
  seedInitialTab({ commit, state }, { path, query = {}, title = '' }) {
    if (state.tabs.length > 0) {
      return
    }

    const tab = {
      id: nextTabId++,
      path,
      query,
      title,
      hasBeenActivated: true
    }

    commit('ADD_TAB', tab)
    commit('SET_ACTIVE_TAB_ID', tab.id)
  },

  /**
   * Opens a path either as a background tab (doesn't navigate, doesn't play
   * anything until the user switches to it) or as a foreground tab (navigates
   * immediately, e.g. "open in new tab" acting like "open now").
   * @param {{ path: string, query?: object, title?: string, background?: boolean }} param1
   */
  openTab({ commit, dispatch }, { path, query = {}, title = '', background = true }) {
    const tab = {
      id: nextTabId++,
      path,
      query,
      title,
      hasBeenActivated: false
    }

    commit('ADD_TAB', tab)

    if (!background) {
      dispatch('activateTab', tab.id)
    }

    return tab.id
  },

  /**
   * Opens a brand new, empty tab pointed at the user's landing page and
   * switches to it - used by the "+" button, Ctrl+T, and whenever closing
   * a tab leaves none open.
   */
  openNewTab({ dispatch, getters }) {
    dispatch('openTab', { path: '/' + getters.getLandingPage, background: false })
  },

  /**
   * @param {number} tabId
   */
  activateTab({ commit, state }, tabId) {
    const tab = state.tabs.find((t) => t.id === tabId)
    if (!tab) {
      return
    }

    commit('SET_ACTIVE_TAB_ID', tabId)
    commit('UPDATE_TAB_META', { id: tabId, hasBeenActivated: true })

    router.push({ path: tab.path, query: tab.query })
  },

  /**
   * @param {number} tabId
   */
  closeTab({ commit, state, dispatch }, tabId) {
    const closingIndex = state.tabs.findIndex((t) => t.id === tabId)
    if (closingIndex === -1) {
      return
    }

    const wasActive = state.activeTabId === tabId
    commit('REMOVE_TAB', tabId)

    if (!wasActive) {
      // ponytail: closing a background tab never tells its (already-paused,
      // not destroyed) Watch.js/player instance to tear down - it just sits
      // cached in App.vue's KeepAlive until LRU-evicted or the app closes.
      // Harmless today since it's paused, not audible, but if that ever
      // needs to free resources immediately, give tabs an explicit
      // close signal (e.g. a small mitt/EventTarget bus) that the owning
      // Watch.js instance listens for instead of only reacting to router
      // navigation.
      return
    }

    if (state.tabs.length === 0) {
      // Closed the last tab - fall back to a fresh tab on the landing page,
      // same as opening the app for the first time.
      dispatch('openNewTab')
      return
    }

    // Activate the tab that took this one's place in the strip, or the
    // previous one if we closed the last tab in the list.
    const nextIndex = Math.min(closingIndex, state.tabs.length - 1)
    dispatch('activateTab', state.tabs[nextIndex].id)
  },

  /**
   * Keeps the active tab's stored path/query/title in sync with in-tab
   * navigation that didn't go through openTab/activateTab (e.g. clicking a
   * recommended video, a plain search, or a sidebar link with a normal
   * left click). Any field left out is simply not touched - see
   * UPDATE_TAB_META below.
   * @param {{ path?: string, query?: object, title?: string }} param1
   */
  syncActiveTabMeta({ commit, state }, { path, query, title }) {
    if (state.activeTabId === null) {
      return
    }

    commit('UPDATE_TAB_META', { id: state.activeTabId, path, query, title })
  }
}

const mutations = {
  ADD_TAB(state, tab) {
    state.tabs.push(tab)
  },

  REMOVE_TAB(state, tabId) {
    state.tabs = state.tabs.filter((tab) => tab.id !== tabId)
  },

  SET_ACTIVE_TAB_ID(state, tabId) {
    state.activeTabId = tabId
  },

  UPDATE_TAB_META(state, { id, path, query, title, hasBeenActivated }) {
    const tab = state.tabs.find((t) => t.id === id)
    if (!tab) {
      return
    }

    if (path !== undefined) {
      tab.path = path
    }
    if (query !== undefined) {
      tab.query = query
    }
    if (title !== undefined && title !== '') {
      tab.title = title
    }
    if (hasBeenActivated !== undefined) {
      tab.hasBeenActivated = hasBeenActivated
    }
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
