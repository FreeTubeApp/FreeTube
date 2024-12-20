<template>
  <div class="settingsPage">
    <template v-if="unlocked">
      <div v-show="settingsSectionTypeOpenInMobile != null">
        <font-awesome-icon
          :icon="['fas', 'angle-left']"
          class="returnToMenuMobileIcon"
          role="button"
          :title="$t('Settings.Return to Settings Menu')"
          tabindex="0"
          @click="returnToSettingsMenu"
          @keydown.space.enter="returnToSettingsMenu"
        />
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
          >
            <component
              :is="settingsComponent.type"
              :ref="settingsComponent.type"
              :key="settingsComponent.type"
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
