<template>
  <ft-auto-grid
    :grid="displayValue !== 'list'"
  >
    <ft-list-lazy-wrapper
      v-for="(result, index) in data"
      :key="`${result.type}-${result.videoId || result.playlistId || result.postId || result.id || result.authorId || result.title}-${index}`"
      appearance="result"
      :data="result"
      :first-screen="index < 16"
      :layout="displayValue"
      :show-video-with-last-viewed-playlist="showVideoWithLastViewedPlaylist"
      :use-channels-hidden-preference="useChannelsHiddenPreference"
      :hide-videos-with-forbidden-text-in-title="hideVideosWithForbiddenTextInTitle"
    />
  </ft-auto-grid>
</template>

<script src="./ft-element-list.js" />
<style scoped src="./ft-element-list.css" />
