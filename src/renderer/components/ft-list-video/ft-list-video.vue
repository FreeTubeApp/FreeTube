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
    <ft-icon-button
      class="optionsButton"
      title="More Options"
      theme="base"
      :use-shadow="false"
      dropdown-position="left"
      :dropdown-names="optionsNames"
      :dropdown-values="optionsValues"
      @click="handleOptionsClick"
    />
    <p
      class="videoTitle"
      @click="play(id)"
    >
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
      @click="play(id)"
    >
      {{ viewCount }} views
    </span>
    <span
      v-if="uploadedTime !== '' && !isLive"
      class="uploadedTime"
      @click="play(id)"
    >
      - {{ uploadedTime }}
    </span>
    <span
      v-if="isLive"
      class="viewCount"
      @click="play(id)"
    >
      {{ viewCount }} watching
    </span>
    <p
      v-if="listType !== 'grid'"
      class="description"
      @click="play(id)"
    >
      {{ description }}
    </p>
    <span
      v-if="isLive"
      class="liveText"
      @click="play(id)"
    >
      LIVE NOW
    </span>
  </div>
</template>

<script src="./ft-list-video.js" />
<style scoped src="./ft-list-video.css" />
