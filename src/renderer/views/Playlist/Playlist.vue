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
      :first-video-playlist-item-id="firstVideoPlaylistItemId"
      :playlist-thumbnail="playlistThumbnail"
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
      :is-invidious-playlist="isInvidiousPlaylist"
      :origin="origin"
      :more-video-data-available="moreVideoDataAvailable"
      class="playlistInfo"
      :class="{
        promptOpen,
      }"
      @enter-edit-mode="playlistInEditMode = true"
      @exit-edit-mode="playlistInEditMode = false"
      @prompt-open="promptOpen = true"
      @prompt-close="promptOpen = false"
    />

    <ft-card
      v-if="!isLoading"
      class="playlistItems"
    >
      <template
        v-if="playlistItems.length > 0"
      >
        <transition-group
          name="playlistItem"
          tag="span"
        >
          <ft-list-video-numbered
            v-for="(item, index) in visiblePlaylistItems"
            :key="`${item.videoId}-${item.playlistItemId || index}`"
            class="playlistItem"
            :data="item"
            :playlist-id="playlistId"
            :playlist-type="infoSource"
            :playlist-index="index"
            :playlist-item-id="item.playlistItemId"
            appearance="result"
            :always-show-add-to-playlist-button="true"
            :quick-bookmark-button-enabled="quickBookmarkButtonEnabled"
            :can-move-video-up="index > 0"
            :can-move-video-down="index < visiblePlaylistItems.length - 1"
            :can-remove-from-playlist="true"
            :video-index="index"
            :initial-visible-state="index < 10"
            :origin="origin"
            :is-invidious-playlist="isInvidiousPlaylist"
            @move-video-up="moveVideoUp(item.videoId, item.playlistItemId)"
            @move-video-down="moveVideoDown(item.videoId, item.playlistItemId)"
            @remove-from-playlist="removeVideoFromPlaylist(item.videoId, item.playlistItemId)"
          />
        </transition-group>
        <ft-flex-box
          v-if="moreVideoDataAvailable && !isLoadingMore"
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
      </template>
      <ft-flex-box
        v-else
      >
        <p class="message">
          {{ $t("User Playlists['This playlist currently has no videos.']") }}
        </p>
      </ft-flex-box>
    </ft-card>
  </div>
</template>

<script src="./Playlist.js" />
<style scoped src="./Playlist.scss" lang="scss" />
