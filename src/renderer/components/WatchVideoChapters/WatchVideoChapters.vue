<template>
  <FtCard class="videoChapters">
    <details
      class="chaptersDetails"
      @toggle="chaptersToggled"
    >
      <summary
        class="chaptersSummary"
      >
        <h3 class="chaptersTitle">
          {{ kind === 'keyMoments' ? $t('Chapters.Key Moments') : $t("Chapters.Chapters") }}

          <span class="currentChapter">
            • {{ currentTitle }}
          </span>

          <FontAwesomeIcon
            class="chaptersChevron"
            :icon="['fas', 'chevron-right']"
          />
        </h3>
      </summary>

      <div
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
    </details>
  </FtCard>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
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
  },
  kind: {
    type: String,
    default: 'chapters'
  }
})

const emit = defineEmits(['timestamp-event'])

/** @type {import('vue').Ref<HTMLDivElement | null>} */
const chaptersWrapper = ref(null)

/** @type {import('vue').Ref<HTMLDivElement[]>} */
const currentChaptersItem = ref([])

let chaptersVisible = false
const currentIndex = ref(props.currentChapterIndex)

watch(() => props.currentChapterIndex, (value) => {
  if (currentIndex.value !== value) {
    currentIndex.value = value
  }
})

const currentChapter = computed(() => {
  return props.chapters[currentIndex.value]
})

/** @type {import('vue').ComputedRef<string>} */
const currentTitle = computed(() => {
  return currentChapter.value.title
})

/** @type {import('vue').ComputedRef<boolean>} */
const compact = computed(() => {
  return !props.chapters[0].thumbnail
})

const observeVisibilityOptions = {
  callback: (isVisible, _entry) => {
    // This is also fired when **hidden**
    // No point doing anything if not visible
    if (!isVisible) { return }
    // Only auto scroll when expanded
    if (!chaptersVisible) { return }

    scrollToCurrentChapter()
  },
  intersection: {
    // Only when it intersects with N% above bottom
    rootMargin: '0% 0% 0% 0%',
  },
  // Callback responsible for scolling to current chapter multiple times
  once: false,
}

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

/**
 * @param {ToggleEvent} event
 */
function chaptersToggled(event) {
  chaptersVisible = event.target.open

  if (chaptersVisible) {
    scrollToCurrentChapter()
  }
}

function scrollToCurrentChapter() {
  const container = chaptersWrapper.value
  const currentItem = currentChaptersItem.value[0]

  if (container != null && currentItem != null) {
    container.scrollTop = currentItem.offsetTop - container.offsetTop
  }
}
</script>

<style scoped src="./WatchVideoChapters.css" />
