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
import { computed, onMounted, ref } from 'vue'

import FtCard from '../ft-card/ft-card.vue'
import FtInput from '../ft-input/ft-input.vue'

import store from '../../store/index'

const emit = defineEmits(['unlocked'])

const password = ref(null)

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
