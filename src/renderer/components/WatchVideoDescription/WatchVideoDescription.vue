<template>
  <FtCard
    v-if="shownDescription.length > 0 || showHowThisWasMade"
    :class="{ videoDescription: true, short: !showFullDescription }"
  >
    <span
      v-if="showControls && !showFullDescription"
      class="descriptionStatus"
      role="button"
      tabindex="0"
      @click="expandDescription"
      @keydown.enter.space.prevent="expandDescription"
    >
      {{ $t("Description.Expand Description") }}
    </span>
    <FtTimestampCatcher
      v-if="shownDescription.length > 0"
      ref="descriptionContainer"
      class="description"
      :input-html="processedShownDescription"
      :link-tab-index="linkTabIndex"
      @timestamp-event="onTimestamp"
      @click="expandDescriptionWithClick"
    />
    <bdi
      v-if="license && showFullDescription"
      class="license"
    >
      {{ license }}
    </bdi>
    <div
      v-if="showHowThisWasMade && showFullDescription"
      class="aiDisclosureSection"
    >
      <div class="aiDisclosureTitle">
        {{ contentDisclosures.title || $t("Video.How this was made") }}
      </div>
      <div
        v-for="(item, index) in contentDisclosures.items"
        :key="index"
        class="aiDisclosureItem"
      >
        <div class="aiDisclosureHeader">
          {{ item.label }}
        </div>
        <div
          v-if="item.description"
          class="aiDisclosureBody"
        >
          {{ item.description }}
        </div>
      </div>
    </div>
    <span
      v-if="showControls && showFullDescription"
      class="descriptionStatus"
      role="button"
      tabindex="0"
      @click="collapseDescription"
      @keydown.enter.space.prevent="collapseDescription"
    >
      {{ $t("Description.Collapse Description") }}
    </span>
  </FtCard>
</template>

<script setup>
import autolinker from 'autolinker'

import { onMounted, ref, computed, useTemplateRef } from 'vue'
import FtCard from '../ft-card/ft-card.vue'
import FtTimestampCatcher from '../FtTimestampCatcher.vue'
import store from '../../store'

const props = defineProps({
  description: {
    type: String,
    default: ''
  },
  descriptionHtml: {
    type: String,
    default: ''
  },
  license: {
    type: String,
    default: null,
  },
  contentDisclosures: {
    type: Object,
    default: null
  }
})

/** @type {import('vue').ComputedRef<boolean>} */
const hideHowThisWasMade = computed(() => store.getters.getHideHowThisWasMade)

const showHowThisWasMade = computed(() => (props.contentDisclosures?.items?.length ?? 0) > 0 && !hideHowThisWasMade.value)

const emit = defineEmits(['timestamp-event'])

let shownDescription = ''
const descriptionContainer = useTemplateRef('descriptionContainer')
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

const processedShownDescription = computed(() => {
  if (shownDescription === '') { return shownDescription }

  return processDescriptionHtml(shownDescription, linkTabIndex.value)
})

const linkTabIndex = computed(() => {
  return showFullDescription.value ? '0' : '-1'
})

/**
 * @param {number} timestamp
 */
function onTimestamp(timestamp) {
  emit('timestamp-event', timestamp)
}

/**
 @param {PointerEvent} e
 */
function expandDescriptionWithClick(e) {
  // Ignore link clicks
  if (e.target.tagName === 'A') { return }

  expandDescription()
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
  if (!descriptionElem) {
    return true
  }
  return descriptionElem.clientHeight >= descriptionElem.scrollHeight
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

/**
 * @param {string} descriptionText
 * @param {string} tabIndex
 * @returns {string}
 */
function processDescriptionHtml(descriptionText, tabIndex) {
  return descriptionText
    .replaceAll('<a', `<a tabindex="${tabIndex}"`)
}
</script>

<style scoped src="./WatchVideoDescription.css" />
