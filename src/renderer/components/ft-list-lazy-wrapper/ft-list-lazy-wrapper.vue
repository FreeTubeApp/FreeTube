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
        v-if="data.type === 'video' || data.type === 'shortVideo'"
        :appearance="appearance"
        :data="data"
        :show-video-with-last-viewed-playlist="showVideoWithLastViewedPlaylist"
      />
      <ft-list-channel
        v-else-if="data.type === 'channel'"
        :appearance="appearance"
        :data="data"
      />
      <ft-list-playlist
        v-else-if="data.type === 'playlist'"
        :appearance="appearance"
        :data="data"
      />
      <ft-community-post
        v-else-if="data.type === 'community'"
        :hide-videos-with-forbidden-text-in-title="hideVideosWithForbiddenTextInTitle"
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
