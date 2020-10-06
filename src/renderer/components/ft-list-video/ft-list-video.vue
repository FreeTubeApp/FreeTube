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
        v-if="isLive || duration !== '0:00'"
        class="videoDuration"
        :class="{ live: isLive }"
      >
        {{ isLive ? $t("Video.Live") : duration }}
      </div>
      <ft-icon-button
        v-if="!isLive"
        icon="star"
        class="favoritesIcon"
        :padding="appearance === `watchPlaylistItem` ? 5 : 6"
        :size="appearance === `watchPlaylistItem` ? 14 : 18"
        :class="{ favorited: isFavorited }"
        @click="toggleSave(id)"
      />
      <div
        v-if="watched"
        class="videoWatched"
      >
        {{ $t("Video.Watched") }}
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
        <router-link
          class="channelName"
          :to="`/channel/${channelId}`"
        >
          <span>{{ channelName }}</span>
        </router-link>
        <span
          v-if="!isLive && !hideViews"
          class="viewCount"
        >• {{ parsedViewCount }}</span>
        <span v-if="viewCount === 1">{{ $t("Video.View") }}</span>
        <span v-else-if="parsedViewCount !== ''">{{ $t("Video.Views").toLowerCase() }}</span>
        <span
          v-if="uploadedTime !== '' && !isLive && !inHistory"
          class="uploadedTime"
        >• {{ uploadedTime }}</span>
        <span
          v-if="inHistory"
          class="uploadedTime"
        >• {{ publishedText }}</span>
        <span
          v-if="isLive && !hideViews"
          class="viewCount"
        >• {{ viewCount }} {{ $t("Video.Watching").toLowerCase() }}</span>
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
