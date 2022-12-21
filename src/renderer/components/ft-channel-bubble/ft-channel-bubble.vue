<template>
  <div
    class="bubblePadding"
    tabindex="0"
    :aria-labelledby="sanitizedId"
    @click="handleClick"
    @keydown.space.enter.prevent="handleClick($event)"
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
    <div
      :id="sanitizedId"
      class="channelName"
    >
      {{ channelName }}
    </div>
  </div>
</template>

<script src="./ft-channel-bubble.js" />
<style scoped src="./ft-channel-bubble.css" />
