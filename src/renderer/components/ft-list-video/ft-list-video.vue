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
        aria-hidden="true"
        :to="{
          path: `/watch/${id}`,
          query: playlistIdFinal ? {playlistId: playlistIdFinal} : {}
        }"
      >
        <img
          :src="thumbnail"
          class="thumbnailImage"
          alt=""
          :style="{filter: blurThumbnailsStyle}"
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
        :hide-label="true"
        :title="$t('Video.External Player.OpenInTemplate', { externalPlayer })"
        :icon="['fas', 'external-link-alt']"
        class="externalPlayerIcon"
        theme="base"
        :padding="appearance === `watchPlaylistItem` ? 6 : 7"
        :size="appearance === `watchPlaylistItem` ? 12 : 16"
        @click="handleExternalPlayer"
      />
      <ft-icon-button
        v-if="!isUpcoming"
        :hide-label="true"
        :title="$t('Video.Save Video')"
        :icon="['fas', 'star']"
        class="favoritesIcon"
        :class="{ favorited: favoriteIconTheme === 'base favorite'}"
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
        :style="{inlineSize: progressPercentage + '%'}"
      />
    </div>
    <div class="info">
      <router-link
        class="title"
        :to="{
          path: `/watch/${id}`,
          query: playlistIdFinal ? {playlistId: playlistIdFinal} : {}
        }"
      >
        <h3 class="h3Title">
          {{ displayTitle }}
        </h3>
      </router-link>
      <div class="infoLine">
        <router-link
          v-if="channelId !== null"
          class="channelName"
          :to="`/channel/${channelId}`"
        >
          <span>{{ channelName }}</span>
        </router-link>
        <template v-if="!isLive && !isUpcoming && !isPremium && !hideViews">
          <span class="viewCount">
            <template v-if="channelId !== null"> • </template>
            {{ $tc('Global.Counts.View Count', viewCount, {count: parsedViewCount}) }}
          </span>
        </template>
        <span
          v-if="uploadedTime !== '' && !isLive && !inHistory"
          class="uploadedTime"
        > • {{ uploadedTime }}</span>
        <span
          v-if="inHistory"
          class="uploadedTime"
        > • {{ publishedText }}</span>
        <span
          v-if="isLive && !hideViews"
          class="viewCount"
        > • {{ $tc('Global.Counts.Watching Count', viewCount, {count: parsedViewCount}) }}</span>
      </div>
      <ft-icon-button
        class="optionsButton"
        :hide-label="true"
        :icon="['fas', 'ellipsis-v']"
        title="More Options"
        theme="base-no-default"
        :size="16"
        :use-shadow="false"
        dropdown-position-x="left"
        :dropdown-options="dropdownOptions"
        @click="handleOptionsClick"
      />
      <p
        v-if="listType !== 'grid' && appearance === 'result'"
        class="description"
        v-html="description"
      />
    </div>
  </div>
</template>

<script src="./ft-list-video.js" />
<style scoped src="./ft-list-video.scss" lang="scss" />
