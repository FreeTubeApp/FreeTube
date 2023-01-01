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
      :playlist-index="playlistIndex"
      :playlist-reverse="playlistReverse"
      :playlist-shuffle="playlistShuffle"
      :playlist-loop="playlistLoop"
      :force-list-type="forceListType"
      :appearance="appearance"
      @pause-player="$emit('pause-player')"
    />
  </div>
</template>

<script src="./ft-list-video-lazy.js" />
