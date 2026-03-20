<template>
  <nav
    class="topNav"
    :class="{ topNavBarColor: barColor }"
  >
    <div class="side">
      <button
        class="menuButton navButton"
        :aria-label="expandCollapseSideBarLabel"
        :title="expandCollapseSideBarLabel"
        @click="toggleSideNav"
      >
        <FontAwesomeIcon
          class="navIcon"
          :icon="['fas', 'bars']"
        />
      </button>
      <FtIconButton
        class="navIconButton"
        :disabled="isArrowBackwardDisabled"
        :class="{ arrowDisabled: isArrowBackwardDisabled }"
        :icon="['fas', 'arrow-left']"
        :theme="null"
        :size="20"
        :use-shadow="false"
        dropdown-position-x="right"
        :dropdown-options="navigationHistoryDropdownOptions"
        open-on-right-or-long-click
        :title="backwardText"
        @click="historyBack"
      />
      <FtIconButton
        class="navIconButton"
        :disabled="isArrowForwardDisabled"
        :class="{ arrowDisabled: isArrowForwardDisabled }"
        :icon="['fas', 'arrow-right']"
        :theme="null"
        :size="20"
        :use-shadow="false"
        dropdown-position-x="right"
        :dropdown-options="navigationHistoryDropdownOptions"
        open-on-right-or-long-click
        :title="forwardText"
        @click="historyForward"
      />
      <button
        v-if="!hideSearchBar"
        class="navSearchButton navButton"
        @click="toggleSearchContainer"
      >
        <FontAwesomeIcon
          class="navIcon"
          :icon="['fas', 'search']"
        />
      </button>
      <button
        class="navNewWindowButton navButton"
        :aria-label="t('Open New Window')"
        :title="newWindowText"
        @click="createNewWindow"
      >
        <FontAwesomeIcon
          class="navIcon"
          :icon="['fas', 'clone']"
        />
      </button>
      <RouterLink
        v-if="!hideHeaderLogo"
        class="logo"
        dir="ltr"
        :title="headerLogoTitle"
        :to="landingPage"
      >
        <div
          class="logoIcon"
        />
        <div
          class="logoText"
        />
      </RouterLink>
    </div>
    <div class="middle">
      <div
        v-if="!hideSearchBar"
        v-show="showSearchContainer"
        ref="searchContainer"
        class="searchContainer"
      >
        <FtInput
          ref="searchInput"
          :placeholder="t('Search / Go to URL')"
          class="searchInput"
          is-search
          :data-list="activeDataList"
          :data-list-properties="activeDataListProperties"
          show-clear-text-button
          show-data-when-empty
          @input="getSearchSuggestionsDebounce"
          @click="goToSearch"
          @clear="clearLastSuggestionQuery"
          @remove="removeSearchHistoryEntryInDbAndCache"
        />
        <button
          class="navFilterButton navButton"
          :class="{ filterChanged: searchFilterValueChanged }"
          :aria-label="t('Search Filters.Search Filters')"
          :title="t('Search Filters.Search Filters')"
          @click="showSearchFilters"
        >
          <FontAwesomeIcon
            class="navIcon"
            :icon="['fas', 'filter']"
          />
        </button>
      </div>
    </div>
    <FtProfileSelector class="side profiles" />
  </nav>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'
import { useRoute, useRouter } from 'vue-router'

import FtInput from '../FtInput/FtInput.vue'
import FtProfileSelector from '../FtProfileSelector/FtProfileSelector.vue'
import FtIconButton from '../FtIconButton/FtIconButton.vue'

import store from '../../store/index'

import { KeyboardShortcuts, MOBILE_WIDTH_THRESHOLD, SEARCH_RESULTS_DISPLAY_LIMIT } from '../../../constants'
import { debounce, localizeAndAddKeyboardShortcutToActionTitle, openInternalPath } from '../../helpers/utils'
import { translateWindowTitle } from '../../helpers/strings'
import { clearLocalSearchSuggestionsSession, getLocalSearchSuggestions } from '../../helpers/api/local'
import { getInvidiousSearchSuggestions } from '../../helpers/api/invidious'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const showSearchContainer = ref(true)
/** @type {import('vue').ShallowRef<string[]>} */
const navigationHistoryDropdownOptions = shallowRef([])
/** @type {import('vue').ShallowRef<string[]>} */
const searchSuggestionsDataList = shallowRef([])
const lastSuggestionQuery = ref('')

/** @type {import('vue').ComputedRef<boolean>} */
const hideSearchBar = computed(() => store.getters.getHideSearchBar)
/** @type {import('vue').ComputedRef<boolean>} */
const hideHeaderLogo = computed(() => store.getters.getHideHeaderLogo)
/** @type {import('vue').ComputedRef<boolean>} */
const enableSearchSuggestions = computed(() => store.getters.getEnableSearchSuggestions)
/** @type {import('vue').ComputedRef<string>} */
const barColor = computed(() => store.getters.getBarColor)

const expandCollapseSideBarLabel = computed(() => {
  return store.getters.getIsSideNavOpen ? t('Compact side navigation') : t('Expand side navigation')
})

const landingPage = computed(() => '/' + store.getters.getLandingPage)

const headerLogoTitle = computed(() => {
  return t('Go to page', {
    page: translateWindowTitle(
      router.getRoutes()
        .find((route) => route.path === landingPage.value)
        .meta.title)
  })
})

const navigationHistoryAddendum = computed(() => {
  return navigationHistoryDropdownOptions.value.length === 0
    ? ''
    : `\n${t('Right-click or hold to see history')}`
})

const backwardText = computed(() => {
  const shortcuts = process.platform === 'darwin'
    ? [
        KeyboardShortcuts.APP.GENERAL.HISTORY_BACKWARD,
        KeyboardShortcuts.APP.GENERAL.HISTORY_BACKWARD_ALT_MAC
      ]
    : KeyboardShortcuts.APP.GENERAL.HISTORY_BACKWARD

  return localizeAndAddKeyboardShortcutToActionTitle(
    t('Back'),
    shortcuts
  ) + navigationHistoryAddendum.value
})

const forwardText = computed(() => {
  const shortcuts = process.platform === 'darwin'
    ? [
        KeyboardShortcuts.APP.GENERAL.HISTORY_FORWARD,
        KeyboardShortcuts.APP.GENERAL.HISTORY_FORWARD_ALT_MAC
      ]
    : KeyboardShortcuts.APP.GENERAL.HISTORY_FORWARD

  return localizeAndAddKeyboardShortcutToActionTitle(
    t('Forward'),
    shortcuts
  ) + navigationHistoryAddendum.value
})

/**
 * @param {number} offset
 */
function goToOffset(offset) {
  // no point navigating to the current route
  if (offset !== 0) {
    router.go(offset)
  }
}

/**
 * @param {number} [offset]
 */
function historyBack(offset) {
  if (offset != null) {
    goToOffset(offset)
  } else {
    router.back()
  }
}

/**
 * @param {number} [offset]
 */
function historyForward(offset) {
  if (offset != null) {
    goToOffset(offset)
  } else {
    router.forward()
  }
}

const newWindowText = computed(() => {
  return localizeAndAddKeyboardShortcutToActionTitle(
    t('Open New Window'),
    KeyboardShortcuts.APP.GENERAL.NEW_WINDOW
  )
})

function createNewWindow() {
  const url = new URL(window.location.href)
  url.hash = landingPage.value

  window.open(url.toString(), '_blank', 'noreferrer')
}

const usingOnlySearchHistoryResults = computed(() => lastSuggestionQuery.value.length === 0)

/** @type {import('vue').ComputedRef<string[]>} */
const latestMatchingSearchHistoryNames = computed(() => {
  return store.getters.getLatestMatchingSearchHistoryNames(lastSuggestionQuery.value)
})

/** @type {import('vue').ComputedRef<string[]>} */
const latestSearchHistoryNames = computed(() => store.getters.getLatestSearchHistoryNames)

const activeDataList = computed(() => {
  // show latest search history when the search bar is empty
  if (usingOnlySearchHistoryResults.value) {
    return latestSearchHistoryNames.value
  }

  const searchResults = [...latestMatchingSearchHistoryNames.value]

  if (enableSearchSuggestions.value) {
    for (const searchSuggestion of searchSuggestionsDataList.value) {
      // prevent duplicate results between search history entries and YT search suggestions
      if (latestMatchingSearchHistoryNames.value.includes(searchSuggestion)) {
        continue
      }

      searchResults.push(searchSuggestion)

      if (searchResults.length === SEARCH_RESULTS_DISPLAY_LIMIT) {
        break
      }
    }
  }

  return searchResults
})

const activeDataListProperties = computed(() => {
  const searchHistoryEntriesCount = usingOnlySearchHistoryResults.value
    ? latestSearchHistoryNames.value.length
    : latestMatchingSearchHistoryNames.value.length

  const properties = []

  for (let i = 0; i < activeDataList.value.length; i++) {
    properties.push(i < searchHistoryEntriesCount
      ? { isRemoveable: true, iconName: 'clock-rotate-left' }
      : { isRemoveable: false, iconName: 'magnifying-glass' }
    )
  }

  return properties
})

const isArrowBackwardDisabled = ref(true)
const isArrowForwardDisabled = ref(true)

if (process.env.IS_ELECTRON || 'navigation' in window) {
  watch(route, () => {
    setNavigationHistoryDropdownOptions()

    isArrowForwardDisabled.value = !window.navigation.canGoForward
    isArrowBackwardDisabled.value = !window.navigation.canGoBack
  }, { deep: true })
} else {
  // If the Navigation API isn't supported (Firefox and Safari)
  // keep the back and forwards buttons always enabled
  isArrowBackwardDisabled.value = false
  isArrowForwardDisabled.value = false
}

let navigationHistoryDropdownActiveEntry = null
let isLoadingNavigationHistory = false
let pendingNavigationHistoryLabel = null

async function setNavigationHistoryDropdownOptions() {
  if (process.env.IS_ELECTRON) {
    isLoadingNavigationHistory = true
    const dropdownOptions = await window.ftElectron.getNavigationHistory()

    const activeEntry = dropdownOptions.find(option => option.active)

    if (pendingNavigationHistoryLabel) {
      activeEntry.label = pendingNavigationHistoryLabel
    }

    navigationHistoryDropdownOptions.value = dropdownOptions
    navigationHistoryDropdownActiveEntry = activeEntry
    isLoadingNavigationHistory = false
  }
}

/** @type {import('vue').ComputedRef<string>} */
const appTitle = computed(() => store.getters.getAppTitle)

watch(appTitle, (value) => {
  nextTick(() => {
    if (isLoadingNavigationHistory) {
      pendingNavigationHistoryLabel = value
    } else if (navigationHistoryDropdownActiveEntry) {
      navigationHistoryDropdownActiveEntry.label = value
    }
  })
})

function toggleSideNav() {
  store.commit('toggleSideNav')
}

/** @type {import('vue').ComputedRef<boolean>} */
const searchFilterValueChanged = computed(() => store.getters.getSearchFilterValueChanged)

function showSearchFilters() {
  store.dispatch('showSearchFilters')
}

const searchContainer = useTemplateRef('searchContainer')
const searchInput = useTemplateRef('searchInput')

/** @type {import('vue').ComputedRef<any>} */
const searchSettings = computed(() => store.getters.getSearchSettings)

/**
 * @param {string} queryText
 * @param {object} options
 * @param {MouseEvent} options.event
 */
function goToSearch(queryText, { event }) {
  const doCreateNewWindow = event && event.shiftKey

  if (window.innerWidth <= MOBILE_WIDTH_THRESHOLD) {
    searchContainer.value.blur()
    showSearchContainer.value = false
  } else {
    searchInput.value.blur()
  }

  clearLocalSearchSuggestionsSession()

  store.dispatch('getYoutubeUrlInfo', queryText).then((result) => {
    switch (result.urlType) {
      case 'video': {
        const { videoId, timestamp, playlistId } = result

        const query = {}
        if (timestamp) {
          query.timestamp = timestamp
        }
        if (playlistId && playlistId.length > 0) {
          query.playlistId = playlistId
        }

        openInternalPath({
          path: `/watch/${videoId}`,
          query,
          doCreateNewWindow,
          searchQueryText: queryText,
        })
        break
      }

      case 'playlist': {
        const { playlistId, query } = result

        openInternalPath({
          path: `/playlist/${playlistId}`,
          query,
          doCreateNewWindow,
          searchQueryText: queryText,
        })
        break
      }

      case 'search': {
        const { searchQuery, query } = result

        openInternalPath({
          path: `/search/${encodeURIComponent(searchQuery)}`,
          query,
          doCreateNewWindow,
          searchQueryText: searchQuery,
        })
        break
      }

      case 'hashtag': {
        const { hashtag } = result
        openInternalPath({
          path: `/hashtag/${encodeURIComponent(hashtag)}`,
          doCreateNewWindow,
          searchQueryText: `#${hashtag}`,
        })

        break
      }

      case 'post': {
        const { postId, query } = result

        openInternalPath({
          path: `/post/${postId}`,
          query,
          doCreateNewWindow,
          searchQueryText: queryText,
        })
        break
      }

      case 'channel': {
        const { channelId, subPath, url } = result

        openInternalPath({
          path: `/channel/${channelId}/${subPath}`,
          doCreateNewWindow,
          query: {
            url,
          },
          searchQueryText: queryText,
        })
        break
      }

      case 'trending':
      case 'subscriptions':
      case 'history':
      case 'userplaylists':
        openInternalPath({
          path: `/${result.urlType}`,
          doCreateNewWindow,
          searchQueryText: queryText
        })
        break

      case 'invalid_url':
      default: {
        openInternalPath({
          path: `/search/${encodeURIComponent(queryText)}`,
          query: {
            sortBy: searchSettings.value.sortBy,
            time: searchSettings.value.time,
            type: searchSettings.value.type,
            duration: searchSettings.value.duration,
            // Array proxy cannot be cloned during IPC call
            features: [...searchSettings.value.features],
          },
          doCreateNewWindow,
          searchQueryText: queryText,
        })
      }
    }

    if (doCreateNewWindow) {
      // Query text copied to new window = can be removed from current window
      updateSearchInputText('')
    }
  })
}

function clearLastSuggestionQuery() {
  lastSuggestionQuery.value = ''
}

/**
 * @param {string} text
 */
function updateSearchInputText(text) {
  searchInput.value?.setText(text)
}

/**
 * @param {string} query
 */
function getSearchSuggestionsDebounce(query) {
  if (query === lastSuggestionQuery.value) {
    return
  }

  lastSuggestionQuery.value = query

  if (enableSearchSuggestions.value) {
    debounceSearchResults(query.trim())
  }
}

/** @type {import('vue').ComputedRef<'local' | 'invidious'>} */
const backendPreference = computed(() => store.getters.getBackendPreference)
/** @type {import('vue').ComputedRef<boolean>} */
const backendFallback = computed(() => store.getters.getBackendFallback)

const debounceSearchResults = debounce(/** @param {string} query */(query) => {
  if (!process.env.SUPPORTS_LOCAL_API || backendPreference.value === 'invidious') {
    getSearchSuggestionsInvidious(query)
  } else {
    getSearchSuggestionsLocal(query)
  }
}, 200)

/**
 * @param {string} query
 */
async function getSearchSuggestionsLocal(query) {
  searchSuggestionsDataList.value = query.length > 0
    ? await getLocalSearchSuggestions(query)
    : []
}

async function getSearchSuggestionsInvidious(query) {
  if (query === '') {
    searchSuggestionsDataList.value = []
    return
  }

  try {
    searchSuggestionsDataList.value = (await getInvidiousSearchSuggestions(query)).suggestions
  } catch (err) {
    console.error(err)

    if (process.env.SUPPORTS_LOCAL_API && backendFallback.value) {
      console.error(
        'Error gettings search suggestions.  Falling back to Local API'
      )
      getSearchSuggestionsLocal(query)
    }
  }
}

/**
 * @param {string} query
 */
function removeSearchHistoryEntryInDbAndCache(query) {
  store.dispatch('removeSearchHistoryEntry', query)
  store.commit('removeFromSessionSearchHistory', query)
}

function toggleSearchContainer() {
  showSearchContainer.value = !showSearchContainer.value
}

/**
 * @param {KeyboardEvent} event
 */
function handleKeyboardShortcuts(event) {
  const ctrlOrCommandPressed = (process.platform !== 'darwin' && event.ctrlKey) ||
    (process.platform === 'darwin' && event.metaKey)

  if (
    !hideSearchBar.value &&
    (
      (ctrlOrCommandPressed && (event.key === 'L' || event.key === 'l')) ||
      (event.altKey && (event.key === 'D' || event.key === 'd' || (process.platform === 'darwin' && event.key === '∂')))
    )
  ) {
    event.preventDefault()

    // In order to prevent Klipper's "Synchronize contents of the clipboard
    // and the selection" feature from being triggered when running
    // Chromium on KDE Plasma, it seems both focus() focus and
    // select() have to be called asynchronously (see issue #2019).
    setTimeout(() => {
      searchInput.value?.focus()
      searchInput.value?.select()
    }, 0)
  }
}

let previousWindowWidth

function handleWindowResize() {
  // Don't change the status of showSearchContainer if only the height of the window changes
  // Opening the virtual keyboard can trigger this resize event, but it won't change the width
  if (previousWindowWidth !== window.innerWidth) {
    showSearchContainer.value = window.innerWidth > MOBILE_WIDTH_THRESHOLD
    previousWindowWidth = window.innerWidth
  }
}

onMounted(() => {
  previousWindowWidth = window.innerWidth
  if (window.innerWidth <= MOBILE_WIDTH_THRESHOLD) {
    showSearchContainer.value = false
  }

  // Store is not up-to-date when the component mounts, so we use timeout.
  setTimeout(() => {
    if (store.getters.getExpandSideBar) {
      toggleSideNav()
    }
  }, 0)

  window.addEventListener('resize', handleWindowResize)

  if (process.env.IS_ELECTRON) {
    window.addEventListener('keydown', handleKeyboardShortcuts)

    window.ftElectron.handleUpdateSearchInputText((searchQueryText) => {
      if (searchQueryText) {
        updateSearchInputText(searchQueryText)
      }
    })
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleWindowResize)

  if (process.env.IS_ELECTRON) {
    window.removeEventListener('keydown', handleKeyboardShortcuts)

    window.ftElectron.handleUpdateSearchInputText(null)
  }
})
</script>

<style scoped lang="scss" src="./TopNav.scss" />
