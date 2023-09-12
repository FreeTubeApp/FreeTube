<template>
  <div
    v-observe-visibility="{
      callback: onVisibilityChanged,
      once: true,
    }"
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
      :unique-id="uniqueId"
      :force-list-type="forceListType"
      :appearance="appearance"
      :always-show-add-to-playlist-button="alwaysShowAddToPlaylistButton"
      :can-move-video-up="canMoveVideoUp"
      :can-move-video-down="canMoveVideoDown"
      :can-remove-from-playlist="canRemoveFromPlaylist"
      @pause-player="$emit('pause-player')"
      @move-video-up="$emit('move-video-up')"
      @move-video-down="$emit('move-video-down')"
      @remove-from-playlist="$emit('remove-from-playlist')"
    />
  </div>
</template>

<script src="./ft-list-video-lazy.js" />
