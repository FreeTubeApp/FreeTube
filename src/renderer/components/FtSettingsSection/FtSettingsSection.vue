<template>
  <FtSetting
    :id="id"
    class="settingsSection"
    :keyword="title"
  >
    <div class="sectionBody">
      <h3 class="sectionTitle">
        {{ title }}
      </h3>
      <slot />
    </div>
  </FtSetting>
</template>

<script setup>
import FtSetting from '../FtSetting/FtSetting.vue'

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
