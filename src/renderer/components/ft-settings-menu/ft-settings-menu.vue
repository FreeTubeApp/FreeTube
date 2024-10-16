<template>
  <menu
    class="settingsMenu"
  >
    <h2 class="header">
      {{ $t('Settings.Settings') }}
    </h2>
    <a
      v-for="(settingsSection) in settingsSections"
      :id="settingsSection.type"
      :key="settingsSection.type + '-link'"
      class="title"
      href="javascript:;"
      @click.stop="goToSettingsSection(settingsSection.type)"
      @keydown.enter.stop="goToSettingsSection(settingsSection.type)"
    >
      <div class="titleContent">
        <div class="iconAndTitleText">
          <font-awesome-icon
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

<script src="./ft-settings-menu.js" />
<style scoped src="./ft-settings-menu.css" />
