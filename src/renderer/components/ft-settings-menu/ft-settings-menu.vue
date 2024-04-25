<template>
  <menu
    class="settingsMenu"
  >
    <h2 class="header">
      {{ $t('Settings.Settings') }}
    </h2>
    <a
      v-for="(settingsSection) in settingsSections"
      :key="settingsSection.type + 'link'"
      :href="'#' + settingsSection.type"
      class="settingsMenuTitle"
    >
      <font-awesome-icon
        :icon="['fas', settingsSection.icon]"
        class="settingsMenuTitleIcon"
      />
      {{ settingsSection.title }}
    </a>
  </menu>
</template>

<script src="./ft-settings-menu.js" />
<style scoped src="./ft-settings-menu.css" />
