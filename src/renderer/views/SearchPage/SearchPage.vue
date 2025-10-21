<template>
  <div>
    <FtLoader
      v-if="isLoading"
      :fullscreen="true"
    />
    <FtCard
      v-else
      class="card"
    >
      <h2>
        <FontAwesomeIcon
          :icon="['fas', 'search']"
          class="headingIcon"
          fixed-width
        />
        {{ t("Search Filters.Search Results") }}
      </h2>
      <FtElementList
        :data="shownResults"
      />
      <FtAutoLoadNextPageWrapper
        @load-next-page="nextPage"
      >
        <div
          class="getNextPage"
          role="button"
          tabindex="0"
          @click="nextPage"
          @keydown.enter.prevent="nextPage"
          @keydown.space.prevent="nextPage"
        >
          <FontAwesomeIcon :icon="['fas', 'search']" /> {{ t("Search Filters.Fetch more results") }}
        </div>
      </FtAutoLoadNextPageWrapper>
    </FtCard>
  </div>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'
import { useRoute } from 'vue-router/composables'

import FtLoader from '../../components/FtLoader/FtLoader.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtElementList from '../../components/FtElementList/FtElementList.vue'
import FtAutoLoadNextPageWrapper from '../../components/FtAutoLoadNextPageWrapper.vue'

import store from '../../store'

import packageDetails from '../../../../package.json'
import {
  copyToClipboard,
  searchFiltersMatch,
  showToast,
} from '../../helpers/utils'
import {
  extractLocalCacheableSearchContinuation,
  getLocalSearchContinuation,
  getLocalSearchResults
} from '../../helpers/api/local'
import { getInvidiousSearchResults } from '../../helpers/api/invidious'
import { SEARCH_CHAR_LIMIT } from '../../../constants'

const { t } = useI18n()
const route = useRoute()

const isLoading = ref(false)
const apiUsed = ref('local')
const searchSettings = ref({})
const searchPage = ref(1)
/** @type {import('vue').ShallowRef<import('youtubei.js').YT.Search | string | null>} */
const nextPageRef = shallowRef(null)
const shownResults = shallowRef([])

const query = ref('')
const processedQuery = computed(() => query.value.trim())

/** @type {import('vue').ComputedRef<any[]>} */
const sessionSearchHistory = computed(() => store.getters.getSessionSearchHistory)

/** @type {import('vue').ComputedRef<'local' | 'invidious'>} */
const backendPreference = computed(() => store.getters.getBackendPreference)

/** @type {import('vue').ComputedRef<boolean>} */
const backendFallback = computed(() => store.getters.getBackendFallback)

/** @type {import('vue').ComputedRef<boolean>} */
const showFamilyFriendlyOnly = computed(() => store.getters.getShowFamilyFriendlyOnly)

/** @type {import('vue').ComputedRef<boolean>} */
const rememberSearchHistory = computed(() => store.getters.getRememberSearchHistory)

watch(route, () => {
  const query_ = route.params.query.trim()
  let features = route.query.features
  // if page gets refreshed and there's only one feature then it will be a string
  if (typeof features === 'string') {
    features = [features]
  }
  const searchSettings = {
    sortBy: route.query.sortBy,
    time: route.query.time,
    type: route.query.type,
    duration: route.query.duration,
    features: features ?? [],
  }

  const payload = {
    query: query_,
    options: {},
    searchSettings: searchSettings
  }

  query.value = query_

  store.commit('setAppTitle', `${processedQuery.value} - ${packageDetails.productName}`)
  checkSearchCache(payload)
}, { deep: true })

onMounted(() => {
  query.value = route.params.query
  store.commit('setAppTitle', `${processedQuery.value} - ${packageDetails.productName}`)

  let features = route.query.features
  // if page gets refreshed and there's only one feature then it will be a string
  if (typeof features === 'string') {
    features = [features]
  }

  searchSettings.value = {
    sortBy: route.query.sortBy,
    time: route.query.time,
    type: route.query.type,
    duration: route.query.duration,
    features: features ?? [],
  }

  const payload = {
    query: processedQuery.value,
    options: {},
    searchSettings: searchSettings.value
  }

  checkSearchCache(payload)
})

function updateSearchHistoryEntry() {
  const persistentSearchHistoryPayload = {
    _id: processedQuery.value,
    lastUpdatedAt: Date.now()
  }

  store.dispatch('updateSearchHistoryEntry', persistentSearchHistoryPayload)
}

function checkSearchCache(payload) {
  if (payload.query.length > SEARCH_CHAR_LIMIT) {
    console.warn(`Search character limit is: ${SEARCH_CHAR_LIMIT}`)
    showToast(t('Search character limit', { searchCharacterLimit: SEARCH_CHAR_LIMIT }))
    return
  }

  const sameSearch = sessionSearchHistory.value.filter((search) => {
    return search.query === payload.query && searchFiltersMatch(payload.searchSettings, search.searchSettings)
  })

  if (sameSearch.length > 0) {
    // No loading effect needed here, only rendered result update
    replaceShownResults(sameSearch[0])
  } else {
    // Show loading effect coz there will be network request(s)
    isLoading.value = true
    searchSettings.value = payload.searchSettings

    switch (backendPreference.value) {
      case 'local':
        performSearchLocal(payload)
        break
      case 'invidious':
        performSearchInvidious(payload, { resetSearchPage: true })
        break
    }
  }

  if (rememberSearchHistory.value) {
    updateSearchHistoryEntry()
  }
}

async function performSearchLocal(payload) {
  isLoading.value = true

  try {
    const { results, continuationData } = await getLocalSearchResults(
      payload.query,
      payload.searchSettings,
      showFamilyFriendlyOnly.value
    )

    apiUsed.value = 'local'

    shownResults.value = results
    nextPageRef.value = continuationData

    isLoading.value = false

    const historyPayload = {
      query: payload.query,
      data: shownResults.value,
      searchSettings: searchSettings.value,
      nextPageRef: nextPageRef.value ? extractLocalCacheableSearchContinuation(nextPageRef.value) : null,
      apiUsed: apiUsed.value
    }

    store.commit('addToSessionSearchHistory', historyPayload)

    updateSubscriptionDetails(results)
  } catch (err) {
    console.error(err)

    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })

    if (backendPreference.value === 'local' && backendFallback.value) {
      showToast(t('Falling back to Invidious API'))
      performSearchInvidious(payload)
    } else {
      isLoading.value = false
    }
  }
}

async function getNextpageLocal(payload) {
  try {
    const { results, continuationData } = await getLocalSearchContinuation(payload.options.nextPageRef)

    if (results.length === 0) {
      return
    }

    apiUsed.value = 'local'

    shownResults.value = shownResults.value.concat(results)
    nextPageRef.value = continuationData

    const historyPayload = {
      query: payload.query,
      data: shownResults.value,
      searchSettings: searchSettings.value,
      nextPageRef: nextPageRef.value ? extractLocalCacheableSearchContinuation(nextPageRef.value) : null,
      apiUsed: apiUsed.value
    }

    store.commit('addToSessionSearchHistory', historyPayload)

    updateSubscriptionDetails(results)
  } catch (err) {
    console.error(err)

    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })

    if (backendPreference.value === 'local' && backendFallback.value) {
      showToast(t('Falling back to Invidious API'))
      performSearchInvidious(payload)
    } else {
      isLoading.value = false
    }
  }
}

async function performSearchInvidious(payload, options = { resetSearchPage: false }) {
  if (options.resetSearchPage) {
    searchPage.value = 1
  }

  if (searchPage.value === 1) {
    isLoading.value = true
  }

  try {
    const results = await getInvidiousSearchResults(payload.query, searchPage.value, payload.searchSettings)
    if (!results) {
      return
    }

    apiUsed.value = 'invidious'

    if (searchPage.value !== 1) {
      shownResults.value = shownResults.value.concat(results)
    } else {
      shownResults.value = results
    }

    isLoading.value = false

    searchPage.value++

    const historyPayload = {
      query: payload.query,
      data: shownResults.value,
      searchSettings: searchSettings.value,
      searchPage: searchPage.value,
      apiUsed: apiUsed.value
    }

    store.commit('addToSessionSearchHistory', historyPayload)

    updateSubscriptionDetails(results)
  } catch (err) {
    console.error(err)

    const errorMessage = t('Invidious API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })

    if (process.env.SUPPORTS_LOCAL_API && backendPreference.value === 'invidious' && backendFallback.value) {
      showToast(t('Falling back to Local API'))
      performSearchLocal(payload)
    } else {
      isLoading.value = false
      // TODO: Show toast with error message
    }
  }
}

function nextPage() {
  const payload = {
    query: processedQuery.value,
    searchSettings: searchSettings.value,
    options: {
      nextPageRef: nextPageRef.value
    }
  }

  if (apiUsed.value === 'local') {
    if (nextPageRef.value !== null) {
      showToast(t('Search Filters["Fetching results. Please wait"]'))
      getNextpageLocal(payload)
    } else {
      showToast(t('Search Filters.There are no more results for this search'))
    }
  } else {
    showToast(t('Search Filters["Fetching results. Please wait"]'))
    performSearchInvidious(payload)
  }
}

function replaceShownResults(history) {
  query.value = history.query
  shownResults.value = history.data
  searchSettings.value = history.searchSettings
  apiUsed.value = history.apiUsed

  if (history.nextPageRef != null) {
    nextPageRef.value = history.nextPageRef
  }

  if (typeof (history.searchPage) !== 'undefined') {
    searchPage.value = history.searchPage
  }

  // This is kept in case there is some race condition
  isLoading.value = false
}

/**
 * @param {any[]} results
 */
function updateSubscriptionDetails(results) {
  /** @type {Set<string>} */
  const subscribedChannelIds = store.getters.getSubscribedChannelIdSet

  const channels = []

  for (const result of results) {
    if (result.type !== 'channel' || !subscribedChannelIds.has(result.id ?? result.authorId)) {
      continue
    }

    if (result.dataSource === 'local') {
      channels.push({
        channelId: result.id,
        channelName: result.name,
        channelThumbnailUrl: result.thumbnail.replace(/^\/\//, 'https://')
      })
    } else {
      channels.push({
        channelId: result.authorId,
        channelName: result.author,
        channelThumbnailUrl: result.authorThumbnails[0].url.replace(/^\/\//, 'https://')
      })
    }
  }

  if (channels.length === 1) {
    store.dispatch('updateSubscriptionDetails', channels[0])
  } else if (channels.length > 1) {
    store.dispatch('batchUpdateSubscriptionDetails', channels)
  }
}
</script>

<style scoped src="./SearchPage.css" />
