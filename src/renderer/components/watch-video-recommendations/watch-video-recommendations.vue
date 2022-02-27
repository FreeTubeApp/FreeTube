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
    <template
      v-for="(video, index) in data"
    >
      <ft-list-video
        v-if="!isChannelBlocked(video)"
        :key="index"
        :data="video"
        appearance="recommendation"
        force-list-type="list"
        :channel-blocked="isChannelBlocked(video)"
        @toggle-blocked-channel="toggleBlockedChannel"
      />
    </template>
  </ft-card>
</template>

<script src="./watch-video-recommendations.js" />
<style scoped src="./watch-video-recommendations.css" />
