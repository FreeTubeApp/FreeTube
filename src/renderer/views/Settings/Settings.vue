<template>
  <div>
    <template v-if="unlocked">
      <div
        v-for="(settingsComponent, i) in sortedSettingsSectionComponents"
        :key="i"
      >
        <hr v-if="i !== 0">
        <component
          :is="settingsComponent.type"
        />
      </div>
    </template>
    <password-dialog
      v-else
      @unlocked="unlocked = true"
    />
  </div>
</template>

<script src="./Settings.js" />
<style scoped src="./Settings.css" />
