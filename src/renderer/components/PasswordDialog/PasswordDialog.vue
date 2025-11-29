<template>
  <FtCard
    class="card"
  >
    <h3>{{ $t("Settings.Password Dialog.Enter Password To Unlock") }}</h3>

    <FtInput
      ref="password"
      :placeholder="$t('Settings.Password Dialog.Password')"
      :show-action-button="false"
      input-type="password"
      class="passwordInput"
      @input="handlePasswordInput"
    />
  </FtCard>
</template>

<script setup>
import { computed, onMounted, useTemplateRef } from 'vue'

import FtCard from '../ft-card/ft-card.vue'
import FtInput from '../FtInput/FtInput.vue'

import store from '../../store/index'

const emit = defineEmits(['unlocked'])

const password = useTemplateRef('password')

onMounted(() => {
  password.value.focus()
})

const settingsPassword = computed(() => {
  return store.getters.getSettingsPassword
})

function handlePasswordInput(input) {
  if (input === settingsPassword.value) {
    emit('unlocked')
  }
}
</script>

<style scoped src="./PasswordDialog.css" />
