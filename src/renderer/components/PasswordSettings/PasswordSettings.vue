<template>
  <FtSettingsSection
    :title="$t('Settings.Password Settings.Password Settings')"
  >
    <FtFlexBox
      v-if="hasStoredPassword"
      class="settingsFlexStart460px"
    >
      <FtButton
        :label="$t('Settings.Password Settings.Remove Password')"
        @click="handleRemovePassword"
      />
    </FtFlexBox>
    <FtFlexBox
      v-else
      class="settingsFlexStart460px"
    >
      <FtInput
        :placeholder="$t('Settings.Password Settings.Set Password To Prevent Access')"
        :show-action-button="false"
        show-label
        input-type="password"
        :value="password"
        @input="e => password = e"
        @keydown.enter.native="handleSetPassword"
      />
      <FtButton
        class="centerButton"
        :label="$t('Settings.Password Settings.Set Password')"
        @click="handleSetPassword"
      />
    </FtFlexBox>
  </FtSettingsSection>
</template>

<script setup>
import { computed, ref } from 'vue'

import FtSettingsSection from '../FtSettingsSection/FtSettingsSection.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtButton from '../FtButton/FtButton.vue'

import store from '../../store/index'

const settingsPassword = computed(() => {
  return store.getters.getSettingsPassword
})

const hasStoredPassword = computed(() => {
  return settingsPassword.value !== ''
})

const password = ref('')

function handleSetPassword() {
  store.dispatch('updateSettingsPassword', password.value)
  password.value = ''
}

function handleRemovePassword() {
  store.dispatch('updateSettingsPassword', '')
  password.value = ''
}
</script>

<style scoped src="./PasswordSettings.css" />
