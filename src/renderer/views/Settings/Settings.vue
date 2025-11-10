<template>
  <div class="settingsPage">
    <template v-if="unlocked">
      <div v-show="settingsSectionTypeOpenInMobile != null">
        <button
          class="returnToMenuMobileButton"
          :aria-label="$t('Settings.Return to Settings Menu')"
          :title="$t('Settings.Return to Settings Menu')"
          @click="returnToSettingsMenu"
        >
          <font-awesome-icon
            class="returnToMenuMobileIcon"
            :icon="['fas', 'angle-left']"
          />
        </button>
      </div>
      <ft-settings-menu
        v-show="isInDesktopView || settingsSectionTypeOpenInMobile == null"
        :settings-sections="settingsSectionComponents"
        @navigate-to-section="navigateToSection"
      />
      <div
        v-show="isInDesktopView || settingsSectionTypeOpenInMobile != null"
        class="settingsContent"
      >
        <div class="switchRow">
          <ft-button
            v-if="usingElectron"
            :label="$t('KeyboardShortcutPrompt.Show Keyboard Shortcuts')"
            :icon="['fas', 'keyboard']"
            @click="showKeyboardShortcutPrompt"
          />
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
            :key="settingsComponent.type"
          >
            <component
              :is="settingsComponent.type"
              :ref="settingsComponent.type"
              :class="{ hideOnMobile: settingsSectionTypeOpenInMobile !== settingsComponent.type }"
              class="section"
            />
          </template>
        </div>
      </div>
    </template>
    <password-dialog
      v-else
      @unlocked="handleUnlock"
    />
  </div>
</template>

<script src="./Settings.js" />
<style scoped src="./Settings.css" />
