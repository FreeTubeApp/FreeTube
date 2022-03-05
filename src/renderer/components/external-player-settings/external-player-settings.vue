<template>
  <details>
    <summary>
      <h3>
        {{ $t("Settings.External Player Settings.External Player Settings") }}
      </h3>
    </summary>
    <hr>
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
      class="externalPlayerSettingsFlexBox"
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
  </details>
</template>

<script src="./external-player-settings.js" />
<style scoped lang="sass" src="./external-player-settings.sass" />
