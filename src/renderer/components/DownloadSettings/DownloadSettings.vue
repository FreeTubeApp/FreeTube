<template>
  <FtSettingsSection
    :title="$t('Settings.Download Settings.Download Settings')"
  >
    <FtFlexBox>
      <FtSelect
        :placeholder="$t('Settings.Download Settings.Download Behavior')"
        :value="downloadBehavior"
        :select-names="downloadBehaviorNames"
        :select-values="DOWNLOAD_BEHAVIOR_VALUES"
        :icon="['fas', 'download']"
        @change="updateDownloadBehavior"
      />
    </FtFlexBox>
    <template
      v-if="downloadBehavior === 'download'"
    >
      <FtFlexBox
        class="settingsFlexStart500px"
      >
        <FtToggleSwitch
          :label="$t('Settings.Download Settings.Ask Download Path')"
          :default-value="downloadAskPath"
          @change="updateDownloadAskPath"
        />
      </FtFlexBox>
      <template
        v-if="!downloadAskPath"
      >
        <FtFlexBox>
          <FtInput
            class="folderDisplay"
            :placeholder="downloadFolderPath"
            :show-action-button="false"
            :show-label="false"
            :disabled="true"
          />
        </FtFlexBox>
        <FtFlexBox>
          <FtButton
            :label="$t('Settings.Download Settings.Choose Path')"
            @click="chooseDownloadFolder"
          />
        </FtFlexBox>
      </template>
    </template>
  </FtSettingsSection>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'

import FtButton from '../FtButton/FtButton.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtSelect from '../FtSelect/FtSelect.vue'
import FtSettingsSection from '../FtSettingsSection/FtSettingsSection.vue'
import FtToggleSwitch from '../FtToggleSwitch/FtToggleSwitch.vue'

import store from '../../store/index'

import { DefaultFolderKind } from '../../../constants'

const DOWNLOAD_BEHAVIOR_VALUES = [
  'download',
  'open'
]

const { t } = useI18n()

const downloadBehaviorNames = computed(() => [
  t('Settings.Download Settings.Download in app'),
  t('Settings.Download Settings.Open in web browser')
])

/** @type {import('vue').ComputedRef<'download' | 'open'>} */
const downloadBehavior = computed(() => store.getters.getDownloadBehavior)

/**
 * @param {'download' | 'open'}  value
 */
function updateDownloadBehavior(value) {
  store.dispatch('updateDownloadBehavior', value)
}

/** @type {import('vue').ComputedRef<boolean>} */
const downloadAskPath = computed(() => store.getters.getDownloadAskPath)

/**
 * @param {boolean}  value
 */
function updateDownloadAskPath(value) {
  store.dispatch('updateDownloadAskPath', value)
}

/** @type {import('vue').ComputedRef<string>} */
const downloadFolderPath = computed(() => store.getters.getDownloadFolderPath)

function chooseDownloadFolder() {
  if (process.env.IS_ELECTRON) {
    window.ftElectron.chooseDefaultFolder(DefaultFolderKind.DOWNLOADS)
  }
}
</script>

<style scoped src="./DownloadSettings.css" />
