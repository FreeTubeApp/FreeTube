<template>
  <menu
    class="settingsMenu"
  >
    <h2 class="header">
      <FontAwesomeIcon
        :icon="['fas', 'sliders-h']"
        class="headingIcon"
        fixed-width
      />
      {{ $t('Settings.Settings') }}
    </h2>
    <a
      v-for="settingsSection in settingsSections"
      :id="settingsSection.type"
      :key="settingsSection.type"
      class="title"
      href="javascript:;"
      @click.stop="goToSettingsSection(settingsSection.type)"
      @keydown.enter.stop="goToSettingsSection(settingsSection.type)"
    >
      <div class="titleContent">
        <div class="iconAndTitleText">
          <FontAwesomeIcon
            :icon="['fas', settingsSection.icon]"
            class="titleIcon"
          />
          {{ settingsSection.title }}
        </div>
        <div class="titleUnderline" />
      </div>
    </a>
  </menu>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

defineProps({
  settingsSections: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['navigate-to-section'])

/**
 * @param {string} sectionType
 */
function goToSettingsSection(sectionType) {
  emit('navigate-to-section', sectionType)
}
</script>

<style scoped src="./FtSettingsMenu.css" />
