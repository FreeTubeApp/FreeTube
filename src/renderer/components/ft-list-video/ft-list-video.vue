<template>
  <div
    class="ft-list-video ft-list-item"
    :class="{
      list: (listType === 'list' || forceListType === 'list') && forceListType !== 'grid',
      grid: (listType === 'grid' || forceListType === 'list') && forceListType !== 'list',
      [appearance]: true,
      watched: addWatchedStyle
    }"
  >
    <div
      class="videoThumbnail"
    >
      <router-link
        class="thumbnailLink"
        tabindex="-1"
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
        :class="{
          live: isLive,
          upcoming: isUpcoming
        }"
      >
        {{ isLive ? $t("Video.Live") : (isUpcoming ? $t("Video.Upcoming") : duration) }}
      </div>
      <ft-icon-button
        v-if="externalPlayer !== ''"
        :title="$t('Video.External Player.OpenInTemplate', { externalPlayer })"
        :icon="['fas', 'external-link-alt']"
        class="externalPlayerIcon"
        theme="base"
        :padding="appearance === `watchPlaylistItem` ? 6 : 7"
        :size="appearance === `watchPlaylistItem` ? 12 : 16"
        @click="handleExternalPlayer"
      />
      <ft-icon-button
        v-if="!isLive"
        :title="$t('Video.Save Video')"
        :icon="['fas', 'star']"
        class="favoritesIcon"
        :theme="favoriteIconTheme"
        :padding="appearance === `watchPlaylistItem` ? 5 : 6"
        :size="appearance === `watchPlaylistItem` ? 14 : 18"
        @click="toggleSave"
      />
      <div
        v-if="addWatchedStyle"
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
        :icon="['fas', 'ellipsis-v']"
        title="More Options"
        theme="base-no-default"
        :size="16"
        :use-shadow="false"
        dropdown-position-x="left"
        :dropdown-options="dropdownOptions"
        @click="handleOptionsClick"
      />
      <router-link
        class="title"
        :to="{
          path: `/watch/${id}`,
          query: playlistId ? {playlistId} : {}
        }"
      >
        {{ displayTitle }}
      </router-link>
      <div class="infoLine">
        <router-link
          class="channelName"
          :to="`/channel/${channelId}`"
        >
          <span>{{ channelName }}</span>
        </router-link>
        <template v-if="!isLive && !isUpcoming && !isPremium && !hideViews">
          <span class="viewCount">• {{ parsedViewCount }}</span>
          <span v-if="viewCount === 1">{{ $t("Video.View").toLowerCase() }}</span>
          <span v-else>{{ $t("Video.Views").toLowerCase() }}</span>
        </template>
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
        >• {{ parsedViewCount }} {{ $t("Video.Watching").toLowerCase() }}</span>
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
<style scoped src="./ft-list-video.scss" lang="scss" />
