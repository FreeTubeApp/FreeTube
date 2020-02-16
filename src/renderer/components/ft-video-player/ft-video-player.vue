<template>
  <div class="relative">
    <video
      :id="id"
      class="ftVideoPlayer video-js vjs-default-skin"
      width="800"
      height="600"
      controls
      preload="auto"
      :data-setup="JSON.stringify(dataSetup)"
    >
      <source
        :src="src"
        type="video/mp4"
      >
    </video>
  </div>
</template>

<script src="./ft-video-player.js" />
<style scoped src="./ft-video-player.css" />
