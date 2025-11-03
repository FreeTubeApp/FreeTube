<template>
  <FtSettingsSection
    :title="$t('Settings.External Player Settings.External Player Settings')"
  >
    <FtFlexBox>
      <FtSelect
        :placeholder="$t('Settings.External Player Settings.External Player')"
        :value="externalPlayer"
        :select-names="externalPlayerNames"
        :select-values="externalPlayerValues"
        :tooltip="$t('Tooltips.External Player Settings.External Player')"
        :icon="['fas', 'external-link-alt']"
        @change="updateExternalPlayer"
      />
    </FtFlexBox>
    <FtFlexBox>
      <FtToggleSwitch
        :label="$t('Settings.External Player Settings.Ignore Unsupported Action Warnings')"
        :default-value="externalPlayerIgnoreWarnings"
        :disabled="externalPlayer === ''"
        :compact="true"
        :tooltip="$t('Tooltips.External Player Settings.Ignore Warnings')"
        @change="updateExternalPlayerIgnoreWarnings"
      />
      <FtToggleSwitch
        :label="$t('Settings.External Player Settings.Ignore Default Arguments')"
        :default-value="externalPlayerIgnoreDefaultArgs"
        :disabled="externalPlayer === ''"
        :compact="true"
        :tooltip="$t('Tooltips.External Player Settings.Ignore Default Arguments')"
        @change="updateExternalPlayerIgnoreDefaultArgs"
      />
    </FtFlexBox>
    <FtFlexBox
      v-if="externalPlayer !== ''"
      class="settingsFlexStart460px"
    >
      <FtInput
        :placeholder="$t('Settings.External Player Settings.Custom External Player Executable')"
        :show-action-button="false"
        :show-label="true"
        :value="externalPlayerExecutable"
        :tooltip="$t('Tooltips.External Player Settings.Custom External Player Executable')"
        @input="updateExternalPlayerExecutable"
      />
    </FtFlexBox>
    <FtFlexBox
      v-if="externalPlayer !== ''"
    >
      <FtInputTags
        :label="$t('Settings.External Player Settings.Custom External Player Arguments')"
        :tag-name-placeholder="$t('Settings.External Player Settings.Custom External Player Arguments')"
        :tag-list="externalPlayerCustomArgs"
        :tooltip="externalPlayerCustomArgsTooltip"
        @change="handleExternalPlayerCustomArgs"
      />
    </FtFlexBox>
  </FtSettingsSection>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '../composables/use-i18n-polyfill'

import FtSettingsSection from './FtSettingsSection/FtSettingsSection.vue'
import FtSelect from './FtSelect/FtSelect.vue'
import FtInput from './ft-input/ft-input.vue'
import FtToggleSwitch from './FtToggleSwitch/FtToggleSwitch.vue'
import FtFlexBox from './ft-flex-box/ft-flex-box.vue'
import FtInputTags from './FtInputTags/FtInputTags.vue'

import store from '../store/index'

const { t } = useI18n()

/** @type {import('vue').ComputedRef<string>} */
const externalPlayer = computed(() => store.getters.getExternalPlayer)

/** @type {import('vue').ComputedRef<string[]>} */
const externalPlayerNames = computed(() => {
  return store.getters.getExternalPlayerNames.map((name) => {
    return name === 'None'
      ? t('Settings.External Player Settings.Players.None.Name')
      : name
  })
})

/** @type {import('vue').ComputedRef<string[]>} */
const externalPlayerValues = computed(() => store.getters.getExternalPlayerValues)

/** @type {import('vue').ComputedRef<string>} */
const externalPlayerExecutable = computed(() => store.getters.getExternalPlayerExecutable)

/** @type {import('vue').ComputedRef<boolean>} */
const externalPlayerIgnoreWarnings = computed(() => store.getters.getExternalPlayerIgnoreWarnings)

/** @type {import('vue').ComputedRef<boolean>} */
const externalPlayerIgnoreDefaultArgs = computed(() => store.getters.getExternalPlayerIgnoreDefaultArgs)

/** @type {import('vue').ComputedRef<string[]>} */
const externalPlayerCustomArgs = computed(() => JSON.parse(store.getters.getExternalPlayerCustomArgs))

const externalPlayerCustomArgsTooltip = computed(() => {
  const tooltip = t('Tooltips.External Player Settings.Custom External Player Arguments')

  const cmdArgs = store.getters.getExternalPlayerCmdArguments[externalPlayer.value]
  if (cmdArgs && typeof cmdArgs.defaultCustomArguments === 'string' && cmdArgs.defaultCustomArguments !== '') {
    const defaultArgs = t(
      'Tooltips.External Player Settings.DefaultCustomArgumentsTemplate',
      {
        defaultCustomArguments: cmdArgs.defaultCustomArguments
      })
    return `${tooltip} ${defaultArgs}`
  }

  return tooltip
})

/**
 * @param {string} value
 */
function updateExternalPlayer(value) {
  store.dispatch('updateExternalPlayer', value)
}

/**
 * @param {boolean} value
 */
function updateExternalPlayerIgnoreWarnings(value) {
  store.dispatch('updateExternalPlayerIgnoreWarnings', value)
}

/**
 * @param {boolean} value
 */
function updateExternalPlayerIgnoreDefaultArgs(value) {
  store.dispatch('updateExternalPlayerIgnoreDefaultArgs', value)
}

/**
 * @param {string} value
 */
function updateExternalPlayerExecutable(value) {
  store.dispatch('updateExternalPlayerExecutable', value)
}

/**
 * @param {string[]} args
 */
function handleExternalPlayerCustomArgs(args) {
  store.dispatch('updateExternalPlayerCustomArgs', JSON.stringify(args))
}
</script>
