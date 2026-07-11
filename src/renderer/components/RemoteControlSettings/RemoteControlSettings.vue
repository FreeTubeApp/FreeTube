<template>
  <FtSettingsSection
    :title="$t('Settings.Remote Control Settings.Remote Control Settings')"
  >
    <FtFlexBox class="settingsFlexStart500px">
      <p class="remoteControlWarning">
        <FontAwesomeIcon
          :icon="['fas', 'circle-exclamation']"
          class="warning-icon"
        />
        {{ $t('Settings.Remote Control Settings.Warning') }}
      </p>
      <FtToggleSwitch
        :label="$t('Settings.Remote Control Settings.Enable Remote Control')"
        :default-value="isRunning"
        @change="handleToggle"
      />
    </FtFlexBox>
    <template v-if="isRunning">
      <FtLoader
        v-if="isLoading"
      />
      <template v-else-if="connectionUrl">
        <div class="qrWrapper">
          <img
            v-if="qrDataUrl"
            :src="qrDataUrl"
            :alt="$t('Settings.Remote Control Settings.QR Code Alt')"
            class="qrImage"
          >
        </div>
        <p class="center connectionUrl">
          {{ connectionUrl }}
        </p>
        <FtFlexBox>
          <FtButton
            :label="$t('Settings.Remote Control Settings.Regenerate Link')"
            @click="regenerate"
          />
        </FtFlexBox>
      </template>
      <p
        v-if="errorMessage"
        class="center errorMessage"
      >
        {{ errorMessage }}
      </p>
    </template>
  </FtSettingsSection>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { toDataURL } from 'qrcode'

import FtSettingsSection from '../FtSettingsSection/FtSettingsSection.vue'
import FtToggleSwitch from '../FtToggleSwitch/FtToggleSwitch.vue'
import FtButton from '../FtButton/FtButton.vue'
import FtLoader from '../FtLoader/FtLoader.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'

import { showToast } from '../../helpers/utils'
import { startRemoteControlServer, stopRemoteControlServer } from '../../helpers/remote-control'

const { t } = useI18n()

const isRunning = ref(false)
const isLoading = ref(false)
const connectionUrl = ref('')
const qrDataUrl = ref('')
const errorMessage = ref('')

/**
 * @param {boolean} enabled
 */
async function handleToggle(enabled) {
  if (enabled) {
    await start()
  } else {
    stop()
  }
}

async function start() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await startRemoteControlServer()
    connectionUrl.value = result.url
    qrDataUrl.value = await toDataURL(result.url, { margin: 1, width: 220 })
    isRunning.value = true
  } catch (error) {
    console.error('failed to start remote control server', error)
    errorMessage.value = t('Settings.Remote Control Settings.Failed to start')
    showToast(t('Settings.Remote Control Settings.Failed to start'))
    isRunning.value = false
  } finally {
    isLoading.value = false
  }
}

function stop() {
  stopRemoteControlServer()
  isRunning.value = false
  connectionUrl.value = ''
  qrDataUrl.value = ''
}

async function regenerate() {
  stop()
  await start()
}
</script>

<style scoped src="./RemoteControlSettings.css" />
