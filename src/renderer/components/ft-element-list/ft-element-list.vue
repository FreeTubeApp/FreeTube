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
    />
  </ft-auto-grid>
</template>

<script src="./ft-element-list.js" />
<style scoped src="./ft-element-list.css" />
