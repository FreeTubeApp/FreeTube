<template>
  <p
    @timestamp-clicked="catchTimestampClick"
    v-html="displayText"
  />
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router/composables'

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
const videoId = router.currentRoute.params.id

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
  return `<a tabindex="${props.linkTabIndex}" href="${url}" onclick="event.preventDefault();this.dispatchEvent(new CustomEvent('timestamp-clicked',{bubbles:true,detail:${time}}));window.scrollTo(0,0)">${timestamp}</a>`
}))

const emit = defineEmits(['timestamp-event'])

/**
 * @param {CustomEvent} event
 */
function catchTimestampClick(event) {
  emit('timestamp-event', event.detail)
}
</script>
