<template>
  <div
    class="bubblePadding"
    tabindex="0"
    @click="handleClick"
    @keydown="handleClick($event)"
  >
    <img
      class="bubble"
      :src="channelThumbnail"
    >
    <div
      v-if="selected"
      class="bubble selected"
    >
      <font-awesome-icon
        icon="check"
        class="icon"
      />
    </div>
    <div class="channelName">
      {{ channelName }}
    </div>
  </div>
</template>

<script src="./ft-channel-bubble.js" />
<style scoped src="./ft-channel-bubble.css" />
