<template>
  <FtCard
    v-if="shownDescription.length > 0"
    :class="{ videoDescription: true, short: !showFullDescription }"
  >
    <template v-if="showControls">
      <span
        v-if="showFullDescription"
        class="descriptionStatus"
        role="button"
        tabindex="0"
        @click="collapseDescription"
        @keydown.space.prevent="collapseDescription"
        @keydown.enter.prevent="collapseDescription"
      >
        {{ $t("Description.Collapse Description") }}
      </span>
      <span
        v-else
        class="descriptionStatus"
        role="button"
        tabindex="0"
        @keydown.space.prevent="expandDescription"
        @keydown.enter.prevent="expandDescription"
      >
        {{ $t("Description.Expand Description") }}
      </span>
      <div
        v-if="!showFullDescription"
        class="overlay"
        @click="expandDescription"
        @keydown.space.prevent="expandDescription"
        @keydown.enter.prevent="expandDescription"
      />
    </template>
    <FtTimestampCatcher
      ref="descriptionContainer"
      class="description"
      :input-html="shownDescription"
      @timestamp-event="onTimestamp"
    />
  </FtCard>
</template>

<script setup>
import autolinker from 'autolinker'

import { onMounted, ref } from 'vue'
import FtCard from '../ft-card/ft-card.vue'
import FtTimestampCatcher from '../FtTimestampCatcher.vue'

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
const showFullDescription = ref(false)
const showControls = ref(false)

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
 * Enables user to view entire contents of description
 */
function expandDescription() {
  showFullDescription.value = true
}

/**
 * Enables user to collapse contents of description
 */
function collapseDescription() {
  showFullDescription.value = false
}

/**
 * Returns true when description content does not overflow description container
 * Useful for hiding description expansion/contraction controls
 */
function isShortDescription() {
  const descriptionElem = descriptionContainer.value?.$el
  return descriptionElem?.clientHeight >= descriptionElem?.scrollHeight
}

onMounted(() => {
  // To verify whether or not the description is too short for displaying
  // description controls, we need to check the description's dimensions.
  // The only way to make this work is to check on mount.
  showFullDescription.value = isShortDescription()
  showControls.value = !showFullDescription.value
})

/**
 * @param {string} descriptionText
 * @returns {string}
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
