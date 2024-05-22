<template>
  <div
    v-if="showResult"
    v-observe-visibility="firstScreen ? false : {
      callback: onVisibilityChanged,
      once: true,
    }"
    :class="{
      grid: layout === 'grid',
      list: layout === 'list'
    }"
  >
    <template
      v-if="visible"
    >
      <ft-list-video
        v-if="finalDataType === 'video' || finalDataType === 'shortVideo'"
        :appearance="appearance"
        :data="data"
        :playlist-id="playlistId"
        :playlist-type="playlistType"
        :playlist-item-id="playlistItemId"
        :show-video-with-last-viewed-playlist="showVideoWithLastViewedPlaylist"
        :always-show-add-to-playlist-button="alwaysShowAddToPlaylistButton"
        :quick-bookmark-button-enabled="quickBookmarkButtonEnabled"
        :can-move-video-up="canMoveVideoUp"
        :can-move-video-down="canMoveVideoDown"
        :can-remove-from-playlist="canRemoveFromPlaylist"
        @move-video-up="moveVideoUp"
        @move-video-down="moveVideoDown"
        @remove-from-playlist="removeFromPlaylist"
      />
      <ft-list-channel
        v-else-if="finalDataType === 'channel'"
        :appearance="appearance"
        :data="data"
      />
      <ft-list-playlist
        v-else-if="finalDataType === 'playlist'"
        :appearance="appearance"
        :data="data"
        :search-query-text="searchQueryText"
      />
      <ft-community-post
        v-else-if="finalDataType === 'community'"
        :hide-forbidden-titles="hideForbiddenTitles"
        :appearance="appearance"
        :data="data"
      />
      <ft-list-hashtag
        v-else-if="data.type === 'hashtag'"
        :appearance="appearance"
        :data="data"
      />
    </template>
  </div>
</template>

<script src="./ft-list-lazy-wrapper.js" />
<style scoped src="./ft-list-lazy-wrapper.css" />
