<template>
  <div class="settingsPage">
    <template v-if="unlocked">
      <ft-settings-menu
        :settings-sections="settingsSectionComponents"
        @scroll-to-section="scrollToSection"
      />
      <div class="settingsContent">
        <div class="switchRow">
          <ft-toggle-switch
            class="settingsToggle"
            :label="$t('Settings.Sort Settings Sections (A-Z)')"
            :default-value="settingsSectionSortEnabled"
            :compact="false"
            @change="updateSettingsSectionSortEnabled"
          />
        </div>
        <div class="settingsSections">
          <template
            v-for="(settingsComponent) in settingsSectionComponents"
          >
            <component
              :is="settingsComponent.type"
              :id="settingsComponent.type"
              :ref="settingsComponent.type"
              :key="settingsComponent.type + '-component'"
              class="section"
            />
          </template>
        </div>
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
