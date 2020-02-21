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
