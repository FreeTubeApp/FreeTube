<template>
  <FtCard
    v-if="shownDescription.length > 0"
    class="videoDescription"
  >
    <FtTimestampCatcher
      ref="descriptionContainer"
      :class="{ description: true, short: !showFullDescription }"
      :input-html="shownDescription"
      @timestamp-event="onTimestamp"
    />
    <h4
      v-if="!showFullDescription"
      class="getDescriptionTitle"
      role="button"
      tabindex="0"
      @click="expandDescription"
      @keydown.space.prevent="expandDescription"
      @keydown.enter.prevent="expandDescription"
    >
      {{ $t("Description.Expand Description") }}
    </h4>
  </FtCard>
</template>

<script setup>
import autolinker from 'autolinker'

import { onMounted, ref } from 'vue'
import FtCard from '../ft-card/ft-card.vue'
import FtTimestampCatcher from '../ft-timestamp-catcher/ft-timestamp-catcher.vue'

const props = defineProps({
  description: {
    type: String,
    required: true
  },
  descriptionHtml: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['timestamp-event'])

let shownDescription = ''
const descriptionContainer = ref()
const showFullDescription = ref(true)

if (props.descriptionHtml !== '') {
  const parsed = parseDescriptionHtml(props.descriptionHtml)

  // the invidious API returns emtpy html elements when the description is empty
  // so we need to parse it to see if there is any meaningful text in the html
  // or if it's just empty html elements e.g. `<p></p>`

  const testDiv = document.createElement('div')
  testDiv.innerHTML = parsed

  if (!/^\s*$/.test(testDiv.innerText)) {
    shownDescription = parsed
  }
} else {
  if (!/^\s*$/.test(props.description)) {
    shownDescription = autolinker.link(props.description)
  }
}

/**
 * @param {number} timestamp
 */
function onTimestamp(timestamp) {
  emit('timestamp-event', timestamp)
}

/**
 * Enables user to scroll entire contents of description
 */
function expandDescription() {
  showFullDescription.value = true
}

/**
 * Returns true when description content does not overflow description container
 * Useful for hiding the 'Click to View Description' button for short descriptions
 */
function isShortDescription() {
  const videoDescriptionMaxHeight = 300
  const computedDescriptionHeight = descriptionContainer.value.$el.getBoundingClientRect().height
  return computedDescriptionHeight < videoDescriptionMaxHeight
}

onMounted(() => {
  // To verify whether or not the description is too short for the
  // 'Click to View Description' button, we need to check the description's
  // computed CSS height. The only way to make this work is to check on mount.
  showFullDescription.value = isShortDescription()
})

/**
 * @param {string} descriptionText
 */
function parseDescriptionHtml(descriptionText) {
  return descriptionText
    .replaceAll('target="_blank"', '')
    .replaceAll(/\/redirect.+?(?=q=)/g, '')
    .replaceAll('q=', '')
    .replaceAll(/rel="nofollow\snoopener"/g, '')
    .replaceAll(/class=.+?(?=")./g, '')
    .replaceAll(/id=.+?(?=")./g, '')
    .replaceAll(/data-target-new-window=.+?(?=")./g, '')
    .replaceAll(/data-url=.+?(?=")./g, '')
    .replaceAll(/data-sessionlink=.+?(?=")./g, '')
    .replaceAll('&amp;', '&')
    .replaceAll('%3A', ':')
    .replaceAll('%2F', '/')
    .replaceAll(/&v.+?(?=")/g, '')
    .replaceAll(/&redirect-token.+?(?=")/g, '')
    .replaceAll(/&redir_token.+?(?=")/g, '')
    .replaceAll('href="/', 'href="https://www.youtube.com/')
    .replaceAll('href="/hashtag/', 'href="https://wwww.youtube.com/hashtag/')
    .replaceAll('yt.www.watch.player.seekTo', 'changeDuration')
}
</script>

<style scoped src="./WatchVideoDescription.css" />
