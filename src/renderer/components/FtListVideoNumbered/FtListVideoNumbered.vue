<template>
  <div
    v-observe-visibility="visible ? false : {
      callback: onVisibilityChanged
    }"
    :class="{
      placeholder: !visible,
      draggable: rowDraggable && !props.wholeRowDraggable,
      wholeRowDraggable: wholeRowDraggable,
      sortableRow: rowDraggable,
      draggedVideo: isVideoDragging && draggedVideo.videoId === data.videoId && draggedVideo.playlistItemId === data.playlistItemId,
    }"
    :draggable="rowDraggable"
    v-on="props.wholeRowDraggable ? wholeRowDragEventHandlers : canBecomeDraggable ? draggableEventHandlers : emptyDragEventHandlers"
  >
    <template
      v-if="visible"
    >
      <p
        class="videoIndexArea"
      >
        <FontAwesomeIcon
          v-if="rowDraggable"
          class="grabBar"
          :icon="['fas', 'fa-bars']"
        />
        <FontAwesomeIcon
          v-if="isCurrentVideo"
          class="videoIndexIcon"
          :icon="['fas', 'play']"
        />

        <template
          v-else
        >
          <span
            class="videoIndex"
          >
            {{ videoIndex + 1 }}
          </span>
        </template>
      </p>
      <FtListVideo
        ref="video"
        :data="data"
        :allow-row-drag="wholeRowDraggable"
        :playlist-id="playlistId"
        :playlist-type="playlistType"
        :playlist-index="playlistIndex"
        :playlist-reverse="playlistReverse"
        :playlist-shuffle="playlistShuffle"
        :playlist-loop="playlistLoop"
        :playlist-item-id="playlistItemId"
        force-list-type="list"
        :appearance="appearance"
        :always-show-add-to-playlist-button="alwaysShowAddToPlaylistButton"
        :quick-bookmark-button-enabled="quickBookmarkButtonEnabled"
        :can-move-video-up="canMoveVideoUp"
        :can-move-video-down="canMoveVideoDown"
        :can-remove-from-playlist="canRemoveFromPlaylist"
        @pause-player="pausePlayer"
        @move-video-up="moveVideoUp"
        @move-video-down="moveVideoDown"
        @move-video-to-the-top="moveVideoToTheTop"
        @move-video-to-the-bottom="moveVideoToTheBottom"
        @remove-from-playlist="removeFromPlaylist"
      />
    </template>
  </div>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed, ref, watch, useTemplateRef } from 'vue'
import { ObserveVisibility as vObserveVisibility } from 'vue-observe-visibility'

import { handleDragAndDrop } from '../../helpers/dragAndDrop'

import FtListVideo from '../FtListVideo/FtListVideo.vue'

const props = defineProps({
  wholeRowDraggable: { type: Boolean, default: false },
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

const emit = defineEmits([
  'dragstart',
  'move-dragged-video',
  'move-video-down',
  'move-video-up',
  'move-video-to-the-top',
  'move-video-to-the-bottom',
  'pause-player',
  'remove-from-playlist',
  'drag-video',
  'drag-video-end'
])

const visible = ref(props.initialVisibleState)
const video = useTemplateRef('video')

const inUserPlaylist = props.playlistType === 'user'
const canBecomeDraggable = computed(() => inUserPlaylist && props.isSortOrderCustom && (props.canMoveVideoUp || props.canMoveVideoDown))
const rowDraggable = computed(() => canBecomeDraggable.value || props.wholeRowDraggable)
const { dragVideo, moveDraggedVideo, afterDrag } = handleDragAndDrop(emit)
const emptyDragEventHandlers = {}
const wholeRowDragEventHandlers = {
  dragstart: onRowDragStart
}
const draggableEventHandlers = {
  dragstart: onDragVideo,
  dragover: event => event.preventDefault(),
  dragenter: () => {
    if (props.isVideoDragging) {
      moveDraggedVideo(videoData, props.draggedVideo)
    }
  },
  dragend: afterDrag,
  drop: event => event.preventDefault(),
}

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

function onRowDragStart(event) {
  if (!props.wholeRowDraggable || event.defaultPrevented) { return }
  if (event.target.closest('a.title, a.channelName')) { return }

  emit('dragstart', event, props.data, video.value?.getThumbnailBounds())
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

/**
 * @param {string} videoId
 * @param {string} playlistItemId
 */
function moveVideoToTheTop(videoId, playlistItemId) {
  emit('move-video-to-the-top', videoId, playlistItemId)
}

/**
 * @param {string} videoId
 * @param {string} playlistItemId
 */
function moveVideoToTheBottom(videoId, playlistItemId) {
  emit('move-video-to-the-bottom', videoId, playlistItemId)
}

function onDragVideo(event) {
  // Only allow dragging via the drag bar
  if (!event.target.classList.contains('draggable')) { return }

  dragVideo(event, videoData)
}

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
