<template>
  <FtSettingsSection
    :title="$t('Settings.Privacy Settings.Privacy Settings')"
  >
    <div class="switchColumnGrid">
      <div class="switchColumn">
        <FtToggleSwitch
          :label="$t('Settings.Privacy Settings.Remember History')"
          compact
          :default-value="rememberHistory"
          @change="handleRememberHistory"
        />
      </div>
      <div class="switchColumn">
        <FtToggleSwitch
          :label="$t('Settings.Privacy Settings.Remember Search History')"
          compact
          :default-value="rememberSearchHistory"
          @change="updateRememberSearchHistory"
        />
      </div>
      <div class="switchColumn">
        <FtToggleSwitch
          :label="$t('Settings.Privacy Settings.Save Watched Videos With Last Viewed Playlist')"
          compact
          :disabled="!rememberHistory"
          :default-value="saveVideoHistoryWithLastViewedPlaylist"
          @change="updateSaveVideoHistoryWithLastViewedPlaylist"
        />
      </div>
    </div>
    <br>
    <FtFlexBox>
      <FtSelect
        :placeholder="$t('Settings.Privacy Settings.Save Watched Progress')"
        :value="watchedProgressSavingMode"
        :select-names="watchedProgressSavingModeNames"
        :select-values="WATCHED_PROGRESS_SAVING_MODE_VALUES"
        :icon="['fas', 'bars-progress']"
        :tooltip="$t('Settings.Privacy Settings.Watched Progress Saving Mode.Tooltip')"
        :disabled="!rememberHistory"
        @change="updateWatchedProgressSavingMode"
      />
    </FtFlexBox>
    <br>
    <h4
      class="groupTitle"
    >
      {{ t('Settings.Privacy Settings.Watch History Expiration') }}
    </h4>
    <div class="switchColumnGrid">
      <div class="switchColumn">
        <FtToggleSwitch
          :label="$t('Settings.Privacy Settings.Clean Watch History')"
          compact
          :default-value="watchHistoryEraserEnabled"
          :disabled="!rememberHistory || lifetimeOption === 'forever'"
          @change="handleWatchHistoryEraserChange"
        />
      </div>
      <div class="switchColumn">
        <FtToggleSwitch
          :label="$t('Settings.Privacy Settings.Clean Search History')"
          compact
          :default-value="searchHistoryEraserEnabled"
          :disabled="!rememberHistory || lifetimeOption === 'forever'"
          @change="handleSearchHistoryEraserChange"
        />
      </div>
    </div>
    <FtFlexBox>
      <FtSelect
        :placeholder="$t('Settings.Privacy Settings.Watch History Lifetime')"
        :value="lifetimeOption"
        :select-names="lifetimeOptionTranslations"
        :select-values="lifetimeOptions"
        :icon="['fas', 'clock']"
        :tooltip="$t('Settings.Privacy Settings.Watch History Lifetime Tooltip')"
        :disabled="!rememberHistory"
        @change="handleLifetimeChange"
      />
      <FtInput
        :placeholder="$t('Settings.Privacy Settings.Custom Lifetime Days')"
        label="Days"
        input-type="number"
        show-label
        :show-action-button="false"
        :value="String(lifetimeDays)"
        :disabled="!rememberHistory || lifetimeOption === 'forever'"
        @input="handleLifetimeDaysChange"
      />
      <FtInput
        :placeholder="$t('Settings.Privacy Settings.Custom Lifetime Hours')"
        label="Hours"
        input-type="number"
        show-label
        :show-action-button="false"
        :value="String(lifetimeHours)"
        :disabled="!rememberHistory || lifetimeOption === 'forever'"
        @input="handleLifetimeHoursChange"
      />
      <FtInput
        :placeholder="$t('Settings.Privacy Settings.Custom Lifetime Minutes')"
        label="Minutes"
        input-type="number"
        show-label
        :show-action-button="false"
        :value="String(lifetimeMinutes)"
        :disabled="!rememberHistory || lifetimeOption === 'forever'"
        @input="handleLifetimeMinutesChange"
      />
    </FtFlexBox>
    <FtFlexBox>
      <FtInput
        :placeholder="$t('Settings.Privacy Settings.Timer Interval')"
        input-type="number"
        show-label
        :show-action-button="false"
        :value="String(expiryTimerInterval)"
        :disabled="!rememberHistory || lifetimeOption === 'forever'"
        @input="handleTimerIntervalChange"
      />
    </FtFlexBox>
    <br>
    <FtFlexBox>
      <FtButton
        :label="$t('Settings.Privacy Settings.Clear Search History and Cache')"
        text-color="var(--destructive-text-color)"
        background-color="var(--destructive-color)"
        :icon="['fas', 'trash']"
        @click="showSearchCachePrompt = true"
      />
      <FtButton
        :label="$t('Settings.Privacy Settings.Remove Watch History')"
        text-color="var(--destructive-text-color)"
        background-color="var(--destructive-color)"
        :icon="['fas', 'trash']"
        @click="showRemoveHistoryPrompt = true"
      />
      <FtButton
        :label="$t('Settings.Privacy Settings.Remove All Subscriptions / Profiles')"
        text-color="var(--destructive-text-color)"
        background-color="var(--destructive-color)"
        :icon="['fas', 'trash']"
        @click="showRemoveSubscriptionsPrompt = true"
      />
      <FtButton
        :label="$t('Settings.Privacy Settings.Remove All Playlists')"
        text-color="var(--destructive-text-color)"
        background-color="var(--destructive-color)"
        :icon="['fas', 'trash']"
        @click="showRemovePlaylistsPrompt = true"
      />
      <FtFlexBox>
        <FtButton
          :label="$t('Settings.Privacy Settings.Delete Expired History Now')"
          text-color="var(--destructive-text-color)"
          background-color="var(--destructive-color)"
          :icon="['fas', 'trash']"
          @click="handleDeleteExpiredNow"
        />
      </FtFlexBox>
    </FtFlexBox>
    <FtPrompt
      v-if="showSearchCachePrompt"
      :label="$t('Settings.Privacy Settings.Are you sure you want to clear out your search history and cache?')"
      :option-names="promptNames"
      :option-values="PROMPT_VALUES"
      is-first-option-destructive
      @click="handleSearchCache"
    />
    <FtPrompt
      v-if="showRemoveHistoryPrompt"
      :label="$t('Settings.Privacy Settings.Are you sure you want to remove your entire watch history?')"
      :option-names="promptNames"
      :option-values="PROMPT_VALUES"
      is-first-option-destructive
      @click="handleRemoveHistory"
    />
    <FtPrompt
      v-if="showRemoveSubscriptionsPrompt"
      :label="removeSubscriptionsPromptMessage"
      :option-names="promptNames"
      :option-values="PROMPT_VALUES"
      is-first-option-destructive
      @click="handleRemoveSubscriptions"
    />
    <FtPrompt
      v-if="showRemovePlaylistsPrompt"
      :label="$t('Settings.Privacy Settings.Are you sure you want to remove all your playlists?')"
      :option-names="promptNames"
      :option-values="PROMPT_VALUES"
      is-first-option-destructive
      @click="handleRemovePlaylists"
    />
  </FtSettingsSection>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import FtButton from './FtButton/FtButton.vue'
import FtFlexBox from './ft-flex-box/ft-flex-box.vue'
import FtInput from './FtInput/FtInput.vue'
import FtPrompt from './FtPrompt/FtPrompt.vue'
import FtSelect from './FtSelect/FtSelect.vue'
import FtSettingsSection from './FtSettingsSection/FtSettingsSection.vue'
import FtToggleSwitch from './FtToggleSwitch/FtToggleSwitch.vue'

import store from '../store/index'

import { MAIN_PROFILE_ID } from '../../constants'
import { showToast } from '../helpers/utils'

const { t } = useI18n()

const PROMPT_VALUES = ['delete', 'cancel']
const promptNames = computed(() => [
  t('Yes, Delete'),
  t('Cancel')
])

const removeSubscriptionsPromptMessage = computed(() => {
  return t('Settings.Privacy Settings["Are you sure you want to remove all subscriptions and profiles?  This cannot be undone."]')
})

/** @type {import('vue').ComputedRef<boolean>} */
const rememberHistory = computed(() => store.getters.getRememberHistory)

/**
 * @param {boolean} value
 */
function handleRememberHistory(value) {
  if (!value) {
    store.dispatch('updateWatchedProgressSavingMode', 'never')
  }

  store.dispatch('updateRememberHistory', value)
}

/** @type {import('vue').ComputedRef<boolean>} */
const rememberSearchHistory = computed(() => store.getters.getRememberSearchHistory)

/**
 * @param {boolean} value
 */
function updateRememberSearchHistory(value) {
  store.dispatch('updateRememberSearchHistory', value)
}

/** @type {import('vue').ComputedRef<boolean>} */
const saveVideoHistoryWithLastViewedPlaylist = computed(() => store.getters.getSaveVideoHistoryWithLastViewedPlaylist)

/**
 * @param {boolean} value
 */
function updateSaveVideoHistoryWithLastViewedPlaylist(value) {
  store.dispatch('updateSaveVideoHistoryWithLastViewedPlaylist', value)
}

const WATCHED_PROGRESS_SAVING_MODE_VALUES = ['auto', 'semi-auto', 'never']
const watchedProgressSavingModeNames = computed(() => [
  t('Settings.Privacy Settings.Watched Progress Saving Mode.Modes.Auto'),
  t('Settings.Privacy Settings.Watched Progress Saving Mode.Modes.Semi-auto'),
  t('Settings.Privacy Settings.Watched Progress Saving Mode.Modes.Never')
])

/** @type {import('vue').ComputedRef<'auto' | 'semi-auto' | 'never'>} */
const watchedProgressSavingMode = computed(() => store.getters.getWatchedProgressSavingMode)

/**
 * @param {'auto' | 'semi-auto' | 'never'} value
 */
function updateWatchedProgressSavingMode(value) {
  store.dispatch('updateWatchedProgressSavingMode', value)
}

/** @type {{ readonly [key: string]: number }} */
const lifetimeOptionsTable = Object.freeze({
  forever: 0,
  '1hour': 60 * 60,
  '24hours': 60 * 60 * 24,
  '7days': 60 * 60 * 24 * 7,
  '30days': 60 * 60 * 24 * 30,
})

const lifetimeOptions = Object.keys(lifetimeOptionsTable).concat('custom')
const lifetimeOptionTranslations = computed(() => [
  t('Settings.Privacy Settings.Lifetime Options.Forever'),
  t('Settings.Privacy Settings.Lifetime Options.1 Hour'),
  t('Settings.Privacy Settings.Lifetime Options.24 Hours'),
  t('Settings.Privacy Settings.Lifetime Options.7 Days'),
  t('Settings.Privacy Settings.Lifetime Options.30 Days'),
  t('Settings.Privacy Settings.Lifetime Options.Custom')
])

/** @type {import('vue').ComputedRef<string>} */
const lifetimeOption = computed(() => {
  const lifetimeSeconds = store.getters.getWatchHistoryLifetimeSeconds
  return Object.entries(lifetimeOptionsTable).find(
    ([_, seconds]) => seconds === lifetimeSeconds
  )?.[0] ?? 'custom'
})

/** @type {import('vue').ComputedRef<number>} */
const lifetimeDays = computed(() => Math.floor(store.getters.getWatchHistoryLifetimeSeconds / 86400))

/** @type {import('vue').ComputedRef<number>} */
const lifetimeHours = computed(() => Math.floor((store.getters.getWatchHistoryLifetimeSeconds % 86400) / 3600))

/** @type {import('vue').ComputedRef<number>} */
const lifetimeMinutes = computed(() => Math.floor((store.getters.getWatchHistoryLifetimeSeconds % 3600) / 60))

/**
 * @param {string} value
 */
function handleLifetimeChange(value) {
  if (value === 'custom') {
    // If coming from 'forever' (0), seed the custom fields with a sensible default
    // so that selecting Custom is not a silent no-op
    if (store.getters.getWatchHistoryLifetimeSeconds === 0) {
      updateCustomLifetime(30, 0, 0)
    } else {
      updateCustomLifetime(lifetimeDays.value, lifetimeHours.value, lifetimeMinutes.value)
    }
  } else {
    store.dispatch('updateWatchHistoryLifetimeSeconds', lifetimeOptionsTable[value])
  }

  // A non-forever lifetime requires at least one eraser to be enabled
  if (lifetimeOptionsTable[value] > 0 && !store.getters.getWatchHistoryEraserEnabled && !store.getters.getSearchHistoryEraserEnabled) {
    store.dispatch('updateWatchHistoryEraserEnabled', true)
    store.dispatch('updateSearchHistoryEraserEnabled', true)
  }
}

/**
 * @param {string} value
 */
function handleLifetimeDaysChange(value) {
  updateCustomLifetime(parseInt(value, 10), lifetimeHours.value, lifetimeMinutes.value)
}

/**
 * @param {string} value
 */
function handleLifetimeHoursChange(value) {
  updateCustomLifetime(lifetimeDays.value, parseInt(value, 10), lifetimeMinutes.value)
}

/**
 * @param {string} value
 */
function handleLifetimeMinutesChange(value) {
  updateCustomLifetime(lifetimeDays.value, lifetimeHours.value, parseInt(value, 10))
}

/**
 * @param {number} days
 * @param {number} hours
 * @param {number} minutes
 */
function updateCustomLifetime(days, hours, minutes) {
  const d = isNaN(days) ? 0 : days
  const h = isNaN(hours) ? 0 : hours
  const m = isNaN(minutes) ? 0 : minutes
  const totalSeconds = d * 86400 + h * 3600 + m * 60
  store.dispatch('updateWatchHistoryLifetimeSeconds', totalSeconds)
}

/** @type {import('vue').ComputedRef<boolean>} */
const watchHistoryEraserEnabled = computed(() => store.getters.getWatchHistoryEraserEnabled)

/** @type {import('vue').ComputedRef<boolean>} */
const searchHistoryEraserEnabled = computed(() => store.getters.getSearchHistoryEraserEnabled)

/**
 * @param {boolean} value
 */
async function handleWatchHistoryEraserChange(value) {
  await store.dispatch('updateWatchHistoryEraserEnabled', value)
  ensureLifetimeActive()
}

/**
 * @param {boolean} value
 */
async function handleSearchHistoryEraserChange(value) {
  await store.dispatch('updateSearchHistoryEraserEnabled', value)
  ensureLifetimeActive()
}

/**
 * If both erasers are disabled, reset lifetime to 'forever'
 */
function ensureLifetimeActive() {
  if (!store.getters.getWatchHistoryEraserEnabled && !store.getters.getSearchHistoryEraserEnabled) {
    store.dispatch('updateWatchHistoryLifetimeSeconds', 0)
  }
}

/** @type {import('vue').ComputedRef<number>} */
const expiryTimerInterval = computed(() => store.getters.getWatchHistoryEraseTimerIntervalSeconds)

/**
 * @param {string} value
 */
function handleTimerIntervalChange(value) {
  const num = parseInt(value, 10)
  if (isNaN(num) || num < 60) {
    showToast(t('Settings.Privacy Settings.Timer Interval Too Short'))
    return
  }
  store.dispatch('updateWatchHistoryEraseTimerIntervalSeconds', num)
}

async function handleDeleteExpiredNow() {
  if (store.getters.getWatchHistoryEraserEnabled) {
    await store.dispatch('removeExpiredWatchHistory')
  }
  if (store.getters.getSearchHistoryEraserEnabled) {
    await store.dispatch('removeExpiredSearchHistory')
  }
}

const showSearchCachePrompt = ref(false)

/**
 * @param {'delete' | 'cancel' | null} option
 */
function handleSearchCache(option) {
  showSearchCachePrompt.value = false

  if (option !== 'delete') { return }

  store.dispatch('clearSessionSearchHistory')
  store.dispatch('removeAllSearchHistoryEntries')
  showToast(t('Settings.Privacy Settings.Search history and cache have been cleared'))
}

const showRemoveHistoryPrompt = ref(false)

/**
 * @param {'delete' | 'cancel' | null} option
 */
function handleRemoveHistory(option) {
  showRemoveHistoryPrompt.value = false

  if (option !== 'delete') { return }

  store.dispatch('removeAllHistory')
  showToast(t('Settings.Privacy Settings.Watch history has been cleared'))
}

const showRemoveSubscriptionsPrompt = ref(false)

const profileList = computed(() => store.getters.getProfileList)

/**
 * @param {'delete' | 'cancel' | null} option
 */
function handleRemoveSubscriptions(option) {
  showRemoveSubscriptionsPrompt.value = false

  if (option !== 'delete') { return }

  store.dispatch('updateActiveProfile', MAIN_PROFILE_ID)

  profileList.value.forEach((profile) => {
    if (profile._id === MAIN_PROFILE_ID) {
      const newProfile = {
        _id: MAIN_PROFILE_ID,
        name: profile.name,
        bgColor: profile.bgColor,
        textColor: profile.textColor,
        subscriptions: []
      }
      store.dispatch('updateProfile', newProfile)
    } else {
      store.dispatch('removeProfile', profile._id)
    }
  })

  store.dispatch('clearSubscriptionsCache')
}

const showRemovePlaylistsPrompt = ref(false)

/**
 * @param {'delete' | 'cancel' | null} option
 */
function handleRemovePlaylists(option) {
  showRemovePlaylistsPrompt.value = false

  if (option !== 'delete') { return }

  store.dispatch('removeAllPlaylists')
  store.dispatch('updateQuickBookmarkTargetPlaylistId', 'favorites')
  showToast(t('Settings.Privacy Settings.All playlists have been removed'))
}
</script>
