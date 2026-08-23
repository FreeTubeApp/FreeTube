<template>
  <FtSettingsSection
    id="sponsor-block"
    :title="$t('Settings.SponsorBlock Settings.SponsorBlock Settings')"
  >
    <FtFlexBox class="settingsFlexStart500px">
      <FtPageFilterItem
        id="setting-enable-sponsorblock"
        :keyword="$t('Settings.SponsorBlock Settings.Enable SponsorBlock')"
      >
        <FtToggleSwitch
          :label="$t('Settings.SponsorBlock Settings.Enable SponsorBlock')"
          :default-value="useSponsorBlock"
          @change="handleUpdateSponsorBlock"
        />
      </FtPageFilterItem>
      <FtPageFilterItem
        id="setting-use-dearrow-titles"
        :keyword="$t('Settings.SponsorBlock Settings.UseDeArrowTitles')"
      >
        <FtToggleSwitch
          :label="$t('Settings.SponsorBlock Settings.UseDeArrowTitles')"
          :default-value="useDeArrowTitles"
          :tooltip="$t('Tooltips.SponsorBlock Settings.UseDeArrowTitles')"
          @change="handleUpdateUseDeArrowTitles"
        />
      </FtPageFilterItem>
      <FtPageFilterItem
        id="setting-use-dearrow-thumbnails"
        :keyword="$t('Settings.SponsorBlock Settings.UseDeArrowThumbnails')"
      >
        <FtToggleSwitch
          :label="$t('Settings.SponsorBlock Settings.UseDeArrowThumbnails')"
          :default-value="useDeArrowThumbnails"
          :tooltip="$t('Tooltips.SponsorBlock Settings.UseDeArrowThumbnails')"
          @change="handleUpdateUseDeArrowThumbnails"
        />
      </FtPageFilterItem>
    </FtFlexBox>
    <template
      v-if="useSponsorBlock || useDeArrowTitles || useDeArrowThumbnails"
    >
      <FtFlexBox
        v-if="useSponsorBlock"
        class="settingsFlexStart500px"
      >
        <FtPageFilterItem
          id="setting-notify-when-sponsor-segment-is-skipped"
          :keyword="$t('Settings.SponsorBlock Settings.Notify when sponsor segment is skipped')"
        >
          <FtToggleSwitch
            :label="$t('Settings.SponsorBlock Settings.Notify when sponsor segment is skipped')"
            :default-value="sponsorBlockShowSkippedToast"
            @change="handleUpdateSponsorBlockShowSkippedToast"
          />
        </FtPageFilterItem>
      </FtFlexBox>
      <FtFlexBox>
        <FtPageFilterItem
          id="setting-sponsorblock-api-url"
          :keyword="$t('Settings.SponsorBlock Settings[\'SponsorBlock API Url (Default is https://sponsor.ajay.app)\']')"
        >
          <FtInput
            ref="sponsorBlockUrlInput"
            :placeholder="$t('Settings.SponsorBlock Settings[\'SponsorBlock API Url (Default is https://sponsor.ajay.app)\']')"
            :show-action-button="false"
            :show-label="true"
            :value="sponsorBlockUrl"
            @blur="handleUpdateSponsorBlockUrl"
          />
        </FtPageFilterItem>
      </FtFlexBox>
      <FtFlexBox
        v-if="useDeArrowThumbnails"
      >
        <FtPageFilterItem
          id="setting-dearrow-thumbnail-generator-api-url"
          :keyword="$t('Settings.SponsorBlock Settings[\'DeArrow Thumbnail Generator API Url (Default is https://dearrow-thumb.ajay.app)\']')"
        >
          <FtInput
            v-if="useDeArrowThumbnails"
            ref="deArrowThumbnailGeneratorUrl"
            :placeholder="$t('Settings.SponsorBlock Settings[\'DeArrow Thumbnail Generator API Url (Default is https://dearrow-thumb.ajay.app)\']')"
            :show-action-button="false"
            :show-label="true"
            :value="deArrowThumbnailGeneratorUrl"
            @blur="handleUpdateDeArrowThumbnailGeneratorUrl"
          />
        </FtPageFilterItem>
      </FtFlexBox>

      <FtFlexBox
        v-if="useSponsorBlock"
      >
        <FtPageFilterItem
          id="setting-sponsorblock-categories"
          :keyword="$t('Settings.SponsorBlock Settings.SponsorBlock Settings')"
        >
          <FtSponsorBlockCategory
            v-for="category in CATEGORIES"
            :key="category"
            :category-name="category"
          />
        </FtPageFilterItem>
      </FtFlexBox>
    </template>
  </FtSettingsSection>
</template>

<script setup>
import { computed, useTemplateRef } from 'vue'

import FtSettingsSection from './FtSettingsSection/FtSettingsSection.vue'
import FtToggleSwitch from './FtToggleSwitch/FtToggleSwitch.vue'
import FtInput from './FtInput/FtInput.vue'
import FtFlexBox from './ft-flex-box/ft-flex-box.vue'
import FtSponsorBlockCategory from './FtSponsorBlockCategory/FtSponsorBlockCategory.vue'
import FtPageFilterItem from './FtPageFilterItem/FtPageFilterItem.vue'

import store from '../store/index'

const CATEGORIES = [
  'sponsor',
  'self-promotion',
  'interaction',
  'intro',
  'outro',
  'recap',
  'music offtopic',
  'filler'
]

/** @type {import('vue').ComputedRef<boolean>} */
const useSponsorBlock = computed(() => store.getters.getUseSponsorBlock)

/** @type {import('vue').ComputedRef<string>} */
const sponsorBlockUrl = computed(() => store.getters.getSponsorBlockUrl)

/** @type {import('vue').ComputedRef<boolean>} */
const sponsorBlockShowSkippedToast = computed(() => store.getters.getSponsorBlockShowSkippedToast)

/** @type {import('vue').ComputedRef<boolean>} */
const useDeArrowTitles = computed(() => store.getters.getUseDeArrowTitles)

/** @type {import('vue').ComputedRef<boolean>} */
const useDeArrowThumbnails = computed(() => store.getters.getUseDeArrowThumbnails)

/** @type {import('vue').ComputedRef<string>} */
const deArrowThumbnailGeneratorUrl = computed(() => store.getters.getDeArrowThumbnailGeneratorUrl)

const sponsorBlockUrlInputRef = useTemplateRef('sponsorBlockUrlInput')
const deArrowThumbnailGeneratorUrlRef = useTemplateRef('deArrowThumbnailGeneratorUrl')

/**
 * @param {boolean} value
 */
function handleUpdateSponsorBlock(value) {
  store.dispatch('updateUseSponsorBlock', value)
}

/**
 * @param {boolean} value
 */
function handleUpdateUseDeArrowTitles(value) {
  store.dispatch('updateUseDeArrowTitles', value)
}

/**
 * @param {boolean} value
 */
function handleUpdateUseDeArrowThumbnails(value) {
  store.dispatch('updateUseDeArrowThumbnails', value)
}

/**
 * @param {boolean} value
 */
function handleUpdateSponsorBlockShowSkippedToast(value) {
  store.dispatch('updateSponsorBlockShowSkippedToast', value)
}

/**
 * @param {string} value
 */
function handleUpdateSponsorBlockUrl(value) {
  const cleanValue = cleanupUrl(value)
  store.dispatch('updateSponsorBlockUrl', cleanValue)

  if (cleanValue !== value) {
    sponsorBlockUrlInputRef.value?.setText(cleanValue)
  }
}

/**
 * @param {string} value
 */
function handleUpdateDeArrowThumbnailGeneratorUrl(value) {
  const cleanValue = cleanupUrl(value)
  store.dispatch('updateDeArrowThumbnailGeneratorUrl', cleanValue)

  if (cleanValue !== value) {
    deArrowThumbnailGeneratorUrlRef.value?.setText(cleanValue)
  }
}

/**
 * @param {string} url
 */
function cleanupUrl(url) {
  return url
    .replace(/\/+$/, '')
    .replace(/\/api$/, '')
}
</script>
