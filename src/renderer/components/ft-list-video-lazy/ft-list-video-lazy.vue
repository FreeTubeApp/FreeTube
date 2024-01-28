<template>
  <div
    v-observe-visibility="{
      callback: onVisibilityChanged,
      once: true,
    }"
    :style="{ display }"
  >
    <ft-list-video
      v-if="visible"
      :data="data"
      :playlist-id="playlistId"
      :playlist-type="playlistType"
      :playlist-index="playlistIndex"
      :playlist-reverse="playlistReverse"
      :playlist-shuffle="playlistShuffle"
      :playlist-loop="playlistLoop"
      :playlist-item-id="playlistItemId"
      :force-list-type="forceListType"
      :appearance="appearance"
      :always-show-add-to-playlist-button="alwaysShowAddToPlaylistButton"
      :quick-bookmark-button-enabled="quickBookmarkButtonEnabled"
      :can-move-video-up="canMoveVideoUp"
      :can-move-video-down="canMoveVideoDown"
      :can-remove-from-playlist="canRemoveFromPlaylist"
      @pause-player="$emit('pause-player')"
      @move-video-to-the-top="$emit('move-video-to-the-top')"
      @move-video-to-the-bottom="$emit('move-video-to-the-bottom')"
      @move-video-up="$emit('move-video-up')"
      @move-video-down="$emit('move-video-down')"
      @remove-from-playlist="$emit('remove-from-playlist')"
    />
  </div>
</template>

<script src="./ft-list-video-lazy.js" />
