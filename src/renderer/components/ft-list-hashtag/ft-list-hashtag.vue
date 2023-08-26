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
        <h3 class="h3Title">
          {{ title }}
        </h3>
      </router-link>
      <div class="infoLine">
        <span
          v-if="channelCount"
          class="channelCount"
        >
          {{ $tc('Global.Counts.Channel Count', channelCount, {count: parsedChannelCount}) }}
        </span>
        <span
          v-if="videoCount"
          class="videoCount"
        >
          <template v-if="channelCount"> • </template>
          {{ $tc('Global.Counts.Video Count', videoCount, {count: parsedVideosCount}) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script src="./ft-list-hashtag.js" />
<style scoped lang="scss" src="./ft-list-hashtag.scss" />
