<template>
  <ft-card
    v-if="shownDescription.length > 0"
    class="videoDescription"
  >
    <ft-timestamp-catcher
      class="description"
      :input-html="shownDescription"
      @timestamp-event="onTimestamp"
    />
  </ft-card>
</template>

<script src="./watch-video-description.js" />
<style scoped src="./watch-video-description.css" />
