<template>
  <div>
    <ft-loader
      v-if="isLoading"
      :fullscreen="true"
    />

    <playlist-info
      v-if="!isLoading"
      :id="playlistId"
      :first-video-id="firstVideoId"
      :title="playlistTitle"
      :channel-name="channelName"
      :channel-thumbnail="channelThumbnail"
      :channel-id="channelId"
      :last-updated="lastUpdated"
      :description="playlistDescription"
      :video-count="videoCount"
      :videos="playlistItems"
      :view-count="viewCount"
      :info-source="infoSource"
      class="playlistInfo"
    />

    <ft-card
      v-if="!isLoading"
      class="playlistItems"
    >
      <span
        v-if="playlistItems.length > 0"
      >
        <div
          v-for="(item, index) in playlistItems"
          :key="`${item.videoId}-${index}`"
          class="playlistItem"
        >
          <p
            class="videoIndex"
          >
            {{ index + 1 }}
          </p>
          <ft-list-video-lazy
            :data="item"
            :playlist-id="playlistId"
            :playlist-type="infoSource"
            :playlist-index="index"
            appearance="result"
            force-list-type="list"
            :can-move-video-up="index > 0"
            :can-move-video-down="index < playlistItems.length - 1"
            @move-video-up="moveVideoUp"
            @move-video-down="moveVideoDown"
          />
        </div>
        <ft-flex-box
          v-if="continuationData !== null && !isLoadingMore"
        >
          <ft-button
            :label="$t('Subscriptions.Load More Videos')"
            background-color="var(--primary-color)"
            text-color="var(--text-with-main-color)"
            @click="getNextPage"
          />
        </ft-flex-box>
        <div
          v-if="isLoadingMore"
          class="loadNextPageWrapper"
        >
          <ft-loader />
        </div>
      </span>
      <ft-flex-box
        v-else
      >
        <p class="message">
          This playlist currently has no videos.
        </p>
      </ft-flex-box>
    </ft-card>
  </div>
</template>

<script src="./Playlist.js" />
<style scoped src="./Playlist.css" />
