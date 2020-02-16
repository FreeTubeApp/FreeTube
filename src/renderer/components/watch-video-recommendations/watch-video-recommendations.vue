<template>
  <ft-card class="relative">
    <h3>
      Up Next
    </h3>
    <ft-list-video
      v-for="(video, index) in data"
      :key="index"
      :data="video"
      force-list-type="list"
      class="videoRecommendation"
    />
  </ft-card>
</template>

<script src="./watch-video-recommendations.js" />
<style scoped src="./watch-video-recommendations.css" />
