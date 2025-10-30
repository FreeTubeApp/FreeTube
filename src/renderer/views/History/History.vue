<template>
  <div>
    <FtCard
      class="card"
    >
      <h2>
        <FontAwesomeIcon
          :icon="['fas', 'history']"
          class="headingIcon"
          fixed-width
        />
        {{ t('History.History') }}
      </h2>
      <FtInput
        v-show="fullData.length > 1"
        ref="searchBar"
        :placeholder="t('History.Search bar placeholder')"
        :show-clear-text-button="true"
        :show-action-button="false"
        :value="query"
        @input="handleQueryChange"
        @clear="() => handleQueryChange('')"
      />
      <div
        class="optionsRow"
      >
        <FtToggleSwitch
          v-if="fullData.length > 1"
          :label="t('History.Case Sensitive Search')"
          :compact="true"
          :default-value="doCaseSensitiveSearch"
          @change="doCaseSensitiveSearch = !doCaseSensitiveSearch"
        />
        <FtSelect
          v-if="fullData.length > 1"
          class="sortSelect"
          :placeholder="t('Global.Sort By')"
          :value="sortBy"
          :select-names="sortByNames"
          :select-values="SORT_BY_VALUES"
          :icon="sortByIcon"
          @change="updateUserHistorySortBy"
        />
      </div>
      <FtFlexBox
        v-if="fullData.length === 0"
      >
        <p class="message">
          {{ t("History['Your history list is currently empty.']") }}
        </p>
      </FtFlexBox>
      <FtFlexBox
        v-else-if="activeData.length === 0"
      >
        <p class="message">
          {{ t("History['Empty Search Message']") }}
        </p>
      </FtFlexBox>
      <FtElementList
        v-if="activeData.length > 0"
        :data="activeData"
        :show-video-with-last-viewed-playlist="true"
        :use-channels-hidden-preference="false"
        :hide-forbidden-titles="false"
      />
      <FtAutoLoadNextPageWrapper
        v-if="showLoadMoreButton"
        @load-next-page="increaseLimit"
      >
        <FtFlexBox>
          <FtButton
            :label="t('Subscriptions.Load More Videos')"
            background-color="var(--primary-color)"
            text-color="var(--text-with-main-color)"
            @click="increaseLimit"
          />
        </FtFlexBox>
      </FtAutoLoadNextPageWrapper>
    </FtCard>
  </div>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'
import { isNavigationFailure, NavigationFailureType } from 'vue-router'
import { useRoute, useRouter } from 'vue-router/composables'

import FtAutoLoadNextPageWrapper from '../../components/FtAutoLoadNextPageWrapper.vue'
import FtButton from '../../components/FtButton/FtButton.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtElementList from '../../components/FtElementList/FtElementList.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtInput from '../../components/ft-input/ft-input.vue'
import FtSelect from '../../components/FtSelect/FtSelect.vue'
import FtToggleSwitch from '../../components/FtToggleSwitch/FtToggleSwitch.vue'

import store from '../../store'

import { ctrlFHandler, debounce, getIconForSortPreference } from '../../helpers/utils'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const oldDataLimit = sessionStorage.getItem('History/dataLimit')
const dataLimit = ref(oldDataLimit !== null ? parseInt(oldDataLimit) : 100)

const searchDataLimit = ref(100)
const doCaseSensitiveSearch = ref(false)
const showLoadMoreButton = ref(false)
const query = ref('')
const activeData = ref([])

const HISTORY_SORT_BY_VALUES = {
  DateAddedNewest: 'latest_played_first',
  DateAddedOldest: 'earliest_played_first',
}

const SORT_BY_VALUES = Object.values(HISTORY_SORT_BY_VALUES)

const sortByNames = computed(() => [
  t('History.DateNewestHistory'),
  t('History.DateOldestHistory')
])

/** @type {import('vue').ComputedRef<'latest_played_first' | 'earliest_played_first'>} */
const sortBy = computed(() => store.getters.getUserHistorySortBy)

const sortByIcon = computed(() => getIconForSortPreference(sortBy.value))

/**
 * @param {'latest_played_first' | 'earliest_played_first'} value
 */
function updateUserHistorySortBy(value) {
  store.dispatch('updateUserHistorySortBy', value)
}

const historyCacheSorted = computed(() => {
  const historySorted = store.getters.getHistoryCacheSorted

  if (sortBy.value === HISTORY_SORT_BY_VALUES.DateAddedOldest) {
    return historySorted.toReversed()
  } else {
    return historySorted
  }
})

const fullData = computed(() => {
  if (historyCacheSorted.value.length < dataLimit.value) {
    return historyCacheSorted.value
  } else {
    return historyCacheSorted.value.slice(0, dataLimit.value)
  }
})

watch(fullData, filterHistory, { deep: true })
watch(doCaseSensitiveSearch, () => {
  filterHistory()
  saveStateInRouter()
})

/**
 * @param {string} query_
 * @param {string} [limit]
 * @param {boolean} [doCaseSensitiveSearch_]
 * @param {boolean} [filterNow=false]
 */
function handleQueryChange(query_, limit = undefined, doCaseSensitiveSearch_ = undefined, filterNow = false) {
  query.value = query_

  let newLimit = 100

  if (limit !== undefined) {
    const parsedLimit = parseInt(limit)

    if (!isNaN(parsedLimit)) {
      newLimit = parsedLimit
    }
  }

  searchDataLimit.value = newLimit

  if (doCaseSensitiveSearch_ !== undefined) {
    doCaseSensitiveSearch.value = doCaseSensitiveSearch_
  }

  saveStateInRouter()

  if (filterNow) {
    filterHistory()
  } else {
    filterHistoryAsync()
  }
}

function increaseLimit() {
  if (query.value.length > 0) {
    searchDataLimit.value += 100
    filterHistory()
  } else {
    dataLimit.value += 100
    sessionStorage.setItem('History/dataLimit', dataLimit.value.toFixed(0))
  }
}

function filterHistory() {
  if (query.value.length === 0) {
    activeData.value = fullData.value
    showLoadMoreButton.value = activeData.value.length < historyCacheSorted.value.length
    return
  }

  let filteredQuery = []
  if (doCaseSensitiveSearch.value) {
    filteredQuery = filterVideosWithQuery(historyCacheSorted.value, query.value)
  } else {
    filteredQuery = filterVideosWithQuery(historyCacheSorted.value, query.value.toLowerCase(), (s) => s.toLowerCase())
  }

  activeData.value = filteredQuery.length < searchDataLimit.value ? filteredQuery : filteredQuery.slice(0, searchDataLimit.value)
  showLoadMoreButton.value = activeData.value.length > searchDataLimit.value
}

const filterHistoryAsync = debounce(filterHistory, 500)

async function saveStateInRouter() {
  const query_ = query.value

  let location

  if (query_.length === 0) {
    location = { path: '/history' }
  } else {
    location = {
      path: '/history',
      query: {
        searchQueryText: query_,
        searchDataLimit: searchDataLimit.value.toFixed(0)
      }
    }

    if (doCaseSensitiveSearch.value) {
      location.query.doCaseSensitiveSearch = 'true'
    }
  }

  try {
    await router.replace(location)
  } catch (failure) {
    if (isNavigationFailure(failure, NavigationFailureType.duplicated)) {
      return
    }

    throw failure
  }
}

const oldQuery = route.query.searchQueryText
if (oldQuery != null && oldQuery !== '') {
  // `handleQueryChange` must be called after `filterHistoryDebounce` assigned
  handleQueryChange(
    oldQuery,
    route.query.searchDataLimit,
    route.query.doCaseSensitiveSearch === 'true',
    true
  )
} else {
  // Only display unfiltered data when no query used last time
  filterHistory()
}

const searchBar = ref(null)

/**
 * @param {KeyboardEvent} event
 */
function keyboardShortcutHandler(event) {
  ctrlFHandler(event, searchBar.value)
}

onMounted(() => {
  document.addEventListener('keydown', keyboardShortcutHandler)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', keyboardShortcutHandler)
})

const identity = (v) => v

/**
 * @param {any[]} videos
 * @param {string} query
 * @param {(attr: string) => string} attrProcessor
 */
function filterVideosWithQuery(videos, query, attrProcessor = identity) {
  return videos.filter((video) => {
    if (typeof (video.title) === 'string' && attrProcessor(video.title).includes(query)) {
      return true
    } else if (typeof (video.author) === 'string' && attrProcessor(video.author).includes(query)) {
      return true
    }

    return false
  })
}
</script>

<style scoped src="./History.css" />
