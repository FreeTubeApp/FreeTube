<template>
  <ft-card
    class="relative card">
    <h3
      class="videoTitle"
    >
      {{ title }}
    </h3>
    <div class="switchColumnGrid">
      <div class="switchColumn">
        <ft-toggle-switch
          label="Remember History"
          :compact="true"
          :default-value="rememberHistory"
          @change="updateRememberHistory"
        />
        <ft-toggle-switch
          label="Enable Subtitles by Default"
          :compact="true"
          :default-value="enableSubtitles"
          @change="updateEnableSubtitles"
        />
        <ft-toggle-switch
          label="Force Local Backend for Legacy Formats"
          :compact="true"
          :default-value="forceLocalBackendForLegacy"
          @change="updateForceLocalBackendForLegacy"
        />
        <ft-toggle-switch
          label="Proxy Videos Through Invidious"
          :compact="true"
          :default-value="proxyVideos"
          @change="updateProxyVideos"
        />
      </div>
      <div class="switchColumn">
        <ft-toggle-switch
          label="Autoplay Videos"
          :compact="true"
          :default-value="autoplayVideos"
          @change="updateAutoplayVideos"
        />
        <ft-toggle-switch
          label="Autoplay Playlists"
          :compact="true"
          :default-value="autoplayPlaylists"
          @change="updateAutoplayPlaylists"
        />
        <ft-toggle-switch
          label="Play Next Video"
          :compact="true"
          :default-value="playNextVideo"
          @change="updatePlayNextVideo"
        />
        <ft-toggle-switch
          label="Enable Theatre Mode by Default"
          :compact="true"
          :default-value="defaultTheatreMode"
          @change="updateDefaultTheatreMode"
        />
      </div>
    </div>
    <ft-flex-box>
      <ft-slider
        label="Default Volume"
        :default-value="defaultVolume"
        :min-value="0"
        :max-value="100"
        :step="1"
        value-extension="%"
        @change="parseVolumeBeforeUpdate"
      />
      <ft-slider
        label="Default Playback Rate"
        :default-value="defaultPlayback"
        :min-value="0.25"
        :max-value="3"
        :step="0.25"
        value-extension="x"
        @change="updateDefaultPlayback"
      />
    </ft-flex-box>
    <ft-flex-box>
      <ft-select
        placeholder="Default Video Format"
        :value="defaultVideoFormat"
        :select-names="formatNames"
        :select-values="formatValues"
        @change="updateDefaultVideoFormat"
      />
      <ft-select
        placeholder="Default Quality"
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
