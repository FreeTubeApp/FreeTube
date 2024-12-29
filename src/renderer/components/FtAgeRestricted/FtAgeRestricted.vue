<template>
  <div>
    <h2 class="message">
      {{ restrictedMessage }}
    </h2>
    <div class="frown">
      {{ emoji }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'

import { randomArrayItem } from '../../helpers/utils'

const { t } = useI18n()

const props = defineProps({
  isChannel: {
    type: Boolean,
    default: false,
  }
})

const emoji = randomArrayItem(['😵', '😦', '🙁', '☹️', '😦', '🤫', '😕'])

const restrictedMessage = computed(() => {
  if (props.isChannel) {
    return t('Age Restricted.This channel is age restricted')
  }

  return t('Age Restricted.This video is age restricted')
})
</script>

<style scoped src="./FtAgeRestricted.css" />
