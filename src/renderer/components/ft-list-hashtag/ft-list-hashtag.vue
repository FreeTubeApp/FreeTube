<template>
  <div
    class="ft-list-hashtag ft-list-item"
    :class="{
      list: listType === 'list',
      grid: listType === 'grid',
      [appearance]: true
    }"
  >
    <div class="channelThumbnail">
      <router-link
        tabindex="-1"
        aria-hidden="true"
        :to="url"
      >
        <font-awesome-icon
          class="hashtagImage"
          :icon="['fas', 'hashtag']"
        />
      </router-link>
    </div>
    <div class="info">
      <router-link
        class="title"
        :to="url"
      >
        {{ title }}
      </router-link>
      <div class="infoLine">
        <span
          v-if="channelCount"
          class="channelCount"
        >
          {{ parsedChannelCount }}
          <template v-if="channelCount === 1">{{ $t("Hashtag.Channel").toLowerCase() }}</template>
          <template v-else>{{ $t("Hashtag.Channels").toLowerCase() }}</template>
        </span>
        <span
          v-if="videoCount"
          class="videoCount"
        >
          <template v-if="channelCount"> • </template>
          {{ parsedVideosCount }}
          <template v-if="videoCount === 1">{{ $t("Hashtag.Video").toLowerCase() }}</template>
          <template v-else>{{ $t("Hashtag.Videos").toLowerCase() }}</template>
        </span>
      </div>
    </div>
  </div>
</template>

<script src="./ft-list-hashtag.js" />
<style scoped lang="scss" src="./ft-list-hashtag.scss" />
