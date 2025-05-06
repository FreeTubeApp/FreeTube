<template>
  <FtSettingsSection
    :title="$t('Settings.Experimental Settings.Experimental Settings')"
  >
    <p class="experimental-warning">
      {{ $t('Settings.Experimental Settings.Warning') }}
    </p>
    <FtFlexBox>
      <FtToggleSwitch
        tooltip-position="top"
        :label="$t('Settings.Experimental Settings.Replace HTTP Cache')"
        compact
        :default-value="replaceHttpCache"
        :disabled="replaceHttpCacheLoading"
        :tooltip="$t('Tooltips.Experimental Settings.Replace HTTP Cache')"
        @change="handleReplaceHttpCacheRestartPrompt"
      />
      <FtToggleSwitch
        tooltip-position="top"
        :label="$t('Settings.Experimental Settings.Disable Hardware Media Keys')"
        compact
        :default-value="disableHardwareMediaKeys"
        :disabled="disableHardwareMediaKeysLoading"
        :tooltip="$t('Tooltips.Experimental Settings.Disable Hardware Media Keys')"
        @change="handleDisableHardwareMediaKeysRestartPrompt"
      />
    </FtFlexBox>
    <FtPrompt
      v-if="showRestartPrompt"
      :label="$t('Settings[\'The app needs to restart for changes to take effect. Restart and apply change?\']')"
      :option-names="[$t('Yes, Restart'), $t('Cancel')]"
      :option-values="['restart', 'cancel']"
      @click="handleRestart"
    />
  </FtSettingsSection>
</template>

<script setup>
import { onMounted, ref } from 'vue'

import FtSettingsSection from '../FtSettingsSection/FtSettingsSection.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'
import FtPrompt from '../FtPrompt/FtPrompt.vue'

import { IpcChannels } from '../../../constants'

const replaceHttpCacheLoading = ref(true)
const replaceHttpCache = ref(false)
const disableHardwareMediaKeys = ref(false)
const disableHardwareMediaKeysLoading = ref(false)
const showRestartPrompt = ref(false)
const toggleEvent = ref(undefined)

onMounted(async () => {
  if (process.env.IS_ELECTRON) {
    const { ipcRenderer } = require('electron')
    replaceHttpCache.value = await ipcRenderer.invoke(IpcChannels.GET_REPLACE_HTTP_CACHE)
    disableHardwareMediaKeys.value = await ipcRenderer.invoke(IpcChannels.GET_DISABLE_HARDWARE_MEDIA_KEYS)
  }

  replaceHttpCacheLoading.value = false
  disableHardwareMediaKeysLoading.value = false
})

/**
 * @param {boolean} value
 */
function handleReplaceHttpCacheRestartPrompt(value) {
  replaceHttpCache.value = value
  toggleEvent.value = IpcChannels.TOGGLE_REPLACE_HTTP_CACHE
  showRestartPrompt.value = true
}

/**
 * @param {boolean} value
 */
function handleDisableHardwareMediaKeysRestartPrompt(value) {
  disableHardwareMediaKeys.value = value
  toggleEvent.value = IpcChannels.TOGGLE_DISABLE_HARDWARE_MEDIA_KEYS
  showRestartPrompt.value = true
}

/**
 * @param {'restart' | 'cancel' | null} value
 */
function handleRestart(value) {
  showRestartPrompt.value = false

  if (toggleEvent.value === null || toggleEvent.value === '') {
    return
  }

  if (toggleEvent.value === IpcChannels.TOGGLE_REPLACE_HTTP_CACHE) {
    if (value === null || value === 'cancel') {
      replaceHttpCache.value = !replaceHttpCache.value
      toggleEvent.value = null
      return
    }
  } else if (toggleEvent.value === IpcChannels.TOGGLE_DISABLE_HARDWARE_MEDIA_KEYS) {
    if (value === null || value === 'cancel') {
      disableHardwareMediaKeys.value = !disableHardwareMediaKeys.value
      toggleEvent.value = null
      return
    }
  } else {
    return
  }

  if (process.env.IS_ELECTRON) {
    const { ipcRenderer } = require('electron')
    ipcRenderer.send(toggleEvent.value)
  }
}
</script>

<style scoped src="./ExperimentalSettings.css" />
