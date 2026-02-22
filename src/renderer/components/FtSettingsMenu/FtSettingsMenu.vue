<template>
  <menu
    class="settingsMenu"
  >
    <h2 class="header">
      <FontAwesomeIcon
        :icon="['fas', 'sliders-h']"
        class="headingIcon"
      />
      {{ $t('Settings.Settings') }}
    </h2>
    <a
      v-for="settingsSection in settingsSections"
      ref="linkRefs"
      :key="settingsSection.type"
      class="title"
      :class="{ active: activeSection === settingsSection.type }"
      href="javascript:;"
      :data-section="settingsSection.type"
      @click.stop="goToSettingsSection"
      @keydown.enter.stop="goToSettingsSection"
    >
      <div class="titleContent">
        <div class="iconAndTitleText">
          <FontAwesomeIcon
            :icon="settingsSection.icon"
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
import { useTemplateRef } from 'vue'

defineProps({
  settingsSections: {
    type: Array,
    required: true
  },
  activeSection: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['navigate-to-section'])

/**
 * @param {PointerEvent | KeyboardEvent} event
 */
function goToSettingsSection(event) {
  emit('navigate-to-section', event.currentTarget.dataset.section)
}

const linkRefs = useTemplateRef('linkRefs')

defineExpose({
  /**
   * @param {string} name
   */
  focusLink: (name) => {
    linkRefs.value.find((link) => link.dataset.section === name)?.focus()
  }
})
</script>

<style scoped src="./FtSettingsMenu.css" />
