<template>
  <div
    class="settingsSection"
  >
    <div class="sectionBody">
      <h3 class="sectionTitle">
        {{ title }}
      </h3>
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  }
})
</script>

<style scoped src="./FtSettingsSection.scss" lang="scss" />
