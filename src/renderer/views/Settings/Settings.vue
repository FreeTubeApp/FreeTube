<template>
  <div>
    <template v-if="unlocked">
      <template
        v-for="(settingsComponent, i) in sortedSettingsSectionComponents"
      >
        <hr
          v-if="i !== 0"
          :key="settingsComponent.type + 'hr'"
        >
        <component
          :is="settingsComponent.type"
          :key="settingsComponent.type + 'component'"
        />
      </template>
    </template>
    <password-dialog
      v-else
      @unlocked="unlocked = true"
    />
  </div>
</template>

<script src="./Settings.js" />
<style scoped src="./Settings.css" />
