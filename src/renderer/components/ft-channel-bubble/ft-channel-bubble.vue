<template>
  <router-link
    v-if="!showSelected"
    class="bubblePadding"
    :class="{
      sideNavGrid
    }"
    :aria-labelledby="sanitizedId"
    :title="showTitle ? null : channelName"
    :to="`/channel/${channelId}`"
  >
    <img
      class="bubble"
      :style="{
        blockSize: bubbleSize + 'px',
        inlineSize: bubbleSize + 'px'
      }"
      :src="channelThumbnail"
      alt=""
    >
    <div
      v-if="showTitle"
      :id="sanitizedId"
      class="channelName"
    >
      {{ channelName }}
    </div>
  </router-link>
  <div
    v-else
    class="bubblePadding"
    role="button"
    tabindex="0"
    :aria-labelledby="sanitizedId"
    :title="showTitle ? null : channelName"
    @click="handleClick"
    @keydown.space.enter.prevent="handleClick($event)"
  >
    <img
      class="bubble"
      :style="{
        blockSize: bubbleSize + 'px',
        inlineSize: bubbleSize + 'px'
      }"
      :src="channelThumbnail"
      alt=""
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
      v-show="showTitle"
      class="channelName"
    >
      {{ channelName }}
    </div>
  </div>
</template>

<script src="./ft-channel-bubble.js" />
<style scoped src="./ft-channel-bubble.css" />
