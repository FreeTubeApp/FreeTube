<template>
  <div>
    <template v-if="unlocked">
      <div class="switchRow">
        <ft-toggle-switch
          class="settingsToggle"
          :label="$t('Settings.Expand All Settings Sections')"
          :default-value="allSettingsSectionsExpandedByDefault"
          :compact="false"
          @change="updateAllSettingsSectionsExpandedByDefault"
        />
        <ft-toggle-switch
          class="settingsToggle"
          :label="$t('Settings.Sort Settings Sections (A-Z)')"
          :default-value="settingsSectionSortEnabled"
          :compact="false"
          @change="updateSettingsSectionSortEnabled"
        />
      </div>
      <template
        v-for="(settingsComponent, i) in settingsSectionComponents"
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
