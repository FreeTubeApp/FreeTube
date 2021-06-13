<template>
  <ft-card
    class="relative card"
  >
    <h3
      class="videoTitle"
    >
      {{ $t("Settings.External Player Settings.External Player Settings") }}
    </h3>
    <div class="switchColumnGrid">
      <div class="switchColumn">
        <ft-select
          :placeholder="$t('Settings.External Player Settings.External Player')"
          :value="externalPlayer"
          :select-names="externalPlayerNames"
          :select-values="externalPlayerValues"
          :tooltip="$t('Tooltips.External Player Settings.External Player')"
          @change="handleUpdateExternalPlayer"
        />
      </div>
      <div class="switchColumn">
        <ft-toggle-switch
          :label="$t('Settings.External Player Settings.Ignore Unsupported Action Warnings')"
          :default-value="externalPlayerIgnoreWarnings"
          :compact="true"
          :tooltip="$t('Tooltips.External Player Settings.Ignore Warnings')"
          @change="updateExternalPlayerIgnoreWarnings"
        />
      </div>
    </div>
    <ft-flex-box class="externalPlayerSettingsFlexBox">
      <ft-input
        v-if="externalPlayer !== ''"
        :placeholder="$t('Settings.External Player Settings.Custom External Player Executable')"
        :show-arrow="false"
        :show-label="true"
        :value="externalPlayerExecutable"
        :tooltip="$t('Tooltips.External Player Settings.Custom External Player Executable')"
        @input="handleUpdateExternalPlayerExecutable"
      />
      <ft-input
        v-if="externalPlayer !== ''"
        :placeholder="$t('Settings.External Player Settings.Custom External Player Arguments')"
        :show-arrow="false"
        :show-label="true"
        :value="externalPlayerCustomArgs"
        :tooltip="$t('Tooltips.External Player Settings.Custom External Player Arguments')"
        @input="handleUpdateExternalPlayerCustomArgs"
      />
    </ft-flex-box>
  </ft-card>
</template>

<script src="./external-player-settings.js" />
<style scoped lang="sass" src="./external-player-settings.sass" />
