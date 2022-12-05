<template>
  <div>
    <password-settings
      :current-password="settingsPassword"
      :has-stored-password="hasStoredPassword"
      :unlocked="showSettings"
      @passwordChanged="(n) => settingsPassword = n"
    />
    <hr>
    <div v-if="showSettings">
      <general-settings />
      <hr>
      <theme-settings />
      <hr>
      <player-settings />
      <hr>
      <external-player-settings v-if="usingElectron" />
      <hr v-if="usingElectron">
      <subscription-settings />
      <hr>
      <distraction-settings />
      <hr>
      <privacy-settings />
      <hr>
      <data-settings />
      <hr>
      <proxy-settings />
      <hr>
      <download-settings v-if="usingElectron" />
      <hr v-if="usingElectron">
      <parental-control-settings />
      <hr>
      <sponsor-block-settings />
      <hr v-if="usingElectron">
      <experimental-settings v-if="usingElectron" />
    </div>
  </div>
</template>

<script src="./Settings.js" />
<style scoped src="./Settings.css" />
