<template>
  <div>
    <div
      v-if="hotZoneEnabled"
      class="hotZone topZone"
      @dragenter="setScrollDirection('up')"
      @dragleave="clearScrollDirection"
    />

    <slot />

    <div
      v-if="hotZoneEnabled"
      class="hotZone bottomZone"
      @dragenter="setScrollDirection('down')"
      @dragleave="clearScrollDirection"
    />
  </div>
</template>

<script setup>
import { ref, watch, onWatcherCleanup } from 'vue'

defineProps({
  hotZoneEnabled: {
    type: Boolean,
    default: false,
  },
})

/** @import { Ref } from 'vue' */
/** @type {Ref<'up' | 'down' | ''>} */
const scrollDirection = ref('')

/**
 * @param {'up' | 'down'} direction
 */
function setScrollDirection(direction) {
  const notScrolling = !scrollDirection.value

  if (notScrolling) {
    scrollDirection.value = direction
  }
}

function clearScrollDirection() {
  scrollDirection.value = ''
}

/**
 * @param {'up' | 'down'} direction
 */
function scroll(direction) {
  const SPEED = 6

  if (direction === 'up') {
    globalThis.scrollBy(0, -SPEED)
  } else if (direction === 'down') {
    globalThis.scrollBy(0, SPEED)
  }
}

watch(scrollDirection, direction => {
  let scrollInterval

  if (direction) {
    scrollInterval = setInterval(() => {
      scroll(direction)
    }, 10)
  } else {
    clearInterval(scrollInterval)
  }

  onWatcherCleanup(() => {
    clearInterval(scrollInterval)
  })
})
</script>

<style scoped src="./AutoScrollWrapper.css" />
