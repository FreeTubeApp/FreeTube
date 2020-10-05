<template>
  <div
    class="ft-list-channel ft-list-item"
    :class="{
      list: listType === 'list',
      grid: listType === 'grid',
      [appearance]: true
    }"
  >
    <div class="channelThumbnail">
      <router-link
        :to="`/channel/${id}`"
      >
        <img
          :src="thumbnail"
          class="channelImage"
        >
      </router-link>
    </div>
    <div class="info">
      <router-link
        class="title"
        :to="`/channel/${id}`"
      >
        {{ channelName }}
      </router-link>
      <div class="infoLine">
        <span
          class="subscriberCount"
          v-if="subscriberCount !== null"
        >
          {{ subscriberCount }} subscribers -
        </span>
        <span
          class="videoCount"
        >
           {{ videoCount }} videos
        </span>
      </div>
      <p
        v-if="listType !== 'grid'"
        class="description"
      >
        {{ description }}
      </p>
    </div>
  </div>
</template>

<script src="./ft-list-channel.js" />
<style scoped lang="sass" src="./ft-list-channel.sass" />
