<template>
  <ft-settings-section
    :title="$t('Settings.External Player Settings.External Player Settings')"
  >
    <div class="switchColumnGrid">
      <div class="switchColumn">
        <ft-select
          :placeholder="$t('Settings.External Player Settings.External Player')"
          :value="externalPlayer"
          :select-names="externalPlayerNames"
          :select-values="externalPlayerValues"
          :tooltip="$t('Tooltips.External Player Settings.External Player')"
          @change="updateExternalPlayer"
        />
      </div>
      <div class="switchColumn">
        <ft-toggle-switch
          :label="$t('Settings.External Player Settings.Ignore Unsupported Action Warnings')"
          :default-value="externalPlayerIgnoreWarnings"
          :disabled="externalPlayer===''"
          :compact="true"
          :tooltip="$t('Tooltips.External Player Settings.Ignore Warnings')"
          @change="updateExternalPlayerIgnoreWarnings"
        />
      </div>
    </div>
    <ft-flex-box
      v-if="externalPlayer !== ''"
      class="settingsFlexStart460px"
    >
      <ft-input
        :placeholder="$t('Settings.External Player Settings.Custom External Player Executable')"
        :show-action-button="false"
        :show-label="true"
        :value="externalPlayerExecutable"
        :tooltip="$t('Tooltips.External Player Settings.Custom External Player Executable')"
        @input="updateExternalPlayerExecutable"
      />
      <ft-input
        :placeholder="$t('Settings.External Player Settings.Custom External Player Arguments')"
        :show-action-button="false"
        :show-label="true"
        :value="externalPlayerCustomArgs"
        :tooltip="externalPlayerCustomArgsTooltip"
        @input="updateExternalPlayerCustomArgs"
      />
    </ft-flex-box>
  </ft-settings-section>
</template>

<script src="./external-player-settings.js" />
