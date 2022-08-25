<template>
  <div
    class="bubblePadding"
    @click="handleClick"
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
        :icon="['fas', 'check']"
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
