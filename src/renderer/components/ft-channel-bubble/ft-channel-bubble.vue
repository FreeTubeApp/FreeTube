<template>
  <div class="bubblePadding" role="toggle-bubble" @click="handleClick">
    <img data-testid="image" class="bubble" :src="channelThumbnail" />
    <div v-if="selected" class="bubble selected">
      <font-awesome-icon data-testid="font" icon="check" class="icon" />
    </div>
    <div class="channelName">
      {{ channelName }}
    </div>
  </div>
</template>

<script src="./ft-channel-bubble.js" />
<style scoped src="./ft-channel-bubble.css" />
