<template>
  <div
    class="ft-list-video"
    :class="{
      list: (listType === 'list' || forceListType === 'list') && forceListType !== 'grid',
      grid: (listType === 'grid' || forceListType === 'list') && forceListType !== 'list'
    }"
  >
    <div class="videoThumbnail">
      <img
        :src="thumbnail"
        @click="play(id)"
      >
      <p
        v-if="!isLive"
        class="videoDuration"
        @click="play(id)"
      >
        {{ duration }}
      </p>
      <font-awesome-icon
        v-if="!isLive"
        icon="star"
        class="favoritesIcon"
        :class="{ favorited: isFavorited }"
        @click="toggleSave(id)"
      />
      <div
        v-if="watched"
        class="videoWatched"
      >
        WATCHED
      </div>
      <div
        v-if="watched"
        class="watchedProgressBar"
        :style="{width: progressPercentage + '%'}"
      />
    </div>
    <p class="videoTitle">
      {{ title }}
    </p>
    <p
      class="channelName"
      @click="goToChannel"
    >
      {{ channelName }}
    </p>
    <span
      v-if="!isLive && !hideViews"
      class="viewCount"
    >
      {{ viewCount }} views
    </span>
    <span
      v-if="uploadedTime !== '' && !isLive"
      class="uploadedTime"
    >
      - {{ uploadedTime }}
    </span>
    <span
      v-if="isLive"
      class="viewCount"
    >
      {{ viewCount }} watching
    </span>
    <p
      v-if="listType !== 'grid'"
      class="description"
    >
      {{ description }}
    </p>
    <span
      v-if="isLive"
      class="liveText"
    >
      LIVE NOW
    </span>
  </div>
</template>

<script src="./ft-list-video.js" />
<style scoped src="./ft-list-video.css" />
