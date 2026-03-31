<template>
  <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
  <p
    v-safer-html="displayText"
    dir="auto"
    @click="catchTimestampClick"
  />
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { vSaferHtml } from '../directives/vSaferHtml.js'

const props = defineProps({
  inputHtml: {
    type: String,
    default: ''
  },
  linkTabIndex: {
    type: String,
    default: '0'
  },
})

const router = useRouter()
const videoId = router.currentRoute.value.params.id

/** @type {import('vue').ComputedRef<string>} */
const displayText = computed(() => props.inputHtml.replaceAll(/(?:(\d+):)?(\d+):(\d+)/g, (timestamp, hours, minutes, seconds) => {
  let time = 60 * Number(minutes) + Number(seconds)

  if (hours) {
    time += 3600 * Number(hours)
  }

  const url = router.resolve({
    path: `/watch/${videoId}`,
    query: {
      timestamp: time
    }
  }).href

  // Adding the URL lets the user open the video in a new window at this timestamp
  return `<a tabindex="${props.linkTabIndex}" href="${url}" data-time="${time}">${timestamp}</a>`
}))

const emit = defineEmits(['timestamp-event'])

/**
 * @param {PointerEvent} event
 */
function catchTimestampClick(event) {
  /** @type {HTMLAnchorElement} */
  const target = event.target

  if (target.tagName === 'A' && target.dataset.time) {
    const timeSeconds = parseInt(target.dataset.time)

    if (!isNaN(timeSeconds)) {
      event.preventDefault()

      emit('timestamp-event', timeSeconds)
      window.scrollTo(0, 0)
    }
  }
}
</script>
