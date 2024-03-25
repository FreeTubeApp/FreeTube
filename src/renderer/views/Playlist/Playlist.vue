<template>
  <div>
    <ft-loader
      v-if="isLoading"
      :fullscreen="true"
    />
    <div
      v-else-if="isInvidiousPlaylist && !fetchIVPlaylist"
      class="messageContainer"
    >
      <p
        class="message"
      >
        {{ backendPreference === 'invidious' ? $t('Playlist.Invidious Playlist Cannot Be Viewed IV', {currentInstance: currentInvidiousInstance, invidiousInstance: origin}) : $t('Playlist.Invidious Playlist Cannot Be Viewed Local', { invidiousInstance: origin }) }}
      </p>
      <font-awesome-icon
        :icon="['fas', 'exclamation-circle']"
        class="errorIcon"
      />
      <ft-button
        :label="$t('Playlist.View Playlist')"
        class="viewPlaylist"
        @click="enableViewPlaylist"
      />
    </div>
    <template v-else>
      <playlist-info
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
        :search-video-mode-allowed="searchVideoModeAllowed"
        :search-video-mode-enabled="playlistInVideoSearchMode"
        :search-query-text="searchQueryTextRequested"
        class="playlistInfo"
        :class="{
          promptOpen,
        }"
        @enter-edit-mode="playlistInEditMode = true"
        @exit-edit-mode="playlistInEditMode = false"
        @search-video-mode-on="playlistInVideoSearchMode = true"
        @search-video-mode-off="playlistInVideoSearchMode = false"
        @search-video-query-change="(v) => videoSearchQuery = v"
        @prompt-open="promptOpen = true"
        @prompt-close="promptOpen = false"
      />

      <ft-card
        class="playlistItems"
      >
        <template
          v-if="playlistItems.length > 0"
        >
          <template
            v-if="visiblePlaylistItems.length > 0"
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
                :playlist-index="playlistInVideoSearchMode ? playlistItems.findIndex(i => i === item) : index"
                :playlist-item-id="item.playlistItemId"
                appearance="result"
                :always-show-add-to-playlist-button="true"
                :quick-bookmark-button-enabled="quickBookmarkButtonEnabled"
                :can-move-video-up="index > 0 && !playlistInVideoSearchMode"
                :can-move-video-down="index < playlistItems.length - 1 && !playlistInVideoSearchMode"
                :can-remove-from-playlist="true"
                :video-index="playlistInVideoSearchMode ? playlistItems.findIndex(i => i === item) : index"
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
              {{ $t("User Playlists['Empty Search Message']") }}
            </p>
          </ft-flex-box>
        </template>
        <ft-flex-box
          v-else
        >
          <p class="message">
            {{ $t("User Playlists['This playlist currently has no videos.']") }}
          </p>
        </ft-flex-box>
      </ft-card>
    </template>
  </div>
</template>

<script src="./Playlist.js" />
<style scoped src="./Playlist.scss" lang="scss" />
