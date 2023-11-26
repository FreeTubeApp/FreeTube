<template>
  <router-link
    v-if="!showSelected"
    class="bubblePadding"
    :aria-labelledby="sanitizedId"
    :to="`/channel/${channelId}`"
  >
    <img
      v-if="channelThumbnail !== '_'"
      class="bubble"
      :src="channelThumbnail"
      alt=""
    >
    <font-awesome-icon
      v-else
      class="bubble"
      :icon="['fas', 'circle-user']"
    />
    <div
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
    @click="handleClick"
    @keydown.space.enter.prevent="handleClick($event)"
  >
    <img
      v-if="channelThumbnail !== '_'"
      class="bubble"
      :src="channelThumbnail"
      alt=""
    >
    <font-awesome-icon
      v-else
      class="bubble"
      :icon="['fas', 'circle-user']"
    />
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
