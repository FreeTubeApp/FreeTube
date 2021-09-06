<template>
  <div
    class="bubblePadding"
    tabindex="0"
    :aria-labelledby="'channelBubble-' + $unspace(channelName)"
    @click="handleClick"
    @keydown="handleClick($event)"
  >
    <img
      class="bubble"
      :src="channelThumbnail"
      alt=""
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
    <div
      :id="'channelBubble' + $unspace(channelName)"
      class="channelName"
    >
      {{ channelName }}
    </div>
  </div>
</template>

<script src="./ft-channel-bubble.js" />
<style scoped src="./ft-channel-bubble.css" />
