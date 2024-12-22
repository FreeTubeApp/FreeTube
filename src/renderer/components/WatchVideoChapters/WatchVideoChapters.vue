<template>
  <FtCard class="videoChapters">
    <h3
      class="chaptersTitle"
      tabindex="0"
      :aria-label="showChapters
        ? $t('Chapters.Chapters list visible, current chapter: {chapterName}', { chapterName: currentTitle })
        : $t('Chapters.Chapters list hidden, current chapter: {chapterName}', { chapterName: currentTitle })
      "
      :aria-pressed="showChapters"
      @click="toggleShowChapters"
      @keydown.space.stop.prevent="toggleShowChapters"
      @keydown.enter.stop.prevent="toggleShowChapters"
    >
      {{ $t("Chapters.Chapters") }}

      <span class="currentChapter">
        • {{ currentTitle }}
      </span>

      <FontAwesomeIcon
        class="chaptersChevron"
        :icon="['fas', 'chevron-right']"
        :rotation="showChapters ? 90 : null"
        :class="{ open: showChapters }"
      />
    </h3>
    <div
      v-show="showChapters"
      ref="chaptersWrapper"
      v-observe-visibility="observeVisibilityOptions"
      class="chaptersWrapper"
      :class="{ compact }"
      @keydown.arrow-up.stop.prevent="navigateChapters('up')"
      @keydown.arrow-down.stop.prevent="navigateChapters('down')"
    >
      <div
        v-for="(chapter, index) in chapters"
        :key="index"
        :ref="index === currentIndex ? 'currentChaptersItem' : null"
        class="chapter"
        role="button"
        tabindex="0"
        :aria-selected="index === currentIndex"
        :class="{ current: index === currentIndex }"
        @click="changeChapter(index)"
        @keydown.space.stop.prevent="changeChapter(index)"
        @keydown.enter.stop.prevent="changeChapter(index)"
      >
        <!-- Setting the aspect ratio avoids layout shifts when the images load -->
        <img
          v-if="!compact"
          alt=""
          aria-hidden="true"
          class="chapterThumbnail"
          loading="lazy"
          :src="chapter.thumbnail.url"
          :style="{ aspectRatio: chapter.thumbnail.width / chapter.thumbnail.height }"
        >
        <div class="chapterTimestamp">
          {{ chapter.timestamp }}
        </div>
        <p class="chapterTitle">
          {{ chapter.title }}
        </p>
      </div>
    </div>
  </FtCard>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import FtCard from '../ft-card/ft-card.vue'

const props = defineProps({
  chapters: {
    type: Array,
    required: true
  },
  currentChapterIndex: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['timestamp-event'])

/** @type {import('vue').Ref<HTMLDivElement | null>} */
const chaptersWrapper = ref(null)

/** @type {import('vue').Ref<HTMLDivElement[]>} */
const currentChaptersItem = ref([])

const showChapters = ref(false)
const currentIndex = ref(props.currentChapterIndex)

watch(() => props.currentChapterIndex, (value) => {
  if (currentIndex.value !== value) {
    currentIndex.value = value
  }
})

const currentChapter = computed(() => {
  return props.chapters[currentIndex.value]
})

const currentTitle = computed(() => {
  return currentChapter.value.title
})

const compact = computed(() => {
  return !props.chapters[0].thumbnail
})

const observeVisibilityOptions = computed(() => {
  return {
    callback: (isVisible, _entry) => {
      // This is also fired when **hidden**
      // No point doing anything if not visible
      if (!isVisible) { return }
      // Only auto scroll when expanded
      if (!showChapters.value) { return }

      scrollToCurrentChapter()
    },
    intersection: {
      // Only when it intersects with N% above bottom
      rootMargin: '0% 0% 0% 0%',
    },
    // Callback responsible for scolling to current chapter multiple times
    once: false,
  }
})

/**
 * @param {number} index
 */
function changeChapter(index) {
  currentIndex.value = index
  emit('timestamp-event', props.chapters[index].startSeconds)
  window.scrollTo(0, 0)
}

/**
 * @param {'up' | 'down'} direction
 */
function navigateChapters(direction) {
  const chapterElements = Array.from(chaptersWrapper.value.children)
  const focusedIndex = chapterElements.indexOf(document.activeElement)

  let newIndex = focusedIndex
  if (direction === 'up') {
    if (focusedIndex === 0) {
      newIndex = chapterElements.length - 1
    } else {
      newIndex--
    }
  } else {
    if (focusedIndex === chapterElements.length - 1) {
      newIndex = 0
    } else {
      newIndex++
    }
  }

  chapterElements[newIndex].focus()
}

function toggleShowChapters() {
  showChapters.value = !showChapters.value

  if (showChapters.value) {
    scrollToCurrentChapter()
  }
}

function scrollToCurrentChapter() {
  const container = chaptersWrapper.value
  const currentItem = currentChaptersItem.value[0]
  // Must wait until rendering done after value change
  nextTick(() => {
    if (container != null && currentItem != null) {
      container.scrollTop = currentItem.offsetTop - container.offsetTop
    }
  })
}
</script>

<style scoped src="./WatchVideoChapters.css" />
