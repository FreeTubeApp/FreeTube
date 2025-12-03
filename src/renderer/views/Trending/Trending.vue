<template>
  <div>
    <FtCard
      class="card"
    >
      <h2>
        <FontAwesomeIcon
          :icon="['fas', 'fire']"
          class="trendingIcon"
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
          ref="gamingTab"
          class="tab"
          role="tab"
          :aria-selected="currentTab === 'gaming'"
          aria-controls="trendingPanel"
          :tabindex="currentTab === 'gaming' ? 0 : -1"
          :class="{ selectedTab: currentTab === 'gaming' }"
          @click="changeTab('gaming')"
          @keydown.space.enter.prevent="changeTab('gaming')"
          @keydown.left="focusTab('podcasts', $event)"
          @keydown.right="focusTab('sports', $event)"
        >
          <FontAwesomeIcon
            :icon="['fas', 'gamepad']"
            class="trendingIcon"
          />
          {{ $t("Trending.Gaming") }}
        </div>
        <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
        <div
          ref="sportsTab"
          class="tab"
          role="tab"
          :aria-selected="currentTab === 'sports'"
          aria-controls="trendingPanel"
          :tabindex="currentTab === 'sports' ? 0 : -1"
          :class="{ selectedTab: currentTab === 'sports' }"
          @click="changeTab('sports')"
          @keydown.space.enter.prevent="changeTab('sports')"
          @keydown.left="focusTab('gaming', $event)"
          @keydown.right="focusTab('podcasts', $event)"
        >
          <FontAwesomeIcon
            :icon="['fas', 'trophy']"
            class="trendingIcon"
          />
          {{ t("Trending.Sports") }}
        </div>
        <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
        <div
          ref="podcastsTab"
          class="tab"
          role="tab"
          :aria-selected="currentTab === 'podcasts'"
          aria-controls="trendingPanel"
          :tabindex="currentTab === 'podcasts' ? 0 : -1"
          :class="{ selectedTab: currentTab === 'podcasts' }"
          @click="changeTab('podcasts')"
          @keydown.space.enter.prevent="changeTab('podcasts')"
          @keydown.left="focusTab('sports', $event)"
          @keydown.right="focusTab('gaming', $event)"
        >
          <FontAwesomeIcon
            :icon="['fas', 'podcast']"
            class="trendingIcon"
          />
          {{ t("Channel.Podcasts.Podcasts") }}
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'

import FtCard from '../../components/ft-card/ft-card.vue'
import FtLoader from '../../components/FtLoader/FtLoader.vue'
import FtElementList from '../../components/FtElementList/FtElementList.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtRefreshWidget from '../../components/FtRefreshWidget/FtRefreshWidget.vue'

import store from '../../store/index'

import { copyToClipboard, getRelativeTimeFromDate, showToast } from '../../helpers/utils'
import { getLocalTrending } from '../../helpers/api/local'
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

/** @type {import('vue').ComputedRef<{ gaming: any[] | null, sports: any[] | null, podcasts: any[] | null }>} */
const trendingCache = computed(() => {
  return store.getters.getTrendingCache
})

const isLoading = ref({ gaming: false, sports: false, podcasts: false })
const shownResults = shallowRef([])

/** @type {import('vue').Ref<'gaming' | 'sports' | 'podcasts'>} */
const currentTab = ref('gaming')

const cacheEntry = trendingCache.value[currentTab.value]

if (cacheEntry && cacheEntry.length > 0) {
  shownResults.value = cacheEntry
} else {
  onMounted(() => {
    getTrendingInfo()
  })
}

function getTrendingInfo(refresh = false) {
  if (refresh) {
    store.commit('clearTrendingCache', currentTab.value)
  }

  if (process.env.SUPPORTS_LOCAL_API && (backendFallback.value || backendPreference.value === 'local')) {
    getTrendingInfoLocal()
  }

  store.commit('setLastTrendingRefreshTimestamp', { page: currentTab.value, timestamp: new Date() })
}

async function getTrendingInfoLocal() {
  isLoading.value[currentTab.value] = true

  try {
    const results = await getLocalTrending(region.value, currentTab.value)

    shownResults.value = results
    isLoading.value[currentTab.value] = false

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
    isLoading.value[currentTab.value] = false
  }
}

const gamingTab = useTemplateRef('gamingTab')
const sportsTab = useTemplateRef('sportsTab')
const podcastsTab = useTemplateRef('podcastsTab')

/**
 * @param {'gaming' | 'sports' | 'podcasts'} tab
 * @param {KeyboardEvent | undefined} event
 */
function focusTab(tab, event = undefined) {
  if (event) {
    if (event.altKey) { return }

    event.preventDefault()
    store.dispatch('showOutlines')
  }

  switch (tab) {
    case 'gaming':
      gamingTab.value?.focus()
      break
    case 'sports':
      sportsTab.value?.focus()
      break
    case 'podcasts':
      podcastsTab.value?.focus()
      break
  }
}

/**
 * @param {'gaming' | 'sports' | 'podcasts'} tab
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
