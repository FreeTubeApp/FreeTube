<template>
  <ft-auto-grid
    :grid="listType !== 'list'"
  >
    <ft-list-lazy-wrapper
      v-for="(result, index) in data"
      :key="index"
      appearance="result"
      :data="result"
      :first-screen="index < 16"
      :layout="listType"
      :show-video-with-last-viewed-playlist="showVideoWithLastViewedPlaylist"
    />
  </ft-auto-grid>
</template>

<script src="./ft-element-list.js" />
<style scoped src="./ft-element-list.css" />
