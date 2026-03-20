<template>
  <div
    class="ft-auto-load-next-page-wrapper"
  >
    <div
      v-observe-visibility="observeVisibilityOptions"
    >
      <!--
        Dummy element to be observed by Intersection Observer
      -->
    </div>
    <slot />
  </div>
</template>

<script setup>
import { computed } from 'vue'

import store from '../store/index'

const emit = defineEmits(['load-next-page'])

/** @type {import('vue').ComputedRef<boolean>} */
const generalAutoLoadMorePaginatedItemsEnabled = computed(() => {
  return store.getters.getGeneralAutoLoadMorePaginatedItemsEnabled
})

const observeVisibilityOptions = computed(() => {
  if (generalAutoLoadMorePaginatedItemsEnabled.value) {
    return {
      callback: (isVisible, _entry) => {
        // This is also fired when **hidden**
        // No point doing anything if not visible
        if (isVisible) {
          emit('load-next-page')
        }
      },
      intersection: {
        // Only when it intersects with N% above bottom
        rootMargin: '0% 0% 0% 0%',
      },
      // Callback responsible for loading multiple pages
      once: false,
    }
  } else {
    return false
  }
})
</script>
