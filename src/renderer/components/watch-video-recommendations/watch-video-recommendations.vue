<template>
  <ft-card
    v-if="!hideRecommendedVideos"
    class="relative watchVideoRecommendations"
  >
    <div class="VideoRecommendationsTopBar">
      <h3>
        {{ $t("Up Next") }}
      </h3>
      <ft-toggle-switch
        v-if="showAutoplay"
        class="autoPlayToggle"
        :label="$t('Video.Autoplay')"
        :compact="true"
        :default-value="playNextVideo"
        @change="updatePlayNextVideo"
      />
    </div>
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
