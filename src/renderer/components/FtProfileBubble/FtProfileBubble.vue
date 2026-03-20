<template>
  <div
    class="bubblePadding"
    tabindex="0"
    role="button"
    :aria-labelledby="id"
    @click="click"
    @keydown.space.enter.prevent="click"
  >
    <div
      class="bubble"
      :style="{ background: backgroundColor, color: textColor }"
    >
      <div
        class="initial"
        dir="auto"
      >
        {{ profileInitial }}
      </div>
    </div>
    <div
      :id="id"
      class="profileName"
      dir="auto"
    >
      {{ translatedProfileName }}
    </div>
  </div>
</template>

<script setup>
import { computed, useId } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'

import { getFirstCharacter } from '../../helpers/strings'

const props = defineProps({
  profileName: {
    type: String,
    required: true
  },
  isMainProfile: {
    type: Boolean,
    required: true
  },
  backgroundColor: {
    type: String,
    required: true
  },
  textColor: {
    type: String,
    required: true
  }
})

const { locale, t } = useI18n()

const id = useId()

const translatedProfileName = computed(() => {
  return props.isMainProfile ? t('Profile.All Channels') : props.profileName
})

const profileInitial = computed(() => {
  return props.profileName
    ? getFirstCharacter(translatedProfileName.value, locale.value)
    : ''
})

const emit = defineEmits(['click'])

function click() {
  emit('click')
}
</script>

<style scoped src="./FtProfileBubble.css" />
