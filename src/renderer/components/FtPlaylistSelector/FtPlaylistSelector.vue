<template>
  <div
    class="ft-playlist-selector grid"
    :class="{ selected }"
    @click="toggleSelection"
    @keydown.enter.prevent="toggleSelection"
    @keydown.space.prevent="toggleSelection"
  >
    <div
      class="thumbnail"
    >
      <FontAwesomeIcon
        v-if="selected"
        class="selectedIcon"
        :icon="['fas', 'check']"
      />
      <img
        alt=""
        :src="thumbnail"
        class="thumbnailImage"
      >
      <div
        class="videoCountContainer"
      >
        <div class="background" />
        <div class="inner">
          <div>{{ playlist.videos.length }}</div>
          <div><FontAwesomeIcon :icon="['fas', 'list']" /></div>
        </div>
      </div>
    </div>
    <div
      v-observe-visibility="{
        callback: onVisibilityChanged,
        once: true,
      }"
      class="info"
    >
      <div
        class="title"
      >
        {{ titleForDisplay }}
      </div>
      <div
        v-if="videoPresenceCountInPlaylistTextVisible"
        class="videoPresenceCount"
      >
        {{ videoPresenceCountInPlaylistText }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed, ref } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'

import store from '../../store/index'

import thumbnailPlaceholder from '../../assets/img/thumbnail_placeholder.svg'

const props = defineProps({
  playlist: {
    type: Object,
    required: true,
  },
  appearance: {
    type: String,
    default: 'grid',
  },
  selected: {
    type: Boolean,
    required: true,
  },
  disabled: {
    type: Boolean,
    required: true,
  },
  addingDuplicateVideosEnabled: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['selected'])

const { t } = useI18n()

const videoPresenceCountInPlaylistTextShouldBeVisible = ref(false)

/** @type {import('vue').ComputedRef<'local' | 'invidious'>} */
const backendPreference = computed(() => store.getters.getBackendPreference)

/** @type {import('vue').ComputedRef<string>} */
const currentInvidiousInstanceUrl = computed(() => store.getters.getCurrentInvidiousInstanceUrl)

/** @type {import('vue').ComputedRef<object[]>} */
const toBeAddedToPlaylistVideoList = computed(() => store.getters.getToBeAddedToPlaylistVideoList)

const titleForDisplay = computed(() => {
  const title = props.playlist.playlistName

  if (typeof title !== 'string') {
    return ''
  } else if (title.length <= 255) {
    return title
  } else {
    return `${title.substring(0, 255)}...`
  }
})

/** @type {import('vue').ComputedRef<number>} */
const loneVideoPresenceCountInPlaylist = computed(() => {
  if (toBeAddedToPlaylistVideoList.value.length !== 1) { return 0 }

  const loneToBeAddedToPlaylistVideoVideoId = toBeAddedToPlaylistVideoList.value[0].videoId

  return props.playlist.videos.reduce((accumulator, video) => {
    return video.videoId === loneToBeAddedToPlaylistVideoVideoId
      ? accumulator + 1
      : accumulator
  }, 0)
})

const loneVideoPresenceCountInPlaylistText = computed(() => {
  const count = loneVideoPresenceCountInPlaylist.value

  if (count === 0) { return null }

  return t('User Playlists.AddVideoPrompt.Added {count} Times', {
    count: count,
  }, count)
})

/** @type {import('vue').ComputedRef<number>} */
const multiVideoPresenceCountInPlaylist = computed(() => {
  if (toBeAddedToPlaylistVideoList.value.length < 2) { return 0 }

  // Count of to be added videos already present in this playlist
  return toBeAddedToPlaylistVideoList.value.reduce((accumulator, toBeAddedToVideo) => {
    return props.playlist.videos.some((pv) => pv.videoId === toBeAddedToVideo.videoId)
      ? accumulator + 1
      : accumulator
  }, 0)
})

const multiVideoPresenceCountInPlaylistText = computed(() => {
  if (multiVideoPresenceCountInPlaylist.value === 0) { return null }

  if (
    props.addingDuplicateVideosEnabled ||
    toBeAddedToPlaylistVideoList.value.length === multiVideoPresenceCountInPlaylist.value
  ) {
    return t('User Playlists.AddVideoPrompt.{videoCount}/{totalVideoCount} Videos Already Added', {
      videoCount: multiVideoPresenceCountInPlaylist.value,
      totalVideoCount: toBeAddedToPlaylistVideoList.value.length,
    })
  } else {
    return t('User Playlists.AddVideoPrompt.{videoCount}/{totalVideoCount} Videos Will Be Added', {
      videoCount: toBeAddedToPlaylistVideoList.value.length - multiVideoPresenceCountInPlaylist.value,
      totalVideoCount: toBeAddedToPlaylistVideoList.value.length,
    })
  }
})

const videoPresenceCountInPlaylistText = computed(() => {
  return loneVideoPresenceCountInPlaylistText.value ?? multiVideoPresenceCountInPlaylistText.value
})

const videoPresenceCountInPlaylistTextVisible = computed(() => {
  return videoPresenceCountInPlaylistTextShouldBeVisible.value &&
    videoPresenceCountInPlaylistText.value != null
})

const thumbnail = ref(thumbnailPlaceholder)

if (props.playlist.videos.length > 0) {
  const origin = backendPreference.value === 'invidious'
    ? currentInvidiousInstanceUrl.value
    : 'https://i.ytimg.com'

  thumbnail.value = `${origin}/vi/${props.playlist.videos[0].videoId}/mqdefault.jpg`
}

function toggleSelection() {
  if (!props.disabled) {
    emit('selected', props.playlist._id)
  }
}

/**
 * @param {boolean} visible
 */
function onVisibilityChanged(visible) {
  if (visible) {
    videoPresenceCountInPlaylistTextShouldBeVisible.value = true
  }
}
</script>

<style scoped lang="scss" src="./FtPlaylistSelector.scss" />
