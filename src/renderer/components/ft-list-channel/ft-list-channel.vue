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
        aria-hidden="true"
      >
        <img
          :src="thumbnail"
          class="channelImage"
          alt=""
        >
      </router-link>
    </div>
    <div class="info">
      <router-link
        class="title"
        :to="`/channel/${id}`"
      >
        <h3 class="h3Title">
          {{ channelName }}
        </h3>
      </router-link>
      <div class="infoLine">
        <span
          v-if="subscriberCount !== null && !hideChannelSubscriptions"
          class="subscriberCount"
        >
          {{ $tc('Global.Counts.Subscriber Count', subscriberCount, {count: formattedSubscriberCount}) }}
        </span>
        <router-link
          v-if="handle !== null"
          class="handle"
          :to="`/channel/${id}`"
        >
          {{ handle }}
        </router-link>
        <span
          v-else
          class="videoCount"
        >
          {{ $tc('Global.Counts.Video Count', videoCount, {count: formattedVideoCount}) }}
        </span>
      </div>
      <p
        v-if="listType !== 'grid'"
        class="description"
        v-html="description"
      />
    </div>
  </div>
</template>

<script src="./ft-list-channel.js" />
<style scoped lang="scss" src="./ft-list-channel.scss" />
