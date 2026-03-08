<template>
  <FtCard class="relative">
    <FtLoader
      v-if="isLoading"
    />
    <div
      v-else
    >
      <h3
        class="playlistTitle"
        :title="playlistTitle"
      >
        <RouterLink
          class="playlistTitleLink"
          dir="auto"
          :to="playlistPageLinkTo"
        >
          {{ playlistTitle }}
        </RouterLink>
      </h3>
      <template
        v-if="channelName !== ''"
      >
        <RouterLink
          v-if="channelId"
          class="channelName"
          dir="auto"
          :to="`/channel/${channelId}`"
        >
          {{ channelName }} -
        </RouterLink>
        <bdi
          v-else
          class="channelName"
        >
          {{ channelName }} -
        </bdi>
      </template>
      <span
        class="playlistIndex"
      >
        <label for="playlistProgressBar">
          {{ currentVideoIndexOneBased }} / {{ playlistVideoCount }}
        </label>

        <!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events, vuejs-accessibility/click-events-have-key-events -->
        <div
          v-if="!shuffleEnabled && !reversePlaylist"
          class="playlistProgressBarContainer"
          @mouseenter="showProgressBarPreview = true"
          @mouseleave="showProgressBarPreview = false"
          @mousemove="updateProgressBarPreview"
        >
          <div
            ref="playlistProgressBar"
            class="playlistProgressBar"
            :class="{ expanded: showProgressBarPreview }"
            @click="handleProgressBarClick"
          >
            <div
              class="playlistProgressBarFill"
              :style="{ width: (currentVideoIndexOneBased / playlistVideoCount) * 100 + '%' }"
            />
            <div
              v-if="showProgressBarPreview"
              class="progressBarPreview"
              :style="{ left: previewPosition + '%', transform: `translateX(${ previewTransformXPercentage }%)` }"
            >
              <div class="previewTooltip">
                <img
                  v-if="previewVideoThumbnail"
                  :src="previewVideoThumbnail"
                  alt=""
                  class="previewThumbnail"
                >
                <div class="previewText">
                  {{ previewVideoIndex }} / {{ playlistVideoCount }}
                </div>
                <div
                  class="previewVideoTitle"
                  dir="auto"
                >{{ previewVideoTitle }}</div>
              </div>
            </div>
          </div>
        </div>
      </span>
      <div class="playlistButtons">
        <button
          class="playlistButton"
          :class="{ playlistButtonActive: loopEnabled }"
          :aria-label="t('Video.Loop Playlist')"
          :aria-pressed="loopEnabled"
          :title="t('Video.Loop Playlist')"
          @click="toggleLoop"
        >
          <FontAwesomeIcon
            class="playlistIcon"
            :icon="['fas', 'retweet']"
          />
        </button>
        <button
          class="playlistButton"
          :class="{ playlistButtonActive: shuffleEnabled }"
          :aria-label="t('Video.Shuffle Playlist')"
          :aria-pressed="shuffleEnabled"
          :title="t('Video.Shuffle Playlist')"
          @click="toggleShuffle"
        >
          <FontAwesomeIcon
            class="playlistIcon"
            :icon="['fas', 'random']"
          />
        </button>
        <button
          class="playlistButton"
          :class="{ playlistButtonActive: reversePlaylist }"
          :aria-label="t('Video.Reverse Playlist')"
          :aria-pressed="reversePlaylist"
          :title="t('Video.Reverse Playlist')"
          @click="toggleReversePlaylist"
        >
          <FontAwesomeIcon
            class="playlistIcon"
            :icon="['fas', 'exchange-alt']"
          />
        </button>
      </div>
      <div
        v-if="!isLoading"
        ref="playlistItemsWrapper"
        class="playlistItemsWrapper"
      >
        <FtListVideoNumbered
          v-for="(item, index) in playlistItems"
          :key="item.playlistItemId || item.videoId"
          ref="playlistItem"
          class="playlistItem"
          :data="item"
          :playlist-id="playlistId"
          :playlist-type="playlistType"
          :playlist-index="reversePlaylist ? playlistItems.length - index - 1 : index"
          :playlist-item-id="item.playlistItemId"
          :playlist-reverse="reversePlaylist"
          :playlist-shuffle="shuffleEnabled"
          :playlist-loop="loopEnabled"
          :video-index="index"
          :is-current-video="currentVideoIndexZeroBased === index"
          appearance="watchPlaylistItem"
          :initial-visible-state="index < (currentVideoIndexZeroBased + 4) && index > (currentVideoIndexZeroBased - 4)"
          @pause-player="pausePlayer"
        />
      </div>
    </div>
  </FtCard>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'
import { useRouter } from 'vue-router'

import FtLoader from '../FtLoader/FtLoader.vue'
import FtCard from '../ft-card/ft-card.vue'
import FtListVideoNumbered from '../FtListVideoNumbered/FtListVideoNumbered.vue'

import store from '../../store/index'

import { copyToClipboard, showToast } from '../../helpers/utils'
import {
  getLocalCachedFeedContinuation,
  getLocalPlaylist,
  parseLocalPlaylistVideo,
  untilEndOfLocalPlayList,
} from '../../helpers/api/local'
import { invidiousGetPlaylistInfo } from '../../helpers/api/invidious'
import { getSortedPlaylistItems, SORT_BY_VALUES } from '../../helpers/playlists'

const props = defineProps({
  playlistId: {
    type: String,
    required: true,
  },
  playlistType: {
    type: String,
    default: null
  },
  videoId: {
    type: String,
    required: true,
  },
  playlistItemId: {
    type: String,
    default: null,
  },
  watchViewLoading: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['pause-player'])

const { locale, t } = useI18n()
const router = useRouter()

const isLoading = ref(false)
const shuffleEnabled = ref(false)
const loopEnabled = ref(false)
const reversePlaylist = ref(false)
const channelId = ref('')
const channelName = ref('')
const playlistTitle = ref('')
const playlistItems = shallowRef([])
const randomizedPlaylistItems = shallowRef([])
const showProgressBarPreview = ref(false)
const previewPosition = ref(0)
const previewVideoIndex = ref(1)
const windowWidth = ref(window.innerWidth)

let prevVideoBeforeDeletion = null
let getPlaylistInfoRun = false

/** @type {import('vue').ComputedRef<'local' | 'invidious'>} */
const backendPreference = computed(() => store.getters.getBackendPreference)

/** @type {import('vue').ComputedRef<boolean>} */
const backendFallback = computed(() => store.getters.getBackendFallback)

/** @type {import('vue').ComputedRef<string>} */
const currentInvidiousInstanceUrl = computed(() => store.getters.getCurrentInvidiousInstanceUrl)

const isUserPlaylist = computed(() => props.playlistType === 'user')

/** @type {import('vue').ComputedRef<boolean>} */
const userPlaylistsReady = computed(() => store.getters.getPlaylistsReady)

const selectedUserPlaylist = computed(() => {
  if (props.playlistId == null || props.playlistId === '') { return null }

  return store.getters.getPlaylist(props.playlistId)
})

/** @type {import('vue').ComputedRef<number | undefined>} */
const selectedUserPlaylistVideoCount = computed(() => selectedUserPlaylist.value?.videos?.length)

/** @type {import('vue').ComputedRef<number | undefined>} */
const selectedUserPlaylistLastUpdatedAt = computed(() => selectedUserPlaylist.value?.lastUpdatedAt)

const currentVideoIndexZeroBased = computed(() => {
  return findIndexOfCurrentVideoInPlaylist(playlistItems.value)
})

const currentVideoIndexOneBased = computed(() => currentVideoIndexZeroBased.value + 1)

const currentVideo = computed(() => playlistItems.value[currentVideoIndexZeroBased.value])

const playlistVideoCount = computed(() => playlistItems.value.length)

const videoIndexInPlaylistItems = computed(() => {
  const items = shuffleEnabled.value ? randomizedPlaylistItems.value : playlistItems.value
  return findIndexOfCurrentVideoInPlaylist(items)
})

const videoIsLastPlaylistItem = computed(() => {
  return videoIndexInPlaylistItems.value === (playlistItems.value.length - 1)
})

const videoIsNotPlaylistItem = computed(() => videoIndexInPlaylistItems.value === -1)

const playlistPageLinkTo = computed(() => ({
  path: `/playlist/${props.playlistId}`,
  query: {
    playlistType: isUserPlaylist.value ? 'user' : '',
  }
}))

/** @type {import('vue').ComputedRef<string>} */
const userPlaylistSortOrder = computed(() => store.getters.getUserPlaylistSortOrder)

const sortOrder = computed(() => isUserPlaylist.value ? userPlaylistSortOrder.value : SORT_BY_VALUES.Custom)

const previewTransformXPercentage = computed(() => {
  // Breakpoint for single-column-template
  if (windowWidth.value > 1050) {
    // Align left when preview is on the right half to avoid going out of right side of the window
    return previewPosition.value <= 50 ? -50 : -100
  }

  // Align left/right to avoid going out of either side of the window
  return previewPosition.value <= 50 ? 0 : -100
})

const previewVideoTitle = computed(() => {
  const index = previewVideoIndex.value - 1

  if (index >= 0 && index < playlistItems.value.length) {
    return playlistItems.value[index].title || 'Unknown Title'
  }
  return ''
})

const previewVideoThumbnail = computed(() => {
  const index = previewVideoIndex.value - 1

  if (index >= 0 && index < playlistItems.value.length) {
    const videoId = playlistItems.value[index].videoId

    if (videoId) {
      const baseUrl = backendPreference.value === 'invidious'
        ? currentInvidiousInstanceUrl.value
        : 'https://i.ytimg.com'
      return `${baseUrl}/vi/${videoId}/default.jpg`
    }
  }

  return null
})

watch(userPlaylistsReady, () => {
  getPlaylistInfoWithDelay()
})

watch(selectedUserPlaylistVideoCount, () => {
  // Re-fetch from local store when current user playlist updated
  parseUserPlaylist(selectedUserPlaylist.value)
  shufflePlaylistItems()
})

watch(selectedUserPlaylistLastUpdatedAt, () => {
  // Re-fetch from local store when current user playlist updated
  parseUserPlaylist(selectedUserPlaylist.value)
})

watch(() => props.videoId, (newId, oldId) => {
  // Check if next video is from the shuffled list or if the user clicked a different video
  if (shuffleEnabled.value) {
    const newVideoIndex = randomizedPlaylistItems.value.findIndex((item) => {
      return item.videoId === newId
    })

    const oldVideoIndex = randomizedPlaylistItems.value.findIndex((item) => {
      return item.videoId === oldId
    })

    if ((newVideoIndex - 1) !== oldVideoIndex) {
      // User clicked a different video than expected. Re-shuffle the list
      shufflePlaylistItems()
    }
  }
})

watch(() => props.playlistItemId, () => {
  prevVideoBeforeDeletion = null
})

watch(() => props.watchViewLoading, (newVal, oldVal) => {
  // If watch view is loaded after this component loaded
  if (oldVal && !newVal) {
    // Scroll after watch view loaded, otherwise doesn't work
    // Mainly for Local API
    // `nextTick` is required (tested via reloading)
    nextTick(scrollToCurrentVideo)
  }
})

watch(isLoading, (newVal, oldVal) => {
  // This component is loaded/rendered before watch view loaded
  if (oldVal && !newVal) {
    // Scroll after this component loaded, otherwise doesn't work
    // Mainly for Invidious API
    // `nextTick` is required (tested via reloading)
    nextTick(scrollToCurrentVideo)
  }
})

watch(() => props.playlistId, () => {
  if (!process.env.SUPPORTS_LOCAL_API || backendPreference.value === 'invidious') {
    getPlaylistInformationInvidious()
  } else {
    getPlaylistInformationLocal()
  }
})

onMounted(() => {
  const cachedPlaylist = store.getters.getCachedPlaylist

  if (cachedPlaylist?.id === props.playlistId) {
    loadCachedPlaylistInformation(cachedPlaylist)
  } else {
    getPlaylistInfoWithDelay()
  }

  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('previoustrack', playPreviousVideo)
    navigator.mediaSession.setActionHandler('nexttrack', playNextVideo)
  }

  window.addEventListener('resize', calculateWindowWidth)
})

onBeforeUnmount(() => {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('previoustrack', null)
    navigator.mediaSession.setActionHandler('nexttrack', null)
  }

  window.removeEventListener('resize', calculateWindowWidth)
})

/**
 * @param {any[]} videoList
 */
function findIndexOfCurrentVideoInPlaylist(videoList) {
  const playlistItemId = props.playlistItemId
  const videoId = props.videoId
  const prevVideoBeforeDeletionPlaylistItemId = prevVideoBeforeDeletion?.playlistItemId
  const prevVideoBeforeDeletionPlaylistVideoId = prevVideoBeforeDeletion?.videoId

  return videoList.findIndex((item) => {
    if (item.playlistItemId && (playlistItemId || prevVideoBeforeDeletionPlaylistItemId)) {
      return item.playlistItemId === playlistItemId || item.playlistItemId === prevVideoBeforeDeletionPlaylistItemId
    } else if (item.videoId) {
      return item.videoId === videoId || item.videoId === prevVideoBeforeDeletionPlaylistVideoId
    } else if (item.id) {
      return item.id === videoId || item.id === prevVideoBeforeDeletionPlaylistVideoId
    }

    return false
  })
}

function getPlaylistInfoWithDelay() {
  if (getPlaylistInfoRun) { return }

  isLoading.value = true
  // `selectedUserPlaylist` result accuracy relies on data being ready
  if (isUserPlaylist.value && !userPlaylistsReady.value) { return }

  getPlaylistInfoRun = true

  if (selectedUserPlaylist.value != null) {
    parseUserPlaylist(selectedUserPlaylist.value)
  } else if (!process.env.SUPPORTS_LOCAL_API || backendPreference.value === 'invidious') {
    getPlaylistInformationInvidious()
  } else {
    getPlaylistInformationLocal()
  }
}

function toggleLoop() {
  if (loopEnabled.value) {
    loopEnabled.value = false
    showToast(t('Loop is now disabled'))
  } else {
    loopEnabled.value = true
    showToast(t('Loop is now enabled'))
  }
}

function toggleShuffle() {
  if (shuffleEnabled.value) {
    shuffleEnabled.value = false
    showToast(t('Shuffle is now disabled'))
  } else {
    shuffleEnabled.value = true
    showToast(t('Shuffle is now enabled'))
    shufflePlaylistItems()
  }
}

function toggleReversePlaylist() {
  isLoading.value = true
  showToast(t('The playlist has been reversed'))

  reversePlaylist.value = !reversePlaylist.value
  // Create a new array to avoid changing array in data store state
  // it could be user playlist or cache playlist
  playlistItems.value = playlistItems.value.toReversed()

  nextTick(() => {
    isLoading.value = false
  })
}

function playNextVideo() {
  const videoIndex = videoIndexInPlaylistItems.value
  const targetVideoIndex = (videoIsNotPlaylistItem.value || videoIsLastPlaylistItem.value) ? 0 : videoIndex + 1

  const targetList = shuffleEnabled.value ? randomizedPlaylistItems.value : playlistItems.value

  const targetPlaylistItem = targetList[targetVideoIndex]

  const routerPushPayload = {
    path: `/watch/${targetPlaylistItem.videoId}`,
    query: {
      playlistId: props.playlistId,
      playlistType: props.playlistType,
      playlistItemId: targetPlaylistItem.playlistItemId
    }
  }

  if (shuffleEnabled.value) {
    let doShufflePlaylistItems = false

    if (videoIsLastPlaylistItem.value && !loopEnabled.value) {
      showToast(t('The playlist has ended. Enable loop to continue playing'))
      return
    }
    // loopEnabled = true
    if (videoIsLastPlaylistItem.value || videoIsNotPlaylistItem.value) {
      doShufflePlaylistItems = true
    }

    router.push(routerPushPayload)

    showToast(t('Playing Next Video'))

    if (doShufflePlaylistItems) {
      shufflePlaylistItems()
    }
  } else {
    const stopDueToLoopDisabled = videoIsLastPlaylistItem.value && !loopEnabled.value

    if (stopDueToLoopDisabled) {
      showToast(t('The playlist has ended. Enable loop to continue playing'))
      return
    }

    router.push(routerPushPayload)
    showToast(t('Playing Next Video'))
  }
}

function playPreviousVideo() {
  showToast(t('Playing Previous Video'))

  let videoIndex = videoIndexInPlaylistItems.value

  /*
  * When the current video being watched in the playlist is deleted,
  * the previous video is shown as the "current" one.
  * So if we want to play the previous video, in this case,
  * we actually want to actually play the "current" video.
  * The only exception is when shuffle is enabled, as we don't actually
  * want to play the last sequential video with shuffle.
  */
  if (prevVideoBeforeDeletion && !shuffleEnabled.value) {
    videoIndex++
  }

  // Wrap around to the end of the playlist only if there are no remaining earlier videos
  const targetVideoIndex = (videoIndex === 0 || videoIsNotPlaylistItem.value) ? playlistItems.value.length - 1 : videoIndex - 1

  const targetList = shuffleEnabled.value ? randomizedPlaylistItems.value : playlistItems.value

  const targetPlaylistItem = targetList[targetVideoIndex]

  router.push(
    {
      path: `/watch/${targetPlaylistItem.videoId}`,
      query: {
        playlistId: props.playlistId,
        playlistType: props.playlistType,
        playlistItemId: targetPlaylistItem.playlistItemId
      }
    }
  )
}

/**
 * @param {{ id: string, title: string, channelName: string, channelId: string, items: any[], continuationData: string | null }} cachedPlaylist
 */
async function loadCachedPlaylistInformation(cachedPlaylist) {
  isLoading.value = true
  getPlaylistInfoRun = true
  store.commit('setCachedPlaylist', null)

  playlistTitle.value = cachedPlaylist.title
  channelName.value = cachedPlaylist.channelName
  channelId.value = cachedPlaylist.channelId

  if (!process.env.SUPPORTS_LOCAL_API || backendPreference.value === 'invidious' || cachedPlaylist.continuationData === null) {
    playlistItems.value = cachedPlaylist.items
  } else {
    const videos = cachedPlaylist.items

    const continuationData = await getLocalCachedFeedContinuation('playlist', cachedPlaylist.continuationData)
    videos.push(...continuationData.items.map(parseLocalPlaylistVideo))

    await untilEndOfLocalPlayList(continuationData, (p) => {
      videos.push(...p.items.map(parseLocalPlaylistVideo))
    }, { runCallbackOnceFirst: false })

    playlistItems.value = videos
  }

  isLoading.value = false
}

async function getPlaylistInformationLocal() {
  isLoading.value = true

  try {
    const playlist = await getLocalPlaylist(props.playlistId)

    let channelName_

    if (playlist.info.author) {
      channelName_ = playlist.info.author.name
    } else {
      const subtitle = playlist.info.subtitle.toString()

      const index = subtitle.lastIndexOf('•')
      channelName_ = subtitle.substring(0, index).trim()
    }

    playlistTitle.value = playlist.info.title
    channelName.value = channelName_
    channelId.value = playlist.info.author?.id

    const videos = []
    await untilEndOfLocalPlayList(playlist, (p) => {
      videos.push(...p.items.map(parseLocalPlaylistVideo))
    })

    playlistItems.value = videos

    isLoading.value = false
  } catch (err) {
    console.error(err)
    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })
    if (backendPreference.value === 'local' && backendFallback.value) {
      showToast(t('Falling back to Invidious API'))
      getPlaylistInformationInvidious()
    } else {
      isLoading.value = false
    }
  }
}

async function getPlaylistInformationInvidious() {
  isLoading.value = true

  try {
    const result = await invidiousGetPlaylistInfo(props.playlistId)

    playlistTitle.value = result.title
    channelName.value = result.author
    channelId.value = result.authorId

    playlistItems.value = result.videos

    isLoading.value = false
  } catch (err) {
    console.error(err)
    const errorMessage = t('Invidious API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })
    if (process.env.SUPPORTS_LOCAL_API && backendPreference.value === 'invidious' && backendFallback.value) {
      showToast(t('Falling back to Local API'))
      getPlaylistInformationLocal()
    } else {
      isLoading.value = false
    }
  }
}

function parseUserPlaylist(playlist) {
  playlistTitle.value = playlist.playlistName
  channelName.value = ''
  channelId.value = ''

  const isCurrentVideoInParsedPlaylist = findIndexOfCurrentVideoInPlaylist(playlist.videos) !== -1
  if (!isCurrentVideoInParsedPlaylist) {
    // grab 2nd video if the 1st one is current & deleted
    // or the prior video in the list before the current video's deletion
    const targetVideoIndex = currentVideoIndexZeroBased.value - 1
    prevVideoBeforeDeletion = targetVideoIndex >= 0 ? playlistItems.value[targetVideoIndex] : null
  }

  playlistItems.value = getSortedPlaylistItems(playlist.videos, sortOrder.value, locale.value, reversePlaylist.value)

  isLoading.value = false
}

function shufflePlaylistItems() {
  // Prevents the array from affecting the original object
  const items = playlistItems.value.slice()

  let cachedCurrentVideos

  if (currentVideo.value != null) {
    cachedCurrentVideos = items.splice(currentVideoIndexZeroBased.value, 1)
    // There is no else case
    // If current video is absent in (removed from) the playlist, nothing should be changed
  }

  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))

    const temp = items[i]
    items[i] = items[j]
    items[j] = temp
  }

  if (cachedCurrentVideos && cachedCurrentVideos.length > 0) {
    items.unshift(cachedCurrentVideos[0])
  }

  randomizedPlaylistItems.value = items
}

const playlistItemsWrapper = useTemplateRef('playlistItemsWrapper')

/**
 * @param {number} index
 */
function scrollToVideo(index) {
  const container = playlistItemsWrapper.value

  if (container != null) {
    const currentVideoItemEl = container.children[index]

    if (currentVideoItemEl != null) {
      // Watch view can be ready sooner than this component
      container.scrollTop = currentVideoItemEl.offsetTop - container.offsetTop
    }
  }
}

function scrollToCurrentVideo() {
  scrollToVideo(currentVideoIndexZeroBased.value)
}

function pausePlayer() {
  emit('pause-player')
}

const playlistProgressBar = useTemplateRef('playlistProgressBar')

/**
 * @param {MouseEvent} event
 */
function updateProgressBarPreview(event) {
  if (!showProgressBarPreview.value) return

  const rect = playlistProgressBar.value.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const progressBarWidth = rect.width
  const percentage = Math.max(0, Math.min(100, (mouseX / progressBarWidth) * 100))

  previewPosition.value = percentage
  previewVideoIndex.value = Math.max(1, Math.min(playlistVideoCount.value, Math.ceil((percentage / 100) * playlistVideoCount.value)))
}

/**
 * @param {PointerEvent} event
 */
function handleProgressBarClick(event) {
  const rect = event.currentTarget.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const progressBarWidth = rect.width
  const clickPercentage = clickX / progressBarWidth

  const targetVideoIndex = Math.max(1, Math.min(playlistVideoCount.value, Math.ceil(clickPercentage * playlistVideoCount.value)))
  const targetArrayIndex = targetVideoIndex - 1

  if (targetArrayIndex >= 0 && targetArrayIndex < playlistItems.value.length) {
    scrollToVideo(targetArrayIndex)
  }
}

function calculateWindowWidth() {
  windowWidth.value = window.innerWidth
}

const videoIsLastInInPlaylistItems = computed(() => {
  if (shuffleEnabled.value) {
    return videoIndexInPlaylistItems.value === randomizedPlaylistItems.value.length - 1
  } else {
    return videoIndexInPlaylistItems.value === playlistItems.value.length - 1
  }
})

const shouldStopDueToPlaylistEnd = computed(() => {
  // Loop enabled = should not stop
  return videoIsLastInInPlaylistItems.value || !loopEnabled.value
})

defineExpose({
  playNextVideo,
  playPreviousVideo,
  shouldStopDueToPlaylistEnd,
  getState: () => ({
    index: reversePlaylist.value
      ? playlistItems.value.length - currentVideoIndexOneBased.value
      : currentVideoIndexZeroBased.value,
    reverse: reversePlaylist.value,
    shuffle: shuffleEnabled.value,
    loop: loopEnabled.value
  })
})
</script>

<style scoped src="./WatchVideoPlaylist.css" />
