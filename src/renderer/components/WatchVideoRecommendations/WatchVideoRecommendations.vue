<template>
  <FtCard
    class="relative watchVideoRecommendations"
  >
    <div class="VideoRecommendationsTopBar">
      <h3>
        {{ $t("Up Next") }}
      </h3>
      <FtToggleSwitch
        v-if="showAutoplay"
        class="autoPlayToggle"
        :label="$t('Video.Autoplay')"
        :compact="true"
        :default-value="playNextRecommendedVideo"
        @change="updatePlayNextVideo"
      />
    </div>
    <FtListVideoLazy
      v-for="(video, index) in data"
      :key="index"
      :data="video"
      appearance="recommendation"
      force-list-type="list"
      :use-channels-hidden-preference="true"
    />
  </FtCard>
</template>

<script setup>
import FtCard from '../ft-card/ft-card.vue'
import FtListVideoLazy from '../ft-list-video-lazy/ft-list-video-lazy.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'

defineProps({
  data: {
    type: Array,
    required: true
  },
  showAutoplay: {
    type: Boolean,
    default: false
  },
  playNextRecommendedVideo: {
    type: Boolean,
    required: true
  },
})

const emit = defineEmits(['play-next-recommended-video-update'])

/**
 * @param {boolean} value
 */
function updatePlayNextVideo(value) {
  emit('play-next-recommended-video-update', value)
}
</script>

<style scoped src="./WatchVideoRecommendations.css" />
