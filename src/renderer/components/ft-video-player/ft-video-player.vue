<template>
  <div
    class="relative"
    :class="{
      'vjs-using-touch': usingTouch,
      'vjs-hide-play-button': !displayVideoPlayButton
    }"
    @mouseover="handleMouseOver"
  >
    <video
      ref="video"
      class="ftVideoPlayer video-js vjs-default-skin dark"
      :poster="thumbnail"
      controls
      preload="auto"
      :data-setup="JSON.stringify(dataSetup)"
      crossorigin="anonymous"
      @touchstart="handleTouchStart"
    >
      <source
        v-for="(source, index) in activeSourceList"
        :key="index + '_source'"
        :src="source.url"
        :type="source.type || source.mimeType"
        :label="source.qualityLabel"
        :selected="source.qualityLabel === selectedDefaultQuality"
      >
    </video>
  </div>
</template>

<script src="./ft-video-player.js" />
<style scoped src="./ft-video-player.css" />
