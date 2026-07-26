<template>
  <FtSettingsSection
    :title="$t('Settings.SponsorBlock Settings.SponsorBlock Settings')"
  >
    <FtFlexBox class="settingsFlexStart500px">
      <FtToggleSwitch
        :label="$t('Settings.SponsorBlock Settings.Enable SponsorBlock')"
        :default-value="useSponsorBlock"
        @change="handleUpdateSponsorBlock"
      />
      <FtToggleSwitch
        :label="$t('Settings.SponsorBlock Settings.UseDeArrowTitles')"
        :default-value="useDeArrowTitles"
        :tooltip="$t('Tooltips.SponsorBlock Settings.UseDeArrowTitles')"
        @change="handleUpdateUseDeArrowTitles"
      />
      <FtToggleSwitch
        :label="$t('Settings.SponsorBlock Settings.UseDeArrowThumbnails')"
        :default-value="useDeArrowThumbnails"
        :tooltip="$t('Tooltips.SponsorBlock Settings.UseDeArrowThumbnails')"
        @change="handleUpdateUseDeArrowThumbnails"
      />
    </FtFlexBox>
    <template
      v-if="useSponsorBlock || useDeArrowTitles || useDeArrowThumbnails"
    >
      <FtFlexBox
        v-if="useSponsorBlock"
        class="settingsFlexStart500px"
      >
        <FtToggleSwitch
          :label="$t('Settings.SponsorBlock Settings.Notify when sponsor segment is skipped')"
          :default-value="sponsorBlockShowSkippedToast"
          @change="handleUpdateSponsorBlockShowSkippedToast"
        />
      </FtFlexBox>
      <FtFlexBox>
        <FtInput
          ref="sponsorBlockUrlInput"
          :placeholder="$t('Settings.SponsorBlock Settings[\'SponsorBlock API Url (Default is https://sponsor.ajay.app)\']')"
          :show-action-button="false"
          :show-label="true"
          :value="sponsorBlockUrl"
          @blur="handleUpdateSponsorBlockUrl"
        />
      </FtFlexBox>
      <FtFlexBox>
        <FtInputTags
          :disabled="sponsorBlockChannelAllowedDisabled"
          :disabled-msg="t('Settings.SponsorBlock Settings.Allowed Channels Disabled Message')"
          :label="t('Settings.SponsorBlock Settings.Allowed Channels')"
          :tag-name-placeholder="t('Settings.SponsorBlock Settings.Allowed Channels Placeholder')"
          :tag-list="sponsorBlockChannelsAllowed"
          :tooltip="t('Tooltips.SponsorBlock Settings.Allowed Channels')"
          :validate-tag-name="checkYoutubeChannelId"
          :find-tag-info="findChannelTagInfoWrapper"
          :are-channel-tags="true"
          :show-tags="sponsorBlockShowAddedChannelsAllowed"
          @invalid-name="handleInvalidChannel"
          @error-find-tag-info="handleChannelAPIError"
          @change="handleSponsorBlockChannelsAllowed"
          @already-exists="handleChannelsExists"
          @toggle-show-tags="handleSponsorBlockShowAddedChannelsAllowed"
        />
      </FtFlexBox>
      <FtFlexBox
        v-if="useDeArrowThumbnails"
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
      </FtFlexBox>

      <FtFlexBox
        v-if="useSponsorBlock"
      >
        <FtSponsorBlockCategory
          v-for="category in CATEGORIES"
          :key="category"
          :category-name="category"
        />
      </FtFlexBox>
    </template>
  </FtSettingsSection>
</template>

<script setup>
import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import FtSettingsSection from './FtSettingsSection/FtSettingsSection.vue'
import FtToggleSwitch from './FtToggleSwitch/FtToggleSwitch.vue'
import FtInput from './FtInput/FtInput.vue'
import FtFlexBox from './ft-flex-box/ft-flex-box.vue'
import FtSponsorBlockCategory from './FtSponsorBlockCategory/FtSponsorBlockCategory.vue'
import FtInputTags from './FtInputTags/FtInputTags.vue'

import store from '../store/index'

import { showToast } from '../helpers/utils'
import { checkYoutubeChannelId, findChannelTagInfo } from '../helpers/channels.js'

const { t } = useI18n()

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

const sponsorBlockChannelAllowedDisabled = ref(false)

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

/** @type {import('vue').ComputedRef<any[]>} */
const sponsorBlockChannelsAllowed = computed(() => JSON.parse(store.getters.getSponsorBlockChannelsAllowed))

/** @type {import('vue').ComputedRef<boolean>} */
const sponsorBlockShowAddedChannelsAllowed = computed(() => store.getters.getSponsorBlockShowAddedChannelsAllowed)

/** @type {import('vue').ComputedRef<'local' | 'invidious'>} */
const backendPreference = computed(() => store.getters.getBackendPreference)

/** @type {import('vue').ComputedRef<boolean>} */
const backendFallback = computed(() => store.getters.getBackendFallback)

const backendOptions = computed(() => ({
  preference: backendPreference.value,
  fallback: backendFallback.value
}))

/**
 * @param {any[]} value
 */
function handleSponsorBlockChannelsAllowed(value) {
  store.dispatch('updateSponsorBlockChannelsAllowed', JSON.stringify(value))
}

function handleSponsorBlockShowAddedChannelsAllowed() {
  store.dispatch('updateSponsorBlockShowAddedChannelsAllowed', !sponsorBlockShowAddedChannelsAllowed.value)
}

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

function handleInvalidChannel() {
  showToast(t('Settings.SponsorBlock Settings.Allowed Channels Invalid'))
}

function handleChannelAPIError() {
  showToast(t('Settings.SponsorBlock Settings.Allowed Channels API Error'))
}

function handleChannelsExists() {
  showToast(t('Settings.SponsorBlock Settings.Allowed Channels Already Exists'))
}

/**
 * @param {string} url
 */
function cleanupUrl(url) {
  return url
    .replace(/\/+$/, '')
    .replace(/\/api$/, '')
}

/**
 * @param {string} text
 */
async function findChannelTagInfoWrapper(text) {
  return await findChannelTagInfo(text, backendOptions.value)
}

</script>
