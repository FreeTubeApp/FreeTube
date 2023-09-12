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
      :first-video-unique-id="firstVideoUniqueId"
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
      :more-video-data-available="moreVideoDataAvailable"
      class="playlistInfo"
      @enter-edit-mode="playlistInEditMode = true"
      @exit-edit-mode="playlistInEditMode = false"
    />

    <ft-card
      v-if="!isLoading"
      class="playlistItems"
    >
      <span
        v-if="playlistItems.length > 0"
      >
        <transition-group
          name="playlistItem"
          tag="span"
        >
          <div
            v-for="(item, index) in playlistItems"
            :key="`${item.videoId}-${item.uniqueId || index}`"
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
              :unique-id="item.uniqueId"
              appearance="result"
              force-list-type="list"
              :always-show-add-to-playlist-button="true"
              :can-move-video-up="index > 0"
              :can-move-video-down="index < playlistItems.length - 1"
              :can-remove-from-playlist="true"
              @move-video-up="moveVideoUp(item.videoId, item.uniqueId)"
              @move-video-down="moveVideoDown(item.videoId, item.uniqueId)"
              @remove-from-playlist="removeVideoFromPlaylist(item.videoId, item.uniqueId)"
            />
          </div>
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
<style scoped src="./Playlist.scss" lang="scss" />
