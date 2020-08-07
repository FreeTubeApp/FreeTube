<template>
  <ft-card class="relative watchVideoRecommendations">
    <h3>
      {{ $t("Up Next") }}
    </h3>
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
