<template>
  <div
    class="ft-list-channel"
    :class="{ list: listType === 'list', grid: listType === 'grid' }"
  >
    <div class="channelThumbnail">
      <img
        :src="thumbnail"
        @click="goToChannel(id)"
      >
    </div>
    <p
      class="channelName"
      @click="goToChannel(id)"
    >
      {{ channelName }}
    </p>
    <span
      class="subscriberCount"
      @click="goToChannel(id)"
    >
      {{ subscriberCount }} subscribers
    </span>
    <span
      class="videoCount"
      @click="goToChannel(id)"
    >
      - {{ videoCount }} videos
    </span>
    <p
      v-if="listType !== 'grid'"
      class="description"
    >
      {{ description }}
    </p>
  </div>
</template>

<script src="./ft-list-channel.js" />
<style scoped src="./ft-list-channel.css" />
