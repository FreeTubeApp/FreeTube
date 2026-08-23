<template>
  <FtPageFilterItem
    :id="`setting-${id}`"
    class="settingsSection"
    :keyword="title"
  >
    <div class="sectionBody">
      <h3 class="sectionTitle">
        {{ title }}
      </h3>
      <slot />
    </div>
  </FtPageFilterItem>
</template>

<script setup>
import FtPageFilterItem from '../FtPageFilterItem/FtPageFilterItem.vue'

defineProps({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  }
})
</script>

<style scoped src="./FtSettingsSection.scss" lang="scss" />
