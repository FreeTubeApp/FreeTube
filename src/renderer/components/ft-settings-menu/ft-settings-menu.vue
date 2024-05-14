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
      class="title"
    >
      <div class="titleContent">
        <div class="iconAndTitleText">
          <font-awesome-icon
            :icon="['fas', settingsSection.icon]"
            class="titleIcon"
          />
          {{ settingsSection.shortTitle }}
        </div>
        <div class="titleUnderline" />
      </div>
    </a>
  </menu>
</template>

<script src="./ft-settings-menu.js" />
<style scoped src="./ft-settings-menu.css" />
