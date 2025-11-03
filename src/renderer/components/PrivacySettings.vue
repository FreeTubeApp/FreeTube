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
import { useI18n } from '../composables/use-i18n-polyfill'

import FtButton from './FtButton/FtButton.vue'
import FtFlexBox from './ft-flex-box/ft-flex-box.vue'
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
