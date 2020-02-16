<template>
  <ft-card class="videoDescription">
    <h4>Published on {{ dateString }}</h4>
    <p
      class="description"
      v-html="shownDescription"
    />
  </ft-card>
</template>

<script src="./watch-video-description.js" />
<style scoped src="./watch-video-description.css" />
