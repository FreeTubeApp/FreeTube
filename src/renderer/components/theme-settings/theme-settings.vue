<template>
  <ft-settings-section
    :title="$t('Settings.Theme Settings.Theme Settings')"
  >
    <div class="switchColumnGrid">
      <div class="switchColumn">
        <ft-toggle-switch
          :label="$t('Settings.Theme Settings.Match Top Bar with Main Color')"
          :compact="true"
          :default-value="barColor"
          @change="updateBarColor"
        />
        <ft-toggle-switch
          :label="$t('Settings.Theme Settings.Expand Side Bar by Default')"
          :compact="true"
          :default-value="expandSideBar"
          @change="handleExpandSideBar"
        />
        <ft-toggle-switch
          v-if="usingElectron"
          :label="$t('Settings.Theme Settings.Disable Smooth Scrolling')"
          :compact="true"
          :default-value="disableSmoothScrollingToggleValue"
          @change="handleRestartPrompt"
        />
      </div>
      <div class="switchColumn">
        <ft-toggle-switch
          :label="$t('Settings.Theme Settings.Hide Side Bar Labels')"
          :compact="true"
          :default-value="hideLabelsSideBar"
          @change="updateHideLabelsSideBar"
        />
        <ft-toggle-switch
          :label="$t('Settings.Theme Settings.Hide FreeTube Header Logo')"
          :compact="true"
          :default-value="hideHeaderLogo"
          @change="updateHideHeaderLogo"
        />
      </div>
    </div>
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
        :value="baseTheme"
        :select-names="baseThemeNames"
        :select-values="baseThemeValues"
        @change="updateBaseTheme"
      />
      <ft-select
        :placeholder="$t('Settings.Theme Settings.Main Color Theme.Main Color Theme')"
        :value="mainColor"
        :select-names="colorNames"
        :select-values="colorValues"
        @change="updateMainColor"
      />
      <ft-select
        :placeholder="$t('Settings.Theme Settings.Secondary Color Theme')"
        :value="secColor"
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
  </ft-settings-section>
</template>

<script src="./theme-settings.js" />
