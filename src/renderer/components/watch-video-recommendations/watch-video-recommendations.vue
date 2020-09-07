<template>
  <ft-card class="relative watchVideoRecommendations">
    <h3>
      {{ $t("Up Next") }}
    </h3>
    <ft-toggle-switch
      v-if="!watchingPlaylist"
      class="autoPlayToggle"
      :label="$t('Video.Autoplay')"
      :compact="true"
      :default-value="playNextVideo"
      @change="updatePlayNextVideo"
    />
    <ft-list-video
      v-for="(video, index) in data"
      :key="index"
      :data="video"
      appearance="recommendation"
      force-list-type="list"
    />
  </ft-card>
</template>

<script src="./watch-video-recommendations.js" />
<style scoped src="./watch-video-recommendations.css" />
