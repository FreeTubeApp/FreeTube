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
        @change="val => {
          updateExternalPlayer(val);
          updateExternalPlayerExecutable('');
        }"
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
import FtSelect from './ft-select/ft-select.vue'
import FtInput from './ft-input/ft-input.vue'
import FtToggleSwitch from './ft-toggle-switch/ft-toggle-switch.vue'
import FtFlexBox from './ft-flex-box/ft-flex-box.vue'
import FtInputTags from './ft-input-tags/ft-input-tags.vue'

import store from '../store/index'

import jsonData from '../../../static/external-player-map.json'

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
 * Replace any %VAR% tokens (like %Program Files%) in a path string with the corresponding process.env.VAR value.
 * @param {string} str
 * @returns {string}
 */
function expandEnvVars(str) {
  return str.replaceAll(/%([^%]+)%/g, (_, name) => process.env[name] || '')
}

/**
 * Detect os
 * @returns {'Windows'|'macOS'|'Linux'|'Unknown'}
 */
function detectOS() {
  // first try client hints
  const uaData = navigator.userAgentData
  if (uaData?.platform) {
    const plat = uaData.platform.toLowerCase()
    if (plat.includes('win')) return 'Windows'
    if (plat.includes('mac')) return 'macOS'
    if (plat.includes('linux')) return 'Linux'
  }
  // then fallback to ua
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('windows nt')) return 'Windows'
  if (ua.includes('mac os x')) return 'macOS'
  if (ua.includes('linux')) return 'Linux'

  return 'Unknown'
}
/**
 * @param {string} value
 */
// gets default path for the external player, sets it as default for the executable
// first checks if the user has set a custom path, if not, gets the default path
function updateExternalPlayerExecutable(value) {
  if (value && value.trim() !== '') {
    store.dispatch('updateExternalPlayerExecutable', value)
  } else {
    const playerData = jsonData.find(p => p.value === externalPlayer.value)
    if (playerData && playerData.cmdArguments) {
      const os = detectOS()
      let defaultPath = ''
      if (os === 'Windows') {
        defaultPath = expandEnvVars(playerData.cmdArguments.windowsPath)
      } else if (os === 'macOS') {
        defaultPath = playerData.cmdArguments.macPath
      } else if (os === 'Linux') {
        defaultPath = playerData.cmdArguments.linuxPath
      }

      console.warn('[updateExternalPlayerExecutable] playerData=', playerData)
      console.warn('[updateExternalPlayerExecutable] detected OS=', os)

      store.dispatch(
        'updateExternalPlayerExecutable',
        defaultPath || ''
      )
    }
  }
}
/**
 * @param {string[]} args
 */
function handleExternalPlayerCustomArgs(args) {
  store.dispatch('updateExternalPlayerCustomArgs', JSON.stringify(args))
}
</script>
