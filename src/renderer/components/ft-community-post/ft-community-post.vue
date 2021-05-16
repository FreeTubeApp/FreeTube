<template>
  <div
    v-if="!isLoading"
  >
    <img
      :src="authorThumbnails[1].url"
      class="communityThumbnail"
    >
    <p v-html="postText" />
    <img
      v-if="type === 'image'"
      :src="postContent.content[2].url"
    >
    <div
      v-if="type === 'video'"
    >
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
            :to="{
              path: `/watch/${postContent.content.videoId}`,
              query: playlistId ? {playlistId} : {}
            }"
          >
            <img
              :src="postContent.content.thumbnails[1].url"
              class="thumbnailImage"
            >
          </router-link>
          <ft-icon-button
            :title="$t('Video.Save Video')"
            icon="star"
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
            title="More Options"
            theme="base-no-default"
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
              path: `/watch/${postContent.content.videoId}`,
              query: playlistId ? {playlistId} : {}
            }"
          >
            {{ postContent.content.title }}
          </router-link>
          <div class="infoLine">
            <router-link
              class="channelName"
              :to="`/channel/${postContent.content.author}`"
            >
              <span>{{ postContent.content.author }}</span>
            </router-link>
            <template v-if="!hideViews">
              <span class="viewCount">• {{ postContent.content.viewCountText }}</span>
              <span v-if="postContent.content.viewCountText === 1">{{ $t("Video.View").toLowerCase() }}</span>
              <span v-else>{{ $t("Video.Views").toLowerCase() }}</span>
            </template>
            <span
              v-if="postContent.content.publishedText !== ''&& !inHistory"
              class="uploadedTime"
            >• {{ uploadedTime }}</span>
            <span
              v-if="inHistory"
              class="uploadedTime"
            >• {{ publishedText }}</span>
          </div>
          <p
            v-if="listType !== 'grid' && appearance === 'result'"
            class="description"
          >
            {{ postContent.content.description }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./ft-community-post.js" />
<style scoped src="./ft-community-post.sass" lang="sass" />
