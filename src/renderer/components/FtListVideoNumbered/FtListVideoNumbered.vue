<template>
  <div
    ref="video"
    v-observe-visibility="visible ? false : {
      callback: onVisibilityChanged
    }"
    :class="{
      placeholder: !visible,
      customSort: isSortOrderCustom,
    }"
    :draggable="isSortOrderCustom"
    v-on="isSortOrderCustom ? {
      dragstart: dragVideo,
      dragenter: moveDraggedVideo,
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
          preventJankyDrag,
        }"
      >
        <FontAwesomeIcon
          v-if="isCurrentVideo"
          class="videoIndexIcon"
          :icon="['fas', 'play']"
        />

        <FontAwesomeIcon
          v-else-if="isSortOrderCustom && mouseEnter"
          :icon="['fas', 'fa-bars']"
        />

        <template
          v-else
        >
          {{ videoIndex + 1 }}
        </template>
      </p>
      <FtListVideo
        :class="{
          preventJankyDrag,
        }"
        :data="data"
        :playlist-id="playlistId"
        :playlist-type="playlistType"
        :playlist-index="playlistIndex"
        :playlist-reverse="playlistReverse"
        :playlist-shuffle="playlistShuffle"
        :playlist-loop="playlistLoop"
        :playlist-item-id="playlistItemId"
        force-list-type="list"
        class="preventJankyDrag"
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
import { ref, watch, useTemplateRef } from 'vue'

import FtListVideo from '../ft-list-video/ft-list-video.vue'

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  draggedVideo: {
    type: Object,
    default: () => ({ videoId: null, playlistItemId: null }),
  },
  preventJankyDrag: {
    type: Boolean,
    default: false,
  },
  isSortOrderCustom: {
    type: Boolean,
    default: null
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

const videoElement = useTemplateRef('video')

/**
 * @param {DragEvent} event
 */
function hideDraggedVideoElement(event) {
  const { value: video } = videoElement.value

  if (video) {
    const { target: { clientX, clientY } } = event
    event.dataTransfer.setDragImage(video, clientX, clientY)

    // Ensures the drag image is set before hiding the element.
    setTimeout(() => {
      video.style.visibility = 'hidden'
    }, 0)
  }
}

/**
 * @param {DragEvent} event
 */
function dragVideo(event) {
  if (videoElement.value) {
    hideDraggedVideoElement(event)

    const { data: { videoId }, playlistItemId } = props

    emit('drag-video', { videoId, playlistItemId })
  }
}

function moveDraggedVideo() {
  if (videoElement.value) {
    const { data: { videoId }, playlistItemId, draggedVideo } = props

    const differentVideo = videoId !== draggedVideo.videoId

    if (differentVideo) {
      emit('move-dragged-video', { videoId, playlistItemId }, draggedVideo)
    }
  }
}

function afterDrag() {
  const { value: video } = videoElement.value

  if (video) {
    video.style.visibility = 'revert'

    emit('drag-video-end')
  }
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
