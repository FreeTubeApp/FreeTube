<template>
  <div class="relative">
    <video
      :id="id"
      class="ftVideoPlayer video-js vjs-default-skin"
      controls
      preload="auto"
      :data-setup="JSON.stringify(dataSetup)"
    >
      <source
        v-for="(source, index) in activeSourceList"
        :key="index + '_source'"
        :src="source.url"
        :type="source.type || source.mimeType"
        :label="source.qualityLabel"
      />
      <track
        v-for="(caption, index) in captionList"
        :key="index + '_caption'"
        kind="subtitles"
        :src="caption.baseUrl || caption.url"
        :srclang="caption.languageCode"
        :label="caption.label || caption.name.simpleText"
        :type="caption.type"
      >
    </video>
  </div>
</template>

<script src="./ft-video-player.js" />
<style scoped src="./ft-video-player.css" />
