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
    <FtFlexBox v-if="storeUserDataInAppFolderAllowed">
      <FtToggleSwitch
        tooltip-position="top"
        :label="$t('Settings.Experimental Settings.Store User Data In App Folder.Label')"
        compact
        :default-value="storeUserDataInAppFolderEnabled"
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
const storeUserDataInAppFolderEnabled = ref(false)
const showRestartPrompt = ref(false)

const storeUserDataInAppFolderAllowed = ref(false)

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
    storeUserDataInAppFolderAllowed.value = await window.ftElectron.getStoreUserDataInAppFolderAllowed()
    if (storeUserDataInAppFolderAllowed.value) {
      storeUserDataInAppFolderEnabled.value = await window.ftElectron.getStoreUserDataInAppFolderEnabled()
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
  storeUserDataInAppFolderEnabled.value = value
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
        storeUserDataInAppFolderEnabled.value = !storeUserDataInAppFolderEnabled.value
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
