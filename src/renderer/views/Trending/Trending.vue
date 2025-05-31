<template>
  <div>
    <FtCard
      class="card"
    >
      <h2>
        <FontAwesomeIcon
          :icon="['fas', 'fire']"
          class="trendingIcon"
          fixed-width
        />
        {{ $t("Trending.Trending") }}
      </h2>
      <FtFlexBox
        class="trendingInfoTabs"
        role="tablist"
        :aria-label="$t('Trending.Trending Tabs')"
      >
        <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
        <div
          ref="defaultTab"
          class="tab"
          role="tab"
          :aria-selected="String(currentTab === 'default')"
          aria-controls="trendingPanel"
          :tabindex="currentTab === 'default' ? 0 : -1"
          :class="{ selectedTab: currentTab === 'default' }"
          @click="changeTab('default')"
          @keydown.space.enter.prevent="changeTab('default')"
          @keydown.left="focusTab('movies', $event)"
          @keydown.right="focusTab('music', $event)"
        >
          <FontAwesomeIcon
            :icon="['fas', 'fire']"
            class="trendingIcon"
            fixed-width
          />
          {{ $t("Trending.Default").toUpperCase() }}
        </div>
        <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
        <div
          ref="musicTab"
          class="tab"
          role="tab"
          :aria-selected="String(currentTab === 'music')"
          aria-controls="trendingPanel"
          :tabindex="currentTab === 'music' ? 0 : -1"
          :class="{ selectedTab: currentTab === 'music' }"
          @click="changeTab('music')"
          @keydown.space.enter.prevent="changeTab('music')"
          @keydown.left="focusTab('default', $event)"
          @keydown.right="focusTab('gaming', $event)"
        >
          <FontAwesomeIcon
            :icon="['fas', 'music']"
            class="trendingIcon"
            fixed-width
          />
          {{ $t("Trending.Music").toUpperCase() }}
        </div>
        <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
        <div
          ref="gamingTab"
          class="tab"
          role="tab"
          :aria-selected="String(currentTab === 'gaming')"
          aria-controls="trendingPanel"
          :tabindex="currentTab === 'gaming' ? 0 : -1"
          :class="{ selectedTab: currentTab === 'gaming' }"
          @click="changeTab('gaming')"
          @keydown.space.enter.prevent="changeTab('gaming')"
          @keydown.left="focusTab('music', $event)"
          @keydown.right="focusTab('movies', $event)"
        >
          <FontAwesomeIcon
            :icon="['fas', 'gamepad']"
            class="trendingIcon"
            fixed-width
          />
          {{ $t("Trending.Gaming").toUpperCase() }}
        </div>
        <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
        <div
          ref="moviesTab"
          class="tab"
          role="tab"
          :aria-selected="String(currentTab === 'movies')"
          aria-controls="trendingPanel"
          :tabindex="currentTab === 'movies' ? 0 : -1"
          :class="{ selectedTab: currentTab === 'movies' }"
          @click="changeTab('movies')"
          @keydown.space.enter.prevent="changeTab('movies')"
          @keydown.left="focusTab('gaming', $event)"
          @keydown.right="focusTab('default', $event)"
        >
          <FontAwesomeIcon
            :icon="['fas', 'film']"
            class="trendingIcon"
            fixed-width
          />
          {{ $t("Trending.Movies").toUpperCase() }}
        </div>
      </FtFlexBox>
      <div
        id="trendingPanel"
        role="tabpanel"
      >
        <FtLoader
          v-if="isLoading[currentTab]"
        />
        <FtElementList
          v-else
          :data="shownResults"
        />
      </div>
    </FtCard>
    <FtRefreshWidget
      :disable-refresh="isLoading[currentTab]"
      :last-refresh-timestamp="lastTrendingRefreshTimestamp"
      :title="$t('Trending.Trending')"
      @click="getTrendingInfo(true)"
    />
  </div>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'

import FtCard from '../../components/ft-card/ft-card.vue'
import FtLoader from '../../components/FtLoader/FtLoader.vue'
import FtElementList from '../../components/FtElementList/FtElementList.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtRefreshWidget from '../../components/FtRefreshWidget/FtRefreshWidget.vue'

import store from '../../store/index'

import { copyToClipboard, getRelativeTimeFromDate, showToast } from '../../helpers/utils'
import { getLocalTrending } from '../../helpers/api/local'
import { getInvidiousTrending } from '../../helpers/api/invidious'
import { KeyboardShortcuts } from '../../../constants'

const { t } = useI18n()

/** @type {import('vue').ComputedRef<'local' | 'invidious'>} */
const backendPreference = computed(() => {
  return store.getters.getBackendPreference
})

/** @type {import('vue').ComputedRef<boolean>} */
const backendFallback = computed(() => {
  return store.getters.getBackendFallback
})

const lastTrendingRefreshTimestamp = computed(() => {
  return getRelativeTimeFromDate(store.getters.getLastTrendingRefreshTimestamp[currentTab.value], true)
})

/** @type {import('vue').ComputedRef<string>} */
const region = computed(() => {
  return store.getters.getRegion.toUpperCase()
})

/** @type {import('vue').ComputedRef<{ default: any[] | null, music: any[] | null, gaming: any[] | null, movies: any[] | null }>} */
const trendingCache = computed(() => {
  return store.getters.getTrendingCache
})

const isLoading = ref({ default: false, music: false, gaming: false, movies: false })
const shownResults = shallowRef([])

/** @type {import('vue').Ref<'default' | 'music' | 'gaming' | 'movies'>} */
const currentTab = ref('default')

const cacheEntry = trendingCache.value[currentTab.value]

if (cacheEntry && cacheEntry.length > 0) {
  shownResults.value = cacheEntry
} else {
  onMounted(() => {
    getTrendingInfo()
  })
}

/** @type {import('youtubei.js').Mixins.TabbedFeed<import('youtubei.js').IBrowseResponse> | null} */
let trendingInstance = null

function getTrendingInfo(refresh = false) {
  if (refresh) {
    if (process.env.SUPPORTS_LOCAL_API) {
      trendingInstance = null
    }

    store.commit('clearTrendingCache', currentTab.value)
  }

  if (!process.env.SUPPORTS_LOCAL_API || backendPreference.value === 'invidious') {
    getTrendingInfoInvidious()
  } else {
    getTrendingInfoLocal()
  }

  store.commit('setLastTrendingRefreshTimestamp', { page: currentTab.value, timestamp: new Date() })
}

async function getTrendingInfoLocal() {
  isLoading.value[currentTab.value] = true

  try {
    const { results, instance } = await getLocalTrending(region.value, currentTab.value, trendingInstance)

    shownResults.value = results
    isLoading.value[currentTab.value] = false
    trendingInstance = instance

    store.commit('setTrendingCache', { value: results, page: currentTab.value })
    nextTick(() => {
      focusTab(currentTab.value)
    })
  } catch (error) {
    console.error(error)
    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${error}`, 10000, () => {
      copyToClipboard(error)
    })
    if (backendPreference.value === 'local' && backendFallback.value) {
      showToast(t('Falling back to Invidious API'))
      getTrendingInfoInvidious()
    } else {
      isLoading.value[currentTab.value] = false
    }
  }
}

function getTrendingInfoInvidious() {
  isLoading.value[currentTab.value] = true

  getInvidiousTrending(currentTab.value, region.value).then((items) => {
    if (!items) {
      return
    }

    shownResults.value = items
    isLoading.value[currentTab.value] = false
    store.commit('setTrendingCache', { value: items, page: currentTab.value })
    nextTick(() => {
      focusTab(currentTab.value)
    })
  }).catch((err) => {
    console.error(err)
    const errorMessage = t('Invidious API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })

    if (process.env.SUPPORTS_LOCAL_API && backendPreference.value === 'invidious' && backendFallback.value) {
      showToast(t('Falling back to Local API'))
      getTrendingInfoLocal()
    } else {
      isLoading.value[currentTab.value] = false
    }
  })
}

/** @type {import('vue').Ref<HTMLDivElement | null>} */
const defaultTab = ref(null)
/** @type {import('vue').Ref<HTMLDivElement | null>} */
const musicTab = ref(null)
/** @type {import('vue').Ref<HTMLDivElement | null>} */
const gamingTab = ref(null)
/** @type {import('vue').Ref<HTMLDivElement | null>} */
const moviesTab = ref(null)

/**
 * @param {'default' | 'music' | 'gaming' | 'movies'} tab
 * @param {KeyboardEvent | undefined} event
 */
function focusTab(tab, event = undefined) {
  if (event) {
    if (event.altKey) { return }

    event.preventDefault()
    store.dispatch('showOutlines')
  }

  switch (tab) {
    case 'default':
      defaultTab.value?.focus()
      break
    case 'music':
      musicTab.value?.focus()
      break
    case 'gaming':
      gamingTab.value?.focus()
      break
    case 'movies':
      moviesTab.value?.focus()
      break
  }
}

/**
 * @param {'default' | 'music' | 'gaming' | 'movies'} tab
 */
function changeTab(tab) {
  if (tab === currentTab.value) {
    return
  }

  currentTab.value = tab

  const cacheEntry = trendingCache.value[currentTab.value]

  if (cacheEntry && cacheEntry.length > 0) {
    shownResults.value = cacheEntry
  } else {
    getTrendingInfo()
  }
}

/**
 * @param {KeyboardEvent} event the keyboard event
 */
function keyboardShortcutHandler(event) {
  if (event.ctrlKey || document.activeElement.classList.contains('ft-input')) {
    return
  }

  // Avoid handling events due to user holding a key (not released)
  // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/repeat
  if (event.repeat) { return }

  switch (event.key.toLowerCase()) {
    case 'f5':
    case KeyboardShortcuts.APP.SITUATIONAL.REFRESH:
      if (!isLoading.value[currentTab.value]) {
        getTrendingInfo(true)
      }
      break
  }
}

onMounted(() => {
  document.addEventListener('keydown', keyboardShortcutHandler)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', keyboardShortcutHandler)
})
</script>

<style scoped src="./Trending.css" />
