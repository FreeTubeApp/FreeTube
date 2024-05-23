<template>
  <ft-auto-grid
    :grid="displayValue !== 'list'"
  >
    <ft-list-lazy-wrapper
      v-for="(result, index) in data"
      :key="`${dataType || result.type}-${result.videoId || result.playlistId || result.postId || result.id || result._id || result.authorId || result.title}-${index}-${result.lastUpdatedAt || 0}`"
      appearance="result"
      :data="result"
      :data-type="dataType || result.type"
      :first-screen="index < 16"
      :layout="displayValue"
      :show-video-with-last-viewed-playlist="showVideoWithLastViewedPlaylist"
      :use-channels-hidden-preference="useChannelsHiddenPreference"
      :hide-forbidden-titles="hideForbiddenTitles"
      :always-show-add-to-playlist-button="alwaysShowAddToPlaylistButton"
      :quick-bookmark-button-enabled="quickBookmarkButtonEnabled"
      :can-move-video-up="canMoveVideoUp && index > 0"
      :can-move-video-down="canMoveVideoDown && index < playlistItemsLength - 1"
      :can-remove-from-playlist="canRemoveFromPlaylist"
      :show-video-added-to-playlist-count="showVideoAddedToPlaylistCount"
      :search-query-text="searchQueryText"
      :playlist-id="playlistId"
      :playlist-type="playlistType"
      :playlist-item-id="result.playlistItemId"
      @move-video-up="moveVideoUp(result.videoId, result.playlistItemId)"
      @move-video-down="moveVideoDown(result.videoId, result.playlistItemId)"
      @remove-from-playlist="removeFromPlaylist(result.videoId, result.playlistItemId)"
    />
  </ft-auto-grid>
</template>

<script src="./ft-element-list.js" />
<style scoped src="./ft-element-list.css" />
