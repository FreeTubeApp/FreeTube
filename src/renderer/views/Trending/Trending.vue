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
      <h2>{{ $t("Trending.Trending") }}</h2>
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
          @keydown.left="focusTab($event, 'movies')"
          @keydown.right="focusTab($event, 'music')"
        >
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
          @keydown.left="focusTab($event, 'default')"
          @keydown.right="focusTab($event, 'gaming')"
        >
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
          @keydown.left="focusTab($event, 'music')"
          @keydown.right="focusTab($event, 'movies')"
        >
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
          @keydown.left="focusTab($event, 'gaming')"
          @keydown.right="focusTab($event, 'default')"
        >
          {{ $t("Trending.Movies").toUpperCase() }}
        </div>
      </FtFlexBox>
      <FtElementList
        id="trendingPanel"
        role="tabpanel"
        :data="shownResults"
      />
    </FtCard>
    <FtRefreshWidget
      :disable-refresh="isLoading"
      :last-refresh-timestamp="lastTrendingRefreshTimestamp"
      :title="$t('Trending.Trending')"
      @click="getTrendingInfo(true)"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onBeforeUnmount, ref, shallowRef } from 'vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtLoader from '../../components/ft-loader/ft-loader.vue'
import FtElementList from '../../components/FtElementList/FtElementList.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtRefreshWidget from '../../components/ft-refresh-widget/ft-refresh-widget.vue'
import { copyToClipboard, getRelativeTimeFromDate, setPublishedTimestampsInvidious, showToast } from '../../helpers/utils'
import { getLocalTrending } from '../../helpers/api/local'
import { invidiousAPICall } from '../../helpers/api/invidious'
import { useI18n } from '../../composables/use-i18n-polyfill.js'
import store from '../../store/index'

const { t } = useI18n()
const isLoading = ref(false)
const shownResults = shallowRef([])
/** @typedef {'default' | 'music' | 'gaming' | 'movies'} TrendingTab */
/** @type {import('vue').Ref<TrendingTab>} */
const currentTab = ref('default')
/** @type {import('vue').Ref<HTMLDivElement | null>} */
const defaultTab = ref(null)
/** @type {import('vue').Ref<HTMLDivElement | null>} */
const musicTab = ref(null)
/** @type {import('vue').Ref<HTMLDivElement | null>} */
const gamingTab = ref(null)
/** @type {import('vue').Ref<HTMLDivElement | null>} */
const moviesTab = ref(null)
const trendingInstance = ref(null)

/** @type {import('vue').ComputedRef<'invidious' | 'local'>} */
const backendPreference = computed(() => {
  return store.getters.getBackendPreference
})

/** @type {import('vue').ComputedRef<boolean>} */
const backendFallback = computed(() => {
  return store.getters.getBackendFallback
})

/** @type {import('vue').ComputedRef<boolean>} */
const lastTrendingRefreshTimestamp = computed(() => {
  return getRelativeTimeFromDate(store.getters.getLastTrendingRefreshTimestamp, true)
})

/** @type {import('vue').ComputedRef<string>} */
const region = computed(() => {
  return store.getters.getRegion.toUpperCase()
})

/** @type {import('vue').ComputedRef<object>} */
const trendingCache = computed(() => {
  return store.getters.getRegion.toUpperCase()
})

onMounted(() => {
  document.addEventListener('keydown', keyboardShortcutHandler)
  if (trendingCache.value[currentTab.value] && trendingCache.value[currentTab.value].length > 0) {
    getTrendingInfoCache()
  } else {
    getTrendingInfo()
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', keyboardShortcutHandler)
})

/**
 * @param {TrendingTab} tab
 */
function changeTab(tab) {
  if (tab === currentTab.value) {
    return
  }

  currentTab.value = tab
  if (trendingCache.value[currentTab.value] && trendingCache.value[currentTab.value].length > 0) {
    getTrendingInfoCache()
  } else {
    getTrendingInfo()
  }
}

/**
 * @param {KeyboardEvent} event
 * @param {TrendingTab} tab
 */
function focusTab(event, tab) {
  if (!event.altKey) {
    event.preventDefault()
    setFocus(tab)
    store.dispatch('showOutlines')
  }
}

function getTrendingInfo(refresh = false) {
  if (refresh) {
    trendingInstance.value = null
    store.commit('clearTrendingCache')
  }

  if (!process.env.SUPPORTS_LOCAL_API || backendPreference.value === 'invidious') {
    getTrendingInfoInvidious()
  } else {
    getTrendingInfoLocal()
  }

  store.commit('setLastTrendingRefreshTimestamp', new Date())
}

async function getTrendingInfoLocal() {
  isLoading.value = true

  try {
    const { results, instance } = await getLocalTrending(region.value, currentTab.value, trendingInstance.value)

    shownResults.value = results
    isLoading.value = false
    trendingInstance.value = instance

    store.commit('setTrendingCache', { value: results, page: currentTab.value })
    nextTick(() => {
      setFocus(currentTab.value)
    })
  } catch (err) {
    console.error(err)
    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })
    if (backendPreference.value === 'local' && backendFallback.value) {
      showToast(t('Falling back to Invidious API'))
      getTrendingInfoInvidious()
    } else {
      isLoading.value = false
    }
  }
}

/**
 * @param {TrendingTab} tab
 */
function setFocus(tab) {
  switch (tab) {
    case 'gaming':
      gamingTab.value?.focus()
      break
    case 'movies':
      moviesTab.value?.focus()
      break
    case 'music':
      musicTab.value?.focus()
      break
    default:
      defaultTab.value?.focus()
  }
}

function getTrendingInfoCache() {
  shownResults.value = trendingCache.value[currentTab.value]
}

function getTrendingInfoInvidious() {
  isLoading.value = true

  const trendingPayload = {
    resource: 'trending',
    id: '',
    params: { region: region.value }
  }

  if (currentTab.value !== 'default') {
    trendingPayload.params.type = currentTab.value.charAt(0).toUpperCase() + currentTab.value.slice(1)
  }

  invidiousAPICall(trendingPayload).then((result) => {
    if (!result) {
      return
    }

    const returnData = result.filter((item) => {
      return item.type === 'video' || item.type === 'channel' || item.type === 'playlist'
    })

    setPublishedTimestampsInvidious(returnData.filter(item => item.type === 'video'))

    shownResults.value = returnData
    isLoading.value = false
    store.commit('setTrendingCache', { value: returnData, page: currentTab.value })
    nextTick(() => {
      setFocus(currentTab.value)
    })
  }).catch((err) => {
    console.error(err)
    const errorMessage = t('Invidious API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })

    if (process.env.SUPPORTS_LOCAL_API && (backendPreference.value === 'invidious' && backendFallback.value)) {
      showToast(t('Falling back to Local API'))
      getTrendingInfoLocal()
    } else {
      isLoading.value = false
    }
  })
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

  switch (event.key) {
    case 'r':
    case 'R':
    case 'F5':
      if (!isLoading.value) {
        getTrendingInfo(true)
      }
      break
  }
}

</script>
<style scoped src="./Trending.css" />
