<template>
  <details class="settingsSection">
    <summary class="sectionHeader">
      <h3 class="sectionTitle">
        {{ title }}
      </h3>
    </summary>
    <hr class="sectionLine">
    <slot />
  </details>
</template>

<script src="./ft-settings-section.js" />
<style scoped src="./ft-settings-section.sass" lang="sass" />
