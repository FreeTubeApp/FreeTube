<template>
  <div
    class="bubblePadding"
    @click="goToChannel(channelId)"
  >
    <img
      class="bubble"
      :src="channelThumbnail"
    >
    <div class="channelName">
      {{ channelName }}
    </div>
  </div>
</template>

<script src="./ft-channel-bubble.js" />
<style scoped src="./ft-channel-bubble.css" />
