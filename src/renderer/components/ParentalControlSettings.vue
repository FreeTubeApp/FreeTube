<template>
  <FtSettingsSection
    :title="$t('Settings.Parental Control Settings.Parental Control Settings')"
  >
    <div class="switchColumnGrid">
      <div class="switchColumn">
        <FtSetting
          id="hide-unsubscribe-button"
          :keyword="$t('Settings.Parental Control Settings.Hide Unsubscribe Button')"
        >
          <FtToggleSwitch
            :label="$t('Settings.Parental Control Settings.Hide Unsubscribe Button')"
            compact
            :default-value="hideUnsubscribeButton"
            @change="updateHideUnsubscribeButton"
          />
        </FtSetting>
        <FtSetting
          id="show-family-friendly-only"
          :keyword="$t('Settings.Parental Control Settings.Show Family Friendly Only')"
        >
          <FtToggleSwitch
            :label="$t('Settings.Parental Control Settings.Show Family Friendly Only')"
            compact
            :default-value="showFamilyFriendlyOnly"
            @change="updateShowFamilyFriendlyOnly"
          />
        </FtSetting>
        <FtSetting
          id="disable-channel-links"
          :keyword="$t('Settings.Parental Control Settings.Disable Channel Links')"
        >
          <FtToggleSwitch
            :label="$t('Settings.Parental Control Settings.Disable Channel Links')"
            compact
            :default-value="disableChannelLinks"
            @change="updateDisableChannelLinks"
          />
        </FtSetting>
      </div>
      <div class="switchColumn">
        <FtSetting
          id="hide-search-bar"
          :keyword="$t('Settings.Parental Control Settings.Hide Search Bar')"
        >
          <FtToggleSwitch
            :label="$t('Settings.Parental Control Settings.Hide Search Bar')"
            compact
            :default-value="hideSearchBar"
            @change="updateHideSearchBar"
          />
        </FtSetting>
        <FtSetting
          id="hide-uploader-on-watch-page"
          :keyword="$t('Settings.Parental Control Settings.Hide Uploader on Watch page')"
        >
          <FtToggleSwitch
            :label="$t('Settings.Parental Control Settings.Hide Uploader on Watch page')"
            compact
            :default-value="hideUploader"
            @change="updateHideUploader"
          />
        </FtSetting>
      </div>
    </div>
  </FtSettingsSection>
</template>

<script setup>
import { computed } from 'vue'

import FtSettingsSection from './FtSettingsSection/FtSettingsSection.vue'
import FtToggleSwitch from './FtToggleSwitch/FtToggleSwitch.vue'
import FtSetting from './FtSetting/FtSetting.vue'

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
