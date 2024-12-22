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
        :default-value="playNextVideo"
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
import { computed } from 'vue'

import FtCard from '../ft-card/ft-card.vue'
import FtListVideoLazy from '../ft-list-video-lazy/ft-list-video-lazy.vue'
import FtToggleSwitch from '../ft-toggle-switch/ft-toggle-switch.vue'

import store from '../../store/index'

defineProps({
  data: {
    type: Array,
    required: true
  },
  showAutoplay: {
    type: Boolean,
    default: false
  }
})

const playNextVideo = computed(() => {
  return store.getters.getPlayNextVideo
})

/**
 * @param {boolean} value
 */
function updatePlayNextVideo(value) {
  store.dispatch('updatePlayNextVideo', value)
}
</script>

<style scoped src="./WatchVideoRecommendations.css" />
