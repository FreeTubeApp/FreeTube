<template>
  <FtSettingsSection
    :title="t('Settings.General Settings.General Settings')"
  >
    <div class="switchColumnGrid">
      <div class="switchColumn">
        <FtToggleSwitch
          :label="t('Settings.General Settings.Check for Updates')"
          :default-value="checkForUpdates"
          :compact="true"
          @change="updateCheckForUpdates"
        />
        <FtToggleSwitch
          v-if="SUPPORTS_LOCAL_API"
          :label="t('Settings.General Settings.Fallback to Non-Preferred Backend on Failure')"
          :default-value="backendFallback"
          :compact="true"
          :tooltip="t('Tooltips.General Settings.Fallback to Non-Preferred Backend on Failure')"
          @change="updateBackendFallback"
        />
        <FtToggleSwitch
          :label="t('Settings.General Settings.Auto Load Next Page.Label')"
          :default-value="generalAutoLoadMorePaginatedItemsEnabled"
          :compact="true"
          :tooltip="t('Settings.General Settings.Auto Load Next Page.Tooltip')"
          @change="updateGeneralAutoLoadMorePaginatedItemsEnabled"
        />
        <FtToggleSwitch
          v-if="!IS_MAC && USING_ELECTRON"
          :label="t('Settings.General Settings.Minimize to system tray')"
          :default-value="hideToTrayOnMinimize"
          :compact="true"
          @change="updateHideToTrayOnMinimize"
        />
      </div>
      <div class="switchColumn">
        <FtToggleSwitch
          :label="t('Settings.General Settings.Check for Latest Blog Posts')"
          :default-value="checkForBlogPosts"
          :compact="true"
          @change="updateCheckForBlogPosts"
        />
        <FtToggleSwitch
          :label="t('Settings.General Settings.Enable Search Suggestions')"
          :default-value="enableSearchSuggestions"
          :compact="true"
          @change="updateEnableSearchSuggestions"
        />
        <FtToggleSwitch
          v-if="USING_ELECTRON"
          :label="t('Settings.General Settings.Open Deep Links In New Window')"
          :default-value="openDeepLinksInNewWindow"
          :compact="true"
          :tooltip="t('Tooltips.General Settings.Open Deep Links In New Window')"
          @change="updateOpenDeepLinksInNewWindow"
        />
      </div>
    </div>
    <div class="switchGrid">
      <FtSelect
        :placeholder="t('Settings.General Settings.Preferred API Backend.Preferred API Backend')"
        :value="backendPreference"
        :select-names="backendNames"
        :select-values="BACKEND_VALUES"
        :tooltip="t('Tooltips.General Settings.Preferred API Backend')"
        :icon="['fas', 'server']"
        @change="updateBackendPreference"
      />
      <FtSelect
        :placeholder="t('Settings.General Settings.Default Landing Page')"
        :value="landingPage"
        :select-names="defaultPageNames"
        :select-values="defaultPageValues"
        :icon="['fas', 'location-dot']"
        @change="updateLandingPage"
      />
      <FtSelect
        :placeholder="t('Settings.General Settings.Video View Type.Video View Type')"
        :value="listType"
        :select-names="viewTypeNames"
        :select-values="VIEW_TYPE_VALUES"
        :icon="listType === 'grid' ? ['fas', 'grip'] : ['fas', 'list']"
        @change="updateListType"
      />
      <FtSelect
        :placeholder="t('Settings.General Settings.Thumbnail Preference.Thumbnail Preference')"
        :value="thumbnailPreference"
        :select-names="thumbnailTypeNames"
        :select-values="THUMBNAIL_TYPE_VALUES"
        :tooltip="t('Tooltips.General Settings.Thumbnail Preference')"
        :icon="['fas', 'images']"
        @change="handleThumbnailPreferenceChange"
      />
      <FtSelect
        :placeholder="t('Settings.General Settings.Locale Preference')"
        :value="currentLocale"
        :select-names="localeNames"
        :select-values="LOCALE_VALUES"
        :icon="['fas', 'language']"
        :is-locale-selector="true"
        @change="updateCurrentLocale"
      />
      <FtSelect
        v-if="regionDataLoaded"
        :placeholder="t('Settings.General Settings.Region for Trending')"
        :value="region"
        :select-names="regionNames"
        :select-values="regionValues"
        :icon="['fas', 'globe']"
        :tooltip="t('Tooltips.General Settings.Region for Trending')"
        @change="updateRegion"
      />
      <FtSelect
        :placeholder="t('Settings.General Settings.External Link Handling.External Link Handling')"
        :value="externalLinkHandling"
        :select-names="externalLinkHandlingNames"
        :select-values="EXTERNAL_LINK_HANDLING_VALUES"
        :icon="['fas', 'external-link-alt']"
        :tooltip="t('Tooltips.General Settings.External Link Handling')"
        @change="updateExternalLinkHandling"
      />
    </div>
    <div
      v-if="backendPreference === 'invidious' || backendFallback"
    >
      <FtFlexBox class="settingsFlexStart460px">
        <FtInput
          :placeholder="t('Settings.General Settings.Current Invidious Instance')"
          :show-action-button="false"
          :show-label="true"
          :value="currentInvidiousInstance"
          :data-list="invidiousInstancesList"
          :tooltip="t('Tooltips.General Settings.Invidious Instance')"
          @input="handleInvidiousInstanceInput"
        />
      </FtFlexBox>
      <FtFlexBox>
        <div>
          <a
            href="https://api.invidious.io"
          >
            {{ t('Settings.General Settings.View all Invidious instance information') }}
          </a>
        </div>
      </FtFlexBox>
      <p
        v-if="defaultInvidiousInstance !== ''"
        class="center"
      >
        {{ t('Settings.General Settings.The currently set default instance is {instance}', { instance: defaultInvidiousInstance }) }}
      </p>
      <template v-else>
        <p class="center">
          {{ t('Settings.General Settings.No default instance has been set') }}
        </p>
        <p class="center">
          {{ t('Settings.General Settings.Current instance will be randomized on startup') }}
        </p>
      </template>
      <FtFlexBox>
        <FtButton
          :label="t('Settings.General Settings.Set Current Instance as Default')"
          @click="handleSetDefaultInstanceClick"
        />
        <FtButton
          :label="t('Settings.General Settings.Clear Default Instance')"
          @click="handleClearDefaultInstanceClick"
        />
      </FtFlexBox>
    </div>
  </FtSettingsSection>
</template>

<script setup>
import { computed, onBeforeUnmount } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'
import { useRouter } from 'vue-router'

import FtSettingsSection from '../FtSettingsSection/FtSettingsSection.vue'
import FtSelect from '../FtSelect/FtSelect.vue'
import FtInput from '../FtInput/FtInput.vue'
import FtToggleSwitch from '../FtToggleSwitch/FtToggleSwitch.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtButton from '../FtButton/FtButton.vue'

import store from '../../store/index'

import allLocales from '../../../../static/locales/activeLocales.json'
import { debounce, randomArrayItem, showToast } from '../../helpers/utils'
import { translateWindowTitle } from '../../helpers/strings'

const USING_ELECTRON = !!process.env.IS_ELECTRON
const SUPPORTS_LOCAL_API = !!process.env.SUPPORTS_LOCAL_API
const IS_MAC = process.platform === 'darwin'

const { t } = useI18n()
const router = useRouter()

/** @type {import('vue').ComputedRef<boolean>} */
const checkForUpdates = computed(() => store.getters.getCheckForUpdates)

/**
 * @param {boolean} value
 */
function updateCheckForUpdates(value) {
  store.dispatch('updateCheckForUpdates', value)
}

/** @type {import('vue').ComputedRef<boolean>} */
const backendFallback = computed(() => store.getters.getBackendFallback)

/**
 * @param {boolean} value
 */
function updateBackendFallback(value) {
  store.dispatch('updateBackendFallback', value)
}

/** @type {import('vue').ComputedRef<boolean>} */
const generalAutoLoadMorePaginatedItemsEnabled = computed(() => {
  return store.getters.getGeneralAutoLoadMorePaginatedItemsEnabled
})

/**
 * @param {boolean} value
 */
function updateGeneralAutoLoadMorePaginatedItemsEnabled(value) {
  store.dispatch('updateGeneralAutoLoadMorePaginatedItemsEnabled', value)
}

/** @type {import('vue').ComputedRef<boolean>} */
const hideToTrayOnMinimize = computed(() => store.getters.getHideToTrayOnMinimize)

/**
 * @param {boolean} value
 */
function updateHideToTrayOnMinimize(value) {
  store.dispatch('updateHideToTrayOnMinimize', value)
}

/** @type {import('vue').ComputedRef<boolean>} */
const checkForBlogPosts = computed(() => store.getters.getCheckForBlogPosts)

/**
 * @param {boolean} value
 */
function updateCheckForBlogPosts(value) {
  store.dispatch('updateCheckForBlogPosts', value)
}

/** @type {import('vue').ComputedRef<boolean>} */
const enableSearchSuggestions = computed(() => store.getters.getEnableSearchSuggestions)

/**
 * @param {boolean} value
 */
function updateEnableSearchSuggestions(value) {
  store.dispatch('updateEnableSearchSuggestions', value)
}

/** @type {import('vue').ComputedRef<boolean>} */
const openDeepLinksInNewWindow = computed(() => store.getters.getOpenDeepLinksInNewWindow)

/**
 * @param {boolean} value
 */
function updateOpenDeepLinksInNewWindow(value) {
  store.dispatch('updateOpenDeepLinksInNewWindow', value)
}

const BACKEND_VALUES = process.env.SUPPORTS_LOCAL_API
  ? ['invidious', 'local']
  : ['invidious']

const backendNames = computed(() => {
  if (process.env.SUPPORTS_LOCAL_API) {
    return [
      t('Settings.General Settings.Preferred API Backend.Invidious API'),
      t('Settings.General Settings.Preferred API Backend.Local API')
    ]
  } else {
    return [
      t('Settings.General Settings.Preferred API Backend.Invidious API')
    ]
  }
})

/** @type {import('vue').ComputedRef<'local' | 'invidious'>} */
const backendPreference = computed(() => store.getters.getBackendPreference)

/**
 * @param {'local' | 'invidious'} value
 */
function updateBackendPreference(value) {
  store.dispatch('updateBackendPreference', value)
}

/** @type {import('vue').ComputedRef<boolean>} */
const hidePlaylists = computed(() => store.getters.getHidePlaylists)

/** @type {import('vue').ComputedRef<boolean>} */
const hidePopularVideos = computed(() => store.getters.getHidePopularVideos)

/** @type {import('vue').ComputedRef<boolean>} */
const hideTrendingVideos = computed(() => store.getters.getHideTrendingVideos)

const INCLUDED_DEFAULT_PAGE_NAMES = [
  'subscriptions',
  'subscribedChannels',
  'popular',
  'userPlaylists',
  'history',
  'settings',
  ...(process.env.SUPPORTS_LOCAL_API ? ['trending'] : [])
]

const defaultPages = computed(() => {
  let includedPageNames = INCLUDED_DEFAULT_PAGE_NAMES

  if (hideTrendingVideos.value || !backendFallback.value || backendPreference.value !== 'local') {
    includedPageNames = includedPageNames.filter((pageName) => pageName !== 'trending')
  }

  if (hidePlaylists.value) {
    includedPageNames = includedPageNames.filter((pageName) => pageName !== 'userPlaylists')
  }

  if (!(!hidePopularVideos.value && (backendFallback.value || backendPreference.value === 'invidious'))) {
    includedPageNames = includedPageNames.filter((pageName) => pageName !== 'popular')
  }

  return router.getRoutes().filter((route) => includedPageNames.includes(route.name))
})

const defaultPageNames = computed(() => defaultPages.value.map((route) => translateWindowTitle(route.meta.title)))

const defaultPageValues = computed(() => {
  // avoid Vue parsing issues by excluding '/' from path values
  return defaultPages.value.map((route) => route.path.slice(1))
})

/** @type {import('vue').ComputedRef<'subscriptions' | 'subscribedChannels' | 'popular' | 'userPlaylists' | 'history' | 'settings' | 'trending'>} */
const landingPage = computed(() => store.getters.getLandingPage)

/**
 * @param {'subscriptions' | 'subscribedChannels' | 'popular' | 'userPlaylists' | 'history' | 'settings' | 'trending'} value
 */
function updateLandingPage(value) {
  store.dispatch('updateLandingPage', value)
}

const VIEW_TYPE_VALUES = ['grid', 'list']

const viewTypeNames = computed(() => [
  t('Settings.General Settings.Video View Type.Grid'),
  t('Settings.General Settings.Video View Type.List')
])

/** @type {import('vue').ComputedRef<'grid' | 'list'>} */
const listType = computed(() => store.getters.getListType)

/**
 * @param {'grid' | 'list'} value
 */
function updateListType(value) {
  store.dispatch('updateListType', value)
}

const THUMBNAIL_TYPE_VALUES = ['', 'start', 'middle', 'end', 'hidden', 'blur']

const thumbnailTypeNames = computed(() => [
  t('Settings.General Settings.Thumbnail Preference.Default'),
  t('Settings.General Settings.Thumbnail Preference.Beginning'),
  t('Settings.General Settings.Thumbnail Preference.Middle'),
  t('Settings.General Settings.Thumbnail Preference.End'),
  t('Settings.General Settings.Thumbnail Preference.Hidden'),
  t('Settings.General Settings.Thumbnail Preference.Blur')
])

/** @type {import('vue').ComputedRef<boolean>} */
const blurThumbnails = computed(() => store.getters.getBlurThumbnails)

/** @type {import('vue').ComputedRef<'' | 'start' | 'middle' | 'end' | 'hidden' | 'blur'>} */
const thumbnailPreference = computed(() => {
  return blurThumbnails.value ? 'blur' : store.getters.getThumbnailPreference
})

/**
 * @param {'' | 'start' | 'middle' | 'end' | 'hidden' | 'blur'} value
 */
function handleThumbnailPreferenceChange(value) {
  store.dispatch('updateBlurThumbnails', value === 'blur')
  store.dispatch('updateThumbnailPreference', value)
}

const LOCALE_VALUES = ['system', ...allLocales]

const localeNames = computed(() => [
  t('Settings.General Settings.System Default'),
  ...process.env.LOCALE_NAMES
])

/** @type {import('vue').ComputedRef<string>} */
const currentLocale = computed(() => store.getters.getCurrentLocale)

/**
 * @param {string} value
 */
function updateCurrentLocale(value) {
  store.dispatch('updateCurrentLocale', value)
}

/** @type {import('vue').ComputedRef<string[]>} */
const regionNames = computed(() => store.getters.getRegionNames)

/** @type {import('vue').ComputedRef<string[]>} */
const regionValues = computed(() => store.getters.getRegionValues)

const regionDataLoaded = computed(() => regionValues.value.length > 0)

/** @type {import('vue').ComputedRef<string>} */
const region = computed(() => store.getters.getRegion)

/**
 * @param {string} value
 */
function updateRegion(value) {
  store.dispatch('updateRegion', value)
}

const EXTERNAL_LINK_HANDLING_VALUES = ['', 'openLinkAfterPrompt', 'doNothing']

const externalLinkHandlingNames = computed(() => [
  t('Settings.General Settings.External Link Handling.Open Link'),
  t('Settings.General Settings.External Link Handling.Ask Before Opening Link'),
  t('Settings.General Settings.External Link Handling.No Action')
])

/** @type {import('vue').ComputedRef<'' | 'openLinkAfterPrompt' | 'doNothing'>} */
const externalLinkHandling = computed(() => store.getters.getExternalLinkHandling)

/**
 * @param {'' | 'openLinkAfterPrompt' | 'doNothing'} value
 */
function updateExternalLinkHandling(value) {
  store.dispatch('updateExternalLinkHandling', value)
}

/** @type {import('vue').ComputedRef<string[]>} */
const invidiousInstancesList = computed(() => store.getters.getInvidiousInstancesList)

/** @type {import('vue').ComputedRef<string>} */
const currentInvidiousInstance = computed(() => store.getters.getCurrentInvidiousInstance)

onBeforeUnmount(() => {
  if (currentInvidiousInstance.value === '') {
    // FIXME: If we call an action from here, there's no guarantee it will finish
    // before the component is destroyed, which could bring up some problems
    // Since I can't see any way to await it (because lifecycle hooks must be
    // synchronous), unfortunately, we have to copy/paste the logic
    // from the `setRandomCurrentInvidiousInstance` action onto here
    // Fix when we migrate to Pinia
    const instanceList = invidiousInstancesList.value
    store.commit('setCurrentInvidiousInstance', randomArrayItem(instanceList))
  }
})

const setCurrentInvidiousInstanceBounce = debounce((/** @type {string} */instance) => {
  store.commit('setCurrentInvidiousInstance', instance)
}, 500)

/**
 * @param {string} input
 */
function handleInvidiousInstanceInput(input) {
  let instance = input
  // If NOT something like https:// (1-2 slashes), remove trailing slash
  if (!/^https?:\/{1,2}$/.test(input)) {
    instance = input.replace(/\/$/, '')
  }

  setCurrentInvidiousInstanceBounce(instance)
}

/** @type {import('vue').ComputedRef<string>} */
const defaultInvidiousInstance = computed(() => store.getters.getDefaultInvidiousInstance)

function handleSetDefaultInstanceClick() {
  const instance = currentInvidiousInstance.value
  store.dispatch('updateDefaultInvidiousInstance', instance)

  const message = t('Default Invidious instance has been set to {instance}', { instance })
  showToast(message)
}

function handleClearDefaultInstanceClick() {
  store.dispatch('updateDefaultInvidiousInstance', '')
  showToast(t('Default Invidious instance has been cleared'))
}
</script>

<style scoped src="./GeneralSettings.css" />
