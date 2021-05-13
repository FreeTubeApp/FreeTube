<template>
  <ft-card
    class="relative card"
  >
    <h3
      class="videoTitle"
    >
      {{ $t("Settings.Player Settings.Player Settings") }}
    </h3>
    <div class="switchColumnGrid">
      <div class="switchColumn">
        <ft-toggle-switch
          v-if="false"
          label="Enable Subtitles by Default"
          :compact="true"
          :default-value="enableSubtitles"
          @change="updateEnableSubtitles"
        />
        <ft-toggle-switch
          :label="$t('Settings.Player Settings.Force Local Backend for Legacy Formats')"
          :compact="true"
          :disabled="backendPreference === 'local'"
          :default-value="forceLocalBackendForLegacy"
          :tooltip="$t('Tooltips.Player Settings.Force Local Backend for Legacy Formats')"
          @change="updateForceLocalBackendForLegacy"
        />
        <ft-toggle-switch
          :label="$t('Settings.Player Settings.Proxy Videos Through Invidious')"
          :compact="true"
          :default-value="proxyVideos"
          :tooltip="$t('Tooltips.Player Settings.Proxy Videos Through Invidious')"
          @change="updateProxyVideos"
        />
        <ft-toggle-switch
          :label="$t('Settings.Player Settings.Enable Theatre Mode by Default')"
          :compact="true"
          :default-value="defaultTheatreMode"
          @change="updateDefaultTheatreMode"
        />
      </div>
      <div class="switchColumn">
        <ft-toggle-switch
          :label="$t('Settings.Player Settings.Autoplay Videos')"
          :compact="true"
          :default-value="autoplayVideos"
          @change="updateAutoplayVideos"
        />
        <ft-toggle-switch
          :label="$t('Settings.Player Settings.Autoplay Playlists')"
          :compact="true"
          :default-value="autoplayPlaylists"
          @change="updateAutoplayPlaylists"
        />
        <ft-toggle-switch
          :label="$t('Settings.Player Settings.Play Next Video')"
          :compact="true"
          :disabled="hideRecommendedVideos"
          :default-value="playNextVideo"
          @change="updatePlayNextVideo"
        />
      </div>
    </div>
    <ft-flex-box>
      <ft-slider
        :label="$t('Settings.Player Settings.Next Video Interval')"
        :default-value="defaultInterval"
        :min-value="0"
        :max-value="60"
        :step="1"
        value-extension="s"
        @change="updateDefaultInterval"
      />
      <ft-slider
        :label="$t('Settings.Player Settings.Default Volume')"
        :default-value="defaultVolume"
        :min-value="0"
        :max-value="100"
        :step="1"
        value-extension="%"
        @change="parseVolumeBeforeUpdate"
      />
      <ft-slider
        :label="$t('Settings.Player Settings.Default Playback Rate')"
        :default-value="defaultPlayback"
        :min-value="0.25"
        :max-value="3"
        :step="0.25"
        value-extension="×"
        @change="updateDefaultPlayback"
      />
    </ft-flex-box>
    <ft-flex-box>
      <ft-select
        :placeholder="$t('Settings.Player Settings.Default Video Format.Default Video Format')"
        :value="defaultVideoFormat"
        :select-names="formatNames"
        :select-values="formatValues"
        :tooltip="$t('Tooltips.Player Settings.Default Video Format')"
        @change="updateDefaultVideoFormat"
      />
      <ft-select
        :placeholder="$t('Settings.Player Settings.Default Quality.Default Quality')"
        :value="defaultQuality"
        :select-names="qualityNames"
        :select-values="qualityValues"
        @change="updateDefaultQuality"
      />
    </ft-flex-box>
  </ft-card>
</template>

<script src="./player-settings.js" />
<style scoped lang="sass" src="./player-settings.sass" />
