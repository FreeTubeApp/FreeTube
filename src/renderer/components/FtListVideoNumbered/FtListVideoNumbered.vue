<template>
  <div
    v-observe-visibility="visible ? false : {
      callback: onVisibilityChanged
    }"
    :class="{
      placeholder: !visible,
      draggable: isSortOrderCustom && isUserPlaylist,
      draggedVideo: isVideoDragging && draggedVideo.videoId === data.videoId,
    }"
    :draggable="isSortOrderCustom && isUserPlaylist"
    v-on="isSortOrderCustom ? {
      dragstart: () => dragVideo(videoData),
      dragover: event => event.preventDefault(),
      dragenter: () => moveDraggedVideo(videoData, draggedVideo),
      dragend: afterDrag,
      mouseenter: () => mouseEnter = true,
      mouseleave: () => mouseEnter = false,
    } : {}"
  >
    <template
      v-if="visible"
    >
      <p
        class="videoIndex"
        :class="{
          preventJankyDrag: isVideoDragging,
        }"
      >
        <FontAwesomeIcon
          v-if="isCurrentVideo"
          class="videoIndexIcon"
          :icon="['fas', 'play']"
        />

        <FontAwesomeIcon
          v-else-if="(isSortOrderCustom && isUserPlaylist) && mouseEnter"
          class="grabBar"
          :icon="['fas', 'fa-bars']"
        />

        <template
          v-else
        >
          {{ videoIndex + 1 }}
        </template>
      </p>
      <FtListVideo
        :data="data"
        :playlist-id="playlistId"
        :playlist-type="playlistType"
        :playlist-index="playlistIndex"
        :playlist-reverse="playlistReverse"
        :playlist-shuffle="playlistShuffle"
        :playlist-loop="playlistLoop"
        :playlist-item-id="playlistItemId"
        force-list-type="list"
        :class="{
          preventJankyDrag: isVideoDragging,
        }"
        :appearance="appearance"
        :always-show-add-to-playlist-button="alwaysShowAddToPlaylistButton"
        :quick-bookmark-button-enabled="quickBookmarkButtonEnabled"
        :can-move-video-up="canMoveVideoUp"
        :can-move-video-down="canMoveVideoDown"
        :can-remove-from-playlist="canRemoveFromPlaylist"
        @pause-player="pausePlayer"
        @move-video-up="moveVideoUp"
        @move-video-down="moveVideoDown"
        @remove-from-playlist="removeFromPlaylist"
      />
    </template>
  </div>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ref, watch } from 'vue'

import { handleDragAndDrop } from '../../helpers/dragAndDrop'

import FtListVideo from '../ft-list-video/ft-list-video.vue'

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  playlistId: {
    type: String,
    default: null
  },
  playlistType: {
    type: String,
    default: null
  },
  playlistIndex: {
    type: Number,
    default: null
  },
  playlistReverse: {
    type: Boolean,
    default: false
  },
  playlistShuffle: {
    type: Boolean,
    default: false
  },
  playlistLoop: {
    type: Boolean,
    default: false
  },
  playlistItemId: {
    type: String,
    default: null,
  },
  appearance: {
    type: String,
    required: true
  },
  initialVisibleState: {
    type: Boolean,
    default: false,
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
  draggedVideo: {
    type: Object,
    default: () => ({ videoId: null, playlistItemId: null }),
  },
  isSortOrderCustom: {
    type: Boolean,
    default: null
  },
  isVideoDragging: {
    type: Boolean,
    default: false,
  },
  videoIndex: {
    type: Number,
    default: -1
  },
  isCurrentVideo: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['move-dragged-video', 'move-video-down', 'move-video-up', 'pause-player', 'remove-from-playlist', 'drag-video', 'drag-video-end'])
const visible = ref(props.initialVisibleState)

const mouseEnter = ref(false)

const isUserPlaylist = props.playlistType === 'user'

let stopWatchingInitialVisibleState = null

if (!props.initialVisibleState) {
  stopWatchingInitialVisibleState = watch(() => props.initialVisibleState, (newValue) => {
    visible.value = newValue
    stopWatchingInitialVisibleState()
    stopWatchingInitialVisibleState = null
  })
}

/**
 * @param {boolean} isVisible
 */
function onVisibilityChanged(isVisible) {
  if (isVisible) {
    visible.value = isVisible

    if (stopWatchingInitialVisibleState) {
      stopWatchingInitialVisibleState()
      stopWatchingInitialVisibleState = null
    }
  }
}

function pausePlayer() {
  emit('pause-player')
}

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

const { dragVideo, moveDraggedVideo, afterDrag } = handleDragAndDrop(emit)

/** @import { VideoData } from '../../helpers/dragAndDrop' */

/** @type {VideoData} */
const videoData = {
  videoId: props.data.videoId,
  playlistItemId: props.playlistItemId,
}

/**
 * @param {string} videoId
 * @param {string} playlistItemId
 */
function removeFromPlaylist(videoId, playlistItemId) {
  emit('remove-from-playlist', videoId, playlistItemId)
}
</script>

<style scoped src="./FtListVideoNumbered.css" />
