<template>
  <ft-card
    class="relative card">
    <h3
      class="videoTitle"
    >
      {{ title }}
    </h3>
    <ft-flex-box>
      <ft-toggle-switch
        label="Remember History"
      />
      <ft-toggle-switch
        label="Autoplay Videos"
      />
      <ft-toggle-switch
        label="Autoplay Playlists"
      />
      <ft-toggle-switch
        label="Play Next Video"
      />
      <ft-toggle-switch
        label="Enable Subtitles by Default"
      />
      <ft-toggle-switch
        label="Force Local Backend for Legacy Formats"
      />
      <ft-toggle-switch
        label="Proxy Videos Through Invidious"
      />
    </ft-flex-box>
    <br>
    <ft-flex-box>
      <ft-slider
        label="Default Volume"
        :default-value="100"
        :min-value="0"
        :max-value="100"
        :step="1"
        value-extension="%"
      />
      <ft-slider
        label="Default Playback Rate"
        :default-value="1"
        :min-value="0.25"
        :max-value="3"
        :step="0.25"
        value-extension="x"
      />
    </ft-flex-box>
    <br>
    <ft-flex-box>
      <ft-select
        placeholder="Default Video Format"
        :value="formatValues[0]"
        :select-names="formatNames"
        :select-values="formatValues"
      />
      <ft-select
        placeholder="Default Quality"
        :value="qualityValues[0]"
        :select-names="qualityNames"
        :select-values="qualityValues"
      />
    </ft-flex-box>
  </ft-card>
</template>

<script src="./player-settings.js" />
<style scoped src="./player-settings.css" />
