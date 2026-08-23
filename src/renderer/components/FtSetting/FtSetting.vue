<template>
  <div
    v-show="isVisible"
    :id="`setting-${id}`"
    class="ftSetting"
  >
    <slot />
  </div>
</template>

<script setup>
import { computed } from 'vue'

import { useSettingsSearch } from '../../composables/settings-search'

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  keyword: {
    type: String,
    required: true
  }
})

const { searchQuery } = useSettingsSearch()

const isVisible = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (query === '') {
    return true
  }

  return props.keyword.toLowerCase().includes(query)
})
</script>

<style scoped src="./FtSetting.css" />
