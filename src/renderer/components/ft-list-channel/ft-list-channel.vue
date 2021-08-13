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
        tabindex="-1"
      >
        <img
          :src="thumbnail"
          class="channelImage"
          alt=""
        >
      </router-link>
    </div>
    <div class="info">
      <h2 class="resultHeading">
        <router-link
          class="title"
          :to="`/channel/${id}`"
        >
          {{ channelName }}
        </router-link>
      </h2>
      <div class="infoLine">
        <span
          v-if="subscriberCount !== null"
          class="subscriberCount"
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
