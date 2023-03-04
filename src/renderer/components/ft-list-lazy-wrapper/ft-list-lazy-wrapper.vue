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
    <ft-list-channel
      v-if="data.type === 'channel' && visible"
      :appearance="appearance"
      :data="data"
    />
    <ft-list-video
      v-else-if="(data.type === 'video' || data.type === 'shortVideo') && visible"
      :appearance="appearance"
      :data="data"
      :show-video-with-last-viewed-playlist="showVideoWithLastViewedPlaylist"
    />
    <ft-list-playlist
      v-else-if="data.type === 'playlist' && visible"
      :appearance="appearance"
      :data="data"
    />
    <ft-community-post
      v-else-if="data.type === 'community' && visible"
      :appearance="appearance"
      :data="data"
    />
  </div>
</template>

<script src="./ft-list-lazy-wrapper.js" />
<style scoped src="./ft-list-lazy-wrapper.css" />
