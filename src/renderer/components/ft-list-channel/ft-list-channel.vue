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
        class="channelThumbnailLink"
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
    <div class="infoAndSubscribe">
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
          <router-link
            v-if="handle !== null"
            class="handle"
            :to="`/channel/${id}`"
          >
            {{ handle }}
          </router-link>
          <span
            v-if="subscriberCount !== null && !hideChannelSubscriptions"
            class="subscriberCount"
          >
            <template v-if="handle !== null"> • </template>
            {{ $tc('Global.Counts.Subscriber Count', subscriberCount, {count: formattedSubscriberCount}) }}
          </span>
          <span
            v-if="handle == null && videoCount != null"
            class="videoCount"
          >
            <template v-if="subscriberCount !== null && !hideChannelSubscriptions"> • </template>
            {{ $tc('Global.Counts.Video Count', videoCount, {count: formattedVideoCount}) }}
          </span>
        </div>
        <p
          v-if="listType !== 'grid'"
          class="description"
          v-html="description"
        />
      </div>
      <ft-subscribe-button
        class="channelSubscribeButton"
        :channel-id="id"
        :channel-name="channelName"
        :channel-thumbnail="thumbnail"
      />
    </div>
  </div>
</template>

<script src="./ft-list-channel.js" />
<style scoped lang="scss" src="./ft-list-channel.scss" />
