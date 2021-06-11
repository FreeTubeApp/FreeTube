<template>
  <ft-card
    class="relative card"
  >
    <h3>
      {{ $t("Settings.Theme Settings.Theme Settings") }}
    </h3>
    <ft-flex-box>
      <ft-toggle-switch
        :label="$t('Settings.Theme Settings.Match Top Bar with Main Color')"
        :default-value="barColor"
        @change="updateBarColor"
      />
      <ft-toggle-switch
        :label="$t('Settings.Theme Settings.Expand Side Bar by Default')"
        :default-value="expandSideBar"
        @change="handleExpandSideBar"
      />
      <ft-toggle-switch
        :label="$t('Settings.Theme Settings.Disable Smooth Scrolling')"
        :default-value="disableSmoothScrollingToggleValue"
        @change="handleRestartPrompt"
      />
    </ft-flex-box>
    <ft-flex-box>
      <ft-slider
        :label="$t('Settings.Theme Settings.UI Scale')"
        :default-value="uiScale"
        :min-value="minUiScale"
        :max-value="maxUiScale"
        :step="uiScaleStep"
        value-extension="%"
        @change="updateUiScale(parseInt($event))"
      />
    </ft-flex-box>
    <br>
    <ft-flex-box>
      <ft-select
        :placeholder="$t('Settings.Theme Settings.Base Theme.Base Theme')"
        :value="currentBaseTheme"
        :select-names="baseThemeNames"
        :select-values="baseThemeValues"
        @change="updateBaseTheme"
      />
      <ft-select
        :placeholder="$t('Settings.Theme Settings.Main Color Theme.Main Color Theme')"
        :value="currentMainColor"
        :select-names="colorNames"
        :select-values="colorValues"
        @change="updateMainColor"
      />
      <ft-select
        :placeholder="$t('Settings.Theme Settings.Secondary Color Theme')"
        :value="currentSecColor"
        :select-names="colorNames"
        :select-values="colorValues"
        @change="updateSecColor"
      />
    </ft-flex-box>
    <ft-prompt
      v-if="showRestartPrompt"
      :label="restartPromptMessage"
      :option-names="restartPromptNames"
      :option-values="restartPromptValues"
      @click="handleSmoothScrolling"
    />
  </ft-card>
</template>

<script src="./theme-settings.js" />
<style scoped src="./theme-settings.css" />
