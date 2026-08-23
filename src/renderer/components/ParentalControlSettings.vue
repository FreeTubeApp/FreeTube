<template>
  <FtSettingsSection
    id="parental-control"
    :title="$t('Settings.Parental Control Settings.Parental Control Settings')"
  >
    <div class="switchColumnGrid">
      <div class="switchColumn">
        <FtPageFilterItem
          id="setting-hide-unsubscribe-button"
          :keyword="$t('Settings.Parental Control Settings.Hide Unsubscribe Button')"
        >
          <FtToggleSwitch
            :label="$t('Settings.Parental Control Settings.Hide Unsubscribe Button')"
            compact
            :default-value="hideUnsubscribeButton"
            @change="updateHideUnsubscribeButton"
          />
        </FtPageFilterItem>
        <FtPageFilterItem
          id="setting-show-family-friendly-only"
          :keyword="$t('Settings.Parental Control Settings.Show Family Friendly Only')"
        >
          <FtToggleSwitch
            :label="$t('Settings.Parental Control Settings.Show Family Friendly Only')"
            compact
            :default-value="showFamilyFriendlyOnly"
            @change="updateShowFamilyFriendlyOnly"
          />
        </FtPageFilterItem>
        <FtPageFilterItem
          id="setting-disable-channel-links"
          :keyword="$t('Settings.Parental Control Settings.Disable Channel Links')"
        >
          <FtToggleSwitch
            :label="$t('Settings.Parental Control Settings.Disable Channel Links')"
            compact
            :default-value="disableChannelLinks"
            @change="updateDisableChannelLinks"
          />
        </FtPageFilterItem>
      </div>
      <div class="switchColumn">
        <FtPageFilterItem
          id="setting-hide-search-bar"
          :keyword="$t('Settings.Parental Control Settings.Hide Search Bar')"
        >
          <FtToggleSwitch
            :label="$t('Settings.Parental Control Settings.Hide Search Bar')"
            compact
            :default-value="hideSearchBar"
            @change="updateHideSearchBar"
          />
        </FtPageFilterItem>
        <FtPageFilterItem
          id="setting-hide-uploader-on-watch-page"
          :keyword="$t('Settings.Parental Control Settings.Hide Uploader on Watch page')"
        >
          <FtToggleSwitch
            :label="$t('Settings.Parental Control Settings.Hide Uploader on Watch page')"
            compact
            :default-value="hideUploader"
            @change="updateHideUploader"
          />
        </FtPageFilterItem>
      </div>
    </div>
  </FtSettingsSection>
</template>

<script setup>
import { computed } from 'vue'

import FtSettingsSection from './FtSettingsSection/FtSettingsSection.vue'
import FtToggleSwitch from './FtToggleSwitch/FtToggleSwitch.vue'
import FtPageFilterItem from './FtPageFilterItem/FtPageFilterItem.vue'

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

const disableChannelLinks = computed(() => {
  return store.getters.getDisableChannelLinks
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

/**
 * @param {boolean} value
 */
function updateDisableChannelLinks(value) {
  store.dispatch('updateDisableChannelLinks', value)
}
</script>
