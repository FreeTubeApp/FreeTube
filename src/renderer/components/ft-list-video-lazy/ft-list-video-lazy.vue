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
      :force-list-type="forceListType"
      :appearance="appearance"
      @pause-player="$emit('pause-player')"
      @move-video-up="(id) => $emit('move-video-up', id)"
      @move-video-down="(id) => $emit('move-video-down', id)"
    />
  </div>
</template>

<script src="./ft-list-video-lazy.js" />
