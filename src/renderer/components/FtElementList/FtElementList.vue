<template>
  <FtAutoGrid
    :grid="displayValue !== 'list'"
  >
    <FtListLazyWrapper
      v-for="(result, index) in data"
      :key="`${dataType || result.type}-${result.videoId || result.playlistId || result.postId || result.id || result._id || result.authorId || result.title}-${result.playlistItemId || index}-${result.lastUpdatedAt || 0}`"
      appearance="result"
      :data="result"
      :data-type="dataType || result.type"
      :first-screen="index < 16"
      :layout="displayValue"
      :show-video-with-last-viewed-playlist="showVideoWithLastViewedPlaylist"
      :use-channels-hidden-preference="useChannelsHiddenPreference"
      :hide-forbidden-titles="hideForbiddenTitles"
      :always-show-add-to-playlist-button="alwaysShowAddToPlaylistButton"
      :quick-bookmark-button-enabled="quickBookmarkButtonEnabled"
      :can-move-video-up="canMoveVideoUp && index > 0"
      :can-move-video-down="canMoveVideoDown && index < playlistItemsLength - 1"
      :can-remove-from-playlist="canRemoveFromPlaylist"
      :search-query-text="searchQueryText"
      :playlist-id="playlistId"
      :playlist-type="playlistType"
      :playlist-item-id="result.playlistItemId"
      @move-video-up="moveVideoUp"
      @move-video-down="moveVideoDown"
      @remove-from-playlist="removeFromPlaylist"
    />
  </FtAutoGrid>
</template>

<script setup>
import { computed } from 'vue'

import FtAutoGrid from '../FtAutoGrid/FtAutoGrid.vue'
import FtListLazyWrapper from '../FtListLazyWrapper/FtListLazyWrapper.vue'

import store from '../../store/index'

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  dataType: {
    type: String,
    default: null,
  },
  display: {
    type: String,
    required: false,
    default: ''
  },
  showVideoWithLastViewedPlaylist: {
    type: Boolean,
    default: false
  },
  useChannelsHiddenPreference: {
    type: Boolean,
    default: true,
  },
  hideForbiddenTitles: {
    type: Boolean,
    default: true
  },
  searchQueryText: {
    type: String,
    required: false,
    default: '',
  },
  alwaysShowAddToPlaylistButton: {
    type: Boolean,
    default: false,
  },
  quickBookmarkButtonEnabled: {
    type: Boolean,
    default: true,
  },
  canMoveVideoUp: {
    type: Boolean,
    default: false,
  },
  canMoveVideoDown: {
    type: Boolean,
    default: false,
  },
  canRemoveFromPlaylist: {
    type: Boolean,
    default: false,
  },
  playlistItemsLength: {
    type: Number,
    default: 0
  },
  playlistId: {
    type: String,
    default: null
  },
  playlistType: {
    type: String,
    default: null
  },
})

const emit = defineEmits(['move-video-down', 'move-video-up', 'remove-from-playlist'])

/** @type {import('vue').ComputedRef<'grid' | 'list'>} */
const listType = computed(() => {
  return store.getters.getListType
})

/** @type {import('vue').ComputedRef<'grid' | 'list'>} */
const displayValue = computed(() => {
  return props.display === '' ? listType.value : props.display
})

/**
 * @param {string} videoId
 * @param {string} playlistItemId
 */
function moveVideoUp(videoId, playlistItemId) {
  emit('move-video-up', videoId, playlistItemId)
}

/**
 * @param {string} videoId
 * @param {string} playlistItemId
 */
function moveVideoDown(videoId, playlistItemId) {
  emit('move-video-down', videoId, playlistItemId)
}

/**
 * @param {string} videoId
 * @param {string} playlistItemId
 */
function removeFromPlaylist(videoId, playlistItemId) {
  emit('remove-from-playlist', videoId, playlistItemId)
}
</script>

<style scoped src="./FtElementList.css" />
