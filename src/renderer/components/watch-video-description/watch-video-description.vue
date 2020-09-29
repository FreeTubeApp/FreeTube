<template>
  <ft-card class="videoDescription">
    <ft-timestamp-catcher
      class="description"
      :inputHTML="shownDescription"
      @timestampEvent="onTimestamp"
    />
  </ft-card>
</template>

<script src="./watch-video-description.js" />
<style scoped src="./watch-video-description.css" />
