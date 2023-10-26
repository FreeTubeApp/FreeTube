<template>
  <div>
    <template v-if="unlocked">
      <template
        v-for="(settingsComponent, i) in sortedSettingsSectionComponents"
        :key="settingsComponent.type"
      >
        <hr v-if="i !== 0">
        <component
          :is="settingsComponent.type"
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
