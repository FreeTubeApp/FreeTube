<template>
  <menu
    class="settingsMenu"
  >
    <h2 class="header">
      {{ $t('Settings.Settings') }}
    </h2>
    <a
      v-for="(settingsSection) in settingsSections"
      :id="settingsSection.type + '-link'"
      :key="settingsSection.type + '-link'"
      :href="'#' + settingsSection.type"
      class="settingsMenuTitle"
    >
      <div class="settingsMenuTitleContent">
        <div class="settingsMenuTitleAndIcon">
          <font-awesome-icon
            :icon="['fas', settingsSection.icon]"
            class="settingsMenuTitleIcon"
          />
          {{ getTitleForSection(settingsSection) }}
        </div>
        <div class="settingsMenuTitleUnderline" />
      </div>
    </a>
  </menu>
</template>

<script src="./ft-settings-menu.js" />
<style scoped src="./ft-settings-menu.css" />
