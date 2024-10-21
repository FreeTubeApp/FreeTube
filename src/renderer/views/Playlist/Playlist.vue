<template>
  <div
    :class="{ [listType]: true, playlistInEditMode, hasNoPlaylistDescription: !playlistDescription, oneOrFewer: videoCount < 2 }"
    class="playlistPage"
  >
    <ft-loader
      v-if="isLoading"
      :fullscreen="true"
    />
    <div
      v-if="!isLoading"
      class="playlistInfoContainer"
      :class="{
        promptOpen,
      }"
    >
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
        :more-video-data-available="moreVideoDataAvailable"
        :search-video-mode-allowed="isUserPlaylistRequested && videoCount > 1"
        :search-video-mode-enabled="playlistInVideoSearchMode"
        :search-query-text="searchQueryTextRequested"
        :theme="listType === 'list' ? 'base' : 'top-bar'"
        class="playlistInfo"
        @enter-edit-mode="playlistInEditMode = true"
        @exit-edit-mode="playlistInEditMode = false"
        @search-video-query-change="(v) => videoSearchQuery = v"
        @prompt-open="promptOpen = true"
        @prompt-close="promptOpen = false"
      />
    </div>

    <ft-card
      v-if="!isLoading"
      class="playlistItemsCard"
    >
      <template
        v-if="playlistItems.length > 0"
      >
        <ft-select
          v-if="isUserPlaylistRequested && playlistItems.length > 1"
          class="sortSelect"
          :value="sortOrder"
          :select-names="sortBySelectNames"
          :select-values="sortBySelectValues"
          :placeholder="$t('Playlist.Sort By.Sort By')"
          :icon="getIconForSortPreference(sortOrder)"
          @change="updateUserPlaylistSortOrder"
        />
        <template
          v-if="visiblePlaylistItems.length > 0"
        >
          <ft-element-list
            v-if="listType === 'grid'"
            :data="visiblePlaylistItems"
            display="grid"
            :playlist-id="playlistId"
            :playlist-type="infoSource"
            :show-video-with-last-viewed-playlist="true"
            :use-channels-hidden-preference="false"
            :hide-forbidden-titles="false"
            :always-show-add-to-playlist-button="true"
            :quick-bookmark-button-enabled="quickBookmarkButtonEnabled"
            :can-move-video-up="!playlistInVideoSearchMode && isSortOrderCustom"
            :can-move-video-down="!playlistInVideoSearchMode && isSortOrderCustom"
            :playlist-items-length="playlistItems.length"
            :can-remove-from-playlist="true"
            @move-video-up="moveVideoUp"
            @move-video-down="moveVideoDown"
            @remove-from-playlist="removeVideoFromPlaylist"
          />
          <transition-group
            v-else
            name="playlistItem"
            tag="span"
            class="playlistItems"
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
              :can-move-video-up="index > 0 && !playlistInVideoSearchMode && isSortOrderCustom"
              :can-move-video-down="index < playlistItems.length - 1 && !playlistInVideoSearchMode && isSortOrderCustom"
              :can-remove-from-playlist="true"
              :video-index="playlistInVideoSearchMode ? playlistItems.findIndex(i => i === item) : index"
              :initial-visible-state="index < 10"
              @move-video-up="moveVideoUp(item.videoId, item.playlistItemId)"
              @move-video-down="moveVideoDown(item.videoId, item.playlistItemId)"
              @remove-from-playlist="removeVideoFromPlaylist(item.videoId , item.playlistItemId)"
            />
          </transition-group>
          <ft-auto-load-next-page-wrapper
            v-if="moreVideoDataAvailable && !isLoadingMore"
            @load-next-page="getNextPage"
          >
            <ft-flex-box>
              <ft-button
                :label="$t('Subscriptions.Load More Videos')"
                background-color="var(--primary-color)"
                text-color="var(--text-with-main-color)"
                @click="getNextPage"
              />
            </ft-flex-box>
          </ft-auto-load-next-page-wrapper>
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
  </div>
</template>

<script src="./Playlist.js" />
<style scoped src="./Playlist.scss" lang="scss" />
