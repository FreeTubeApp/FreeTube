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
        :disabled="settingValuesLoading"
        :tooltip="$t('Tooltips.Experimental Settings.Replace HTTP Cache')"
        @change="handleReplaceHttpCacheChange"
      />
    </FtFlexBox>
    <FtFlexBox v-if="storeUserDataInAppFolderAllowedOnPlatform">
      <FtToggleSwitch
        tooltip-position="top"
        :label="$t('Settings.Experimental Settings.Store User Data In App Folder.Label')"
        compact
        :default-value="storeUserDataInAppFolder"
        :disabled="settingValuesLoading"
        :tooltip="$t('Settings.Experimental Settings.Store User Data In App Folder.Tooltip')"
        @change="handleStoreUserDataInAppFolderChange"
      />
    </FtFlexBox>
    <FtPrompt
      v-if="showRestartPrompt"
      :label="$t('Settings[\'The app needs to restart for changes to take effect. Restart and apply change?\']')"
      :option-names="[$t('Yes, Restart'), $t('Cancel')]"
      :option-values="['restart', 'cancel']"
      @click="handleRestartPromptClick"
    />
  </FtSettingsSection>
</template>

<script setup>
import { onMounted, ref } from 'vue'

import FtSettingsSection from '../FtSettingsSection/FtSettingsSection.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtToggleSwitch from '../FtToggleSwitch/FtToggleSwitch.vue'
import FtPrompt from '../FtPrompt/FtPrompt.vue'

const settingValuesLoading = ref(true)
const replaceHttpCache = ref(false)
const storeUserDataInAppFolder = ref(false)
const showRestartPrompt = ref(false)

const storeUserDataInAppFolderAllowedOnPlatform = process.platform === 'win32'

const NextActions = {
  // Simply use 1-N unique values
  NOTHING: 0,
  TOGGLE_REPLACE_HTTP_CACHE: 1,
  TOGGLE_STORE_USER_DATA_IN_APP_FOLDER: 2,
}

let nextAction = NextActions.NOTHING

onMounted(async () => {
  if (process.env.IS_ELECTRON) {
    replaceHttpCache.value = await window.ftElectron.getReplaceHttpCache()
    if (storeUserDataInAppFolderAllowedOnPlatform) {
      storeUserDataInAppFolder.value = await window.ftElectron.getStoreUserDataInAppFolder()
    }
  }

  settingValuesLoading.value = false
})

/**
 * @param {boolean} value
 */
function handleReplaceHttpCacheChange(value) {
  replaceHttpCache.value = value
  nextAction = NextActions.TOGGLE_REPLACE_HTTP_CACHE
  showRestartPrompt.value = true
}

/**
 * @param {boolean} value
 */
function handleStoreUserDataInAppFolderChange(value) {
  storeUserDataInAppFolder.value = value
  nextAction = NextActions.TOGGLE_STORE_USER_DATA_IN_APP_FOLDER
  showRestartPrompt.value = true
}

/**
 * @param {'restart' | 'cancel' | null} value
 */
function handleRestartPromptClick(value) {
  showRestartPrompt.value = false

  switch (nextAction) {
    case NextActions.TOGGLE_REPLACE_HTTP_CACHE: {
      if (value === null || value === 'cancel') {
        replaceHttpCache.value = !replaceHttpCache.value
        return
      }

      if (process.env.IS_ELECTRON) {
        window.ftElectron.toggleReplaceHttpCache()
      }
      break
    }
    case NextActions.TOGGLE_STORE_USER_DATA_IN_APP_FOLDER: {
      if (value === null || value === 'cancel') {
        storeUserDataInAppFolder.value = !storeUserDataInAppFolder.value
        return
      }

      if (process.env.IS_ELECTRON) {
        window.ftElectron.toggleStoreUserDataInAppFolder()
      }
      break
    }
    default: {
      console.error('[Internal] nextAction has unexpected value', nextAction)
    }
  }
}
</script>

<style scoped src="./ExperimentalSettings.css" />
