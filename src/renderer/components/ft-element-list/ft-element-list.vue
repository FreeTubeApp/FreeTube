<template>
  <ft-auto-grid
    :grid="displayValue !== 'list'"
    :usingFtCardWrapper = usingFtCardWrapper
  >
    <ft-list-lazy-wrapper
      v-for="(result, index) in data"
      :key="`${result.type}-${result.videoId || result.playlistId || result.postId || result.id || result.authorId}-${index}`"
      appearance="result"
      :data="result"
      :first-screen="index < 16"
      :layout="displayValue"
      :show-video-with-last-viewed-playlist="showVideoWithLastViewedPlaylist"
      :use-channels-hidden-preference="useChannelsHiddenPreference"
      :using-ft-card-wrapper="usingFtCardWrapper"
    />
  </ft-auto-grid>
</template>

<script src="./ft-element-list.js" />
<style scoped src="./ft-element-list.css" />
