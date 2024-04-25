<template>
  <div
    class="settingsSection"
  >
    <h3 class="sectionTitle">
      {{ title }}
    </h3>
    <div class="sectionBody">
      <slot />
    </div>
  </div>
</template>

<script src="./ft-settings-section.js" />
<style scoped src="./ft-settings-section.scss" lang="scss" />
