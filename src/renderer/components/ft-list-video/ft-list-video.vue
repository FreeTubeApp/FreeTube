<template>
  <div
    class="ft-list-video ft-list-item"
    :class="{
      list: (listType === 'list' || forceListType === 'list') && forceListType !== 'grid',
      grid: (listType === 'grid' || forceListType === 'list') && forceListType !== 'list',
      [appearance]: true
    }"
  >
    <div
      class="videoThumbnail"
    >
      <router-link
        class="thumbnailLink"
        :to="{
          path: `/watch/${id}`,
          query: playlistId ? {playlistId} : {}
        }"
      >
        <img
          :src="thumbnail"
          class="thumbnailImage"
        >
      </router-link>
      <div
        class="videoDuration"
        :class="{ live: isLive }"
      >
        {{ isLive ? "Live" : duration }}
      </div>
      <ft-icon-button
        v-if="!isLive"
        icon="star"
        class="favoritesIcon"
        :padding="6"
        :size="18"
        :class="{ favorited: isFavorited }"
        @click="toggleSave(id)"
      />
      <div
        v-if="watched"
        class="videoWatched"
      >
        Watched
      </div>
      <div
        v-if="watched"
        class="watchedProgressBar"
        :style="{width: progressPercentage + '%'}"
      />
    </div>
    <div class="info">
      <ft-icon-button
        class="optionsButton"
        title="More Options"
        theme="base"
        :size="16"
        :use-shadow="false"
        dropdown-position-x="left"
        :dropdown-names="optionsNames"
        :dropdown-values="optionsValues"
        @click="handleOptionsClick"
      />
      <router-link
        class="title"
        :to="{
          path: `/watch/${id}`,
          query: playlistId ? {playlistId} : {}
        }"
      >
        {{ title }}
      </router-link>
      <div class="infoLine">
        <router-link class="channelName" :to="`/channel/${channelId}`">{{ channelName }}</router-link>
        <span v-if="!isLive && !hideViews" class="viewCount">• {{ viewCount }} views</span>
        <span v-if="uploadedTime !== '' && !isLive" class="uploadedTime">• {{ uploadedTime }}</span>
        <span v-if="isLive" class="viewCount">• {{ viewCount }} watching</span>
      </div>
      <p
        v-if="listType !== 'grid' && appearance === 'result'"
        class="description"
      >
        {{ description }}
      </p>
    </div>
  </div>
</template>

<script src="./ft-list-video.js" />
<style scoped src="./ft-list-video.sass" lang="sass" />
