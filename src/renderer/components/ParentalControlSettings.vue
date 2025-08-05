<template>
  <FtSettingsSection
    :title="$t('Settings.Parental Control Settings.Parental Control Settings')"
  >
    <div class="switchColumnGrid">
      <div class="switchColumn">
        <FtToggleSwitch
          :label="$t('Settings.Parental Control Settings.Hide Unsubscribe Button')"
          compact
          :default-value="hideUnsubscribeButton"
          @change="updateHideUnsubscribeButton"
        />
        <FtToggleSwitch
          :label="$t('Settings.Parental Control Settings.Show Family Friendly Only')"
          compact
          :default-value="showFamilyFriendlyOnly"
          @change="updateShowFamilyFriendlyOnly"
        />
      </div>
      <div class="switchColumn">
        <FtToggleSwitch
          :label="$t('Settings.Parental Control Settings.Hide Search Bar')"
          compact
          :default-value="hideSearchBar"
          @change="updateHideSearchBar"
        />
        <FtToggleSwitch
          :label="$t('Settings.Parental Control Settings.Hide Uploader on Watch page')"
          compact
          :default-value="hideUploader"
          @change="updateHideUploader"
        />
      </div>
    </div>
  </FtSettingsSection>
</template>

<script setup>
import { computed } from 'vue'

import FtSettingsSection from './FtSettingsSection/FtSettingsSection.vue'
import FtToggleSwitch from './FtToggleSwitch/FtToggleSwitch.vue'

import store from '../store/index'

const hideSearchBar = computed(() => {
  return store.getters.getHideSearchBar
})

const hideUnsubscribeButton = computed(() => {
  return store.getters.getHideUnsubscribeButton
})

const hideUploader = computed(() => {
  return store.getters.getHideUploader
})

const showFamilyFriendlyOnly = computed(() => {
  return store.getters.getShowFamilyFriendlyOnly
})

/**
 * @param {boolean} value
 */
function updateHideSearchBar(value) {
  store.dispatch('updateHideSearchBar', value)
}

/**
 * @param {boolean} value
 */
function updateHideUnsubscribeButton(value) {
  store.dispatch('updateHideUnsubscribeButton', value)
}

/**
 * @param {boolean} value
 */
function updateHideUploader(value) {
  store.dispatch('updateHideUploader', value)
}

/**
 * @param {boolean} value
 */
function updateShowFamilyFriendlyOnly(value) {
  store.dispatch('updateShowFamilyFriendlyOnly', value)
}
</script>
