<template>
  <div
    class="ft-list-hashtag ft-list-item"
    :class="{
      list: listType === 'list',
      grid: listType === 'grid',
      [appearance]: true
    }"
  >
    <div class="channelThumbnail">
      <router-link
        class="channelThumbnailLink"
        tabindex="-1"
        aria-hidden="true"
        :to="url"
      >
        <FontAwesomeIcon
          class="hashtagImage"
          :icon="['fas', 'hashtag']"
        />
      </router-link>
    </div>
    <div class="info">
      <router-link
        class="title"
        :to="url"
      >
        <h3 class="h3Title">
          {{ title }}
        </h3>
      </router-link>
      <div class="infoLine">
        <span
          v-if="channelCount"
          class="channelCount"
        >
          {{ $tc('Global.Counts.Channel Count', channelCount, {count: formattedChannelCount}) }}
        </span>
        <span
          v-if="videoCount"
          class="videoCount"
        >
          <template v-if="channelCount"> • </template>
          {{ $tc('Global.Counts.Video Count', videoCount, {count: formattedVideosCount}) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed } from 'vue'

import store from '../../store/index'

import { formatNumber } from '../../helpers/utils'

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  appearance: {
    type: String,
    required: true
  }
})

/** @type {import('vue').ComputedRef<'list'| 'grid'>} */
const listType = computed(() => {
  return store.getters.getListType
})

/** @type {string} */
const title = props.data.title
/** @type {number} */
const channelCount = props.data.channelCount
/** @type {number} */
const videoCount = props.data.videoCount
/** @type {string} */
const url = `/hashtag/${encodeURIComponent(title.substring(1))}`

const formattedChannelCount = computed(() => {
  return formatNumber(channelCount)
})

const formattedVideosCount = computed(() => {
  return formatNumber(videoCount)
})
</script>

<style scoped lang="scss" src="./FtListHashtag.scss" />
