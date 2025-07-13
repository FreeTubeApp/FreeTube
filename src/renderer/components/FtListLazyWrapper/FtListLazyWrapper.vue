<template>
  <div
    v-if="showResult"
    v-observe-visibility="visible ? false : {
      callback: onVisibilityChanged
    }"
    :class="{
      grid: layout === 'grid',
      list: layout === 'list'
    }"
  >
    <template
      v-if="visible"
    >
      <FtListVideo
        v-if="finalDataType === 'video' || finalDataType === 'shortVideo'"
        :appearance="appearance"
        :data="data"
        :playlist-id="playlistId"
        :playlist-type="playlistType"
        :playlist-item-id="playlistItemId"
        :show-video-with-last-viewed-playlist="showVideoWithLastViewedPlaylist"
        :always-show-add-to-playlist-button="alwaysShowAddToPlaylistButton"
        :quick-bookmark-button-enabled="quickBookmarkButtonEnabled"
        :can-move-video-up="canMoveVideoUp"
        :can-move-video-down="canMoveVideoDown"
        :can-remove-from-playlist="canRemoveFromPlaylist"
        @move-video-up="moveVideoUp"
        @move-video-down="moveVideoDown"
        @remove-from-playlist="removeFromPlaylist"
      />
      <FtListChannel
        v-else-if="finalDataType === 'channel'"
        :appearance="appearance"
        :data="data"
      />
      <FtListPlaylist
        v-else-if="finalDataType === 'playlist'"
        :appearance="appearance"
        :data="data"
        :search-query-text="searchQueryText"
      />
      <FtCommunityPost
        v-else-if="finalDataType === 'community'"
        :hide-forbidden-titles="hideForbiddenTitles"
        :appearance="appearance"
        :data="data"
      />
      <FtListHashtag
        v-else-if="data.type === 'hashtag'"
        :appearance="appearance"
        :data="data"
      />
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

import FtListVideo from '../ft-list-video/ft-list-video.vue'
import FtListChannel from '../FtListChannel/FtListChannel.vue'
import FtListPlaylist from '../FtListPlaylist/FtListPlaylist.vue'
import FtCommunityPost from '../FtCommunityPost/FtCommunityPost.vue'
import FtListHashtag from '../FtListHashtag/FtListHashtag.vue'

import store from '../../store/index'

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  dataType: {
    type: String,
    default: null,
  },
  appearance: {
    type: String,
    required: true
  },
  firstScreen: {
    type: Boolean,
    required: true
  },
  layout: {
    type: String,
    default: 'grid'
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
  playlistId: {
    type: String,
    default: null
  },
  playlistType: {
    type: String,
    default: null
  },
  playlistItemId: {
    type: String,
    default: null
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
})

const emit = defineEmits(['move-video-down', 'move-video-up', 'remove-from-playlist'])

/** @type {import('vue').ComputedRef<'video' | 'shortVideo' | 'channel' | 'playlist' | 'community'>} */
const finalDataType = computed(() => {
  return props.data.type ?? props.dataType
})

/** @type {import('vue').ComputedRef<boolean>} */
const hideLiveStreams = computed(() => {
  return store.getters.getHideLiveStreams
})

/** @type {import('vue').ComputedRef<boolean>} */
const hideUpcomingPremieres = computed(() => {
  return store.getters.getHideUpcomingPremieres
})

/** @type {import('vue').ComputedRef<{name : string, preferredName: string, icon: string}[]>} */
const channelsHidden = computed(() => {
  // Some component users like channel view will have this disabled
  if (!props.useChannelsHiddenPreference) { return [] }

  return JSON.parse(store.getters.getChannelsHidden).map((ch) => {
    // Legacy support
    if (typeof ch === 'string') {
      return { name: ch, preferredName: '', icon: '' }
    }
    return ch
  })
})

/** @type {string[]} */
const forbiddenTitles = computed(() => {
  if (!props.hideForbiddenTitles) { return [] }
  return JSON.parse(store.getters.getForbiddenTitles)
})

const showResult = computed(() => {
  const dataType = finalDataType.value

  if (!dataType) {
    return false
  }

  if (dataType === 'video' || dataType === 'shortVideo') {
    if (hideLiveStreams.value && (props.data.liveNow || props.data.lengthSeconds == null)) {
      // hide livestreams
      return false
    }

    if (hideUpcomingPremieres.value &&
        // Observed for premieres in Local API Channels.
        (props.data.premiereDate != null ||
          // Invidious API
          // `premiereTimestamp` only available on premiered videos
          // https://docs.invidious.io/api/common_types/#videoobject
          props.data.premiereTimestamp != null ||
          // viewCount is our only method of detecting premieres in RSS
          // data without sending an additional request.
          // If we ever get a better flag, use it here instead.
          (props.data.isRSS && props.data.viewCount === '0'))) {
      // hide upcoming
      return false
    }

    if (channelsHidden.value.some(ch => ch.name === props.data.authorId) || channelsHidden.value.some(ch => ch.name === props.data.author)) {
      // hide videos by author
      return false
    }

    const lowerCaseTitle = props.data.title?.toLowerCase()
    if (forbiddenTitles.value.some((text) => lowerCaseTitle.includes(text.toLowerCase()))) {
      return false
    }
  } else if (dataType === 'channel') {
    const attrsToCheck = [
      // Local API
      props.data.id,
      props.data.name,
      // Invidious API
      // https://docs.invidious.io/api/common_types/#channelobject
      props.data.author,
      props.data.authorId,
    ]

    if (attrsToCheck.some(a => a != null && channelsHidden.value.some(ch => ch.name === a))) {
      // hide channels by author
      return false
    }
  } else if (dataType === 'playlist') {
    const lowerCaseTitle = props.data.title?.toLowerCase()

    if (forbiddenTitles.value.some((text) => lowerCaseTitle.includes(text.toLowerCase()))) {
      return false
    }

    const attrsToCheck = [
      // Local API
      props.data.channelId,
      props.data.channelName,
      // Invidious API
      // https://docs.invidious.io/api/common_types/#playlistobject
      props.data.author,
      props.data.authorId,
    ]

    if (attrsToCheck.some(a => a != null && channelsHidden.value.some(ch => ch.name === a))) {
      // hide playlists by author
      return false
    }
  }
  return true
})

const visible = ref(props.firstScreen)

/**
 * @param {boolean} isVisible
 */
function onVisibilityChanged(isVisible) {
  if (isVisible) {
    visible.value = isVisible
  }
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
function removeFromPlaylist(videoId, playlistItemId) {
  emit('remove-from-playlist', videoId, playlistItemId)
}
</script>

<style scoped src="./FtListLazyWrapper.css" />
