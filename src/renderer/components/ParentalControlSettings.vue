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
      </div>
    </div>
  </FtSettingsSection>
</template>

<script setup>
import { computed } from 'vue'

import FtSettingsSection from './ft-settings-section/ft-settings-section.vue'
import FtToggleSwitch from './ft-toggle-switch/ft-toggle-switch.vue'

import store from '../store/index'

const hideSearchBar = computed(() => {
  return store.getters.getHideSearchBar
})

const hideUnsubscribeButton = computed(() => {
  return store.getters.getHideUnsubscribeButton
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
function updateShowFamilyFriendlyOnly(value) {
  store.dispatch('updateShowFamilyFriendlyOnly', value)
}
</script>
