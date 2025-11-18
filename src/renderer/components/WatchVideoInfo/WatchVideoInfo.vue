<template>
  <FtCard class="watchVideoInfo">
    <div>
      <h1
        class="videoTitle"
      >
        {{ title }}
      </h1>
      <div
        v-if="isUnlisted"
        class="unlistedBadge"
      >
        {{ t('Video.Unlisted') }}
      </div>
    </div>
    <div class="videoMetrics">
      <div class="datePublishedAndViewCount">
        {{ publishedString }} {{ dateString }}
        <template
          v-if="!hideVideoViews"
        >
          <span class="seperator">• </span><span class="videoViews">{{ parsedViewCount }}</span>
        </template>
      </div>
      <div
        v-if="!hideVideoLikesAndDislikes"
        class="likeBarContainer"
      >
        <div
          class="likeSection"
        >
          <span class="likeCount"><FontAwesomeIcon :icon="['fas', 'thumbs-up']" /> {{ parsedLikeCount }}</span>
        </div>
      </div>
    </div>
    <div class="videoButtons">
      <div
        class="profileRow"
      >
        <div
          v-if="!hideUploader"
        >
          <RouterLink
            :to="`/channel/${channelId}`"
          >
            <img
              :src="channelThumbnail"
              class="channelThumbnail"
              alt=""
            >
          </RouterLink>
        </div>
        <div>
          <div
            v-if="!hideUploader"
          >
            <RouterLink
              :to="`/channel/${channelId}`"
              class="channelName"
            >
              {{ channelName }}
            </RouterLink>
          </div>
          <FtSubscribeButton
            v-if="!hideUnsubscribeButton"
            :channel-id="channelId"
            :channel-name="channelName"
            :channel-thumbnail="channelThumbnail"
            :subscription-count-text="subscriptionCountText"
          />
        </div>
      </div>
      <div class="videoOptions">
        <span class="videoOptionsMobileRow">
          <FtIconButton
            v-if="showPlaylists && !isUpcoming"
            :title="t('User Playlists.Add to Playlist')"
            :icon="['fas', 'plus']"
            theme="base"
            @click="togglePlaylistPrompt"
          />
          <FtIconButton
            v-if="isQuickBookmarkEnabled"
            :title="quickBookmarkIconText"
            :icon="isInQuickBookmarkPlaylist ? ['fas', 'check'] : ['fas', 'bookmark']"
            class="quickBookmarkVideoIcon"
            :class="{
              bookmarked: isInQuickBookmarkPlaylist,
            }"
            :theme="quickBookmarkIconTheme"
            @click="toggleQuickBookmarked"
          />
          <FtIconButton
            v-if="canSaveWatchedProgress && watchedProgressSavingInSemiAutoMode"
            :title="t('Video.Save Watched Progress')"
            :icon="['fas', 'bars-progress']"
            @click="saveWatchedProgressManually"
          />
        </span>
        <span class="videoOptionsMobileRow">
          <FtIconButton
            v-if="USING_ELECTRON && externalPlayer !== ''"
            :title="t('Video.External Player.OpenInTemplate', { externalPlayer })"
            :icon="['fas', 'external-link-alt']"
            theme="secondary"
            @click="handleExternalPlayer"
          />
          <FtIconButton
            v-if="!isUpcoming && downloadLinks.length > 0"
            ref="downloadButton"
            :title="t('Video.Download Video')"
            theme="secondary"
            :icon="['fas', 'download']"
            :return-index="true"
            :dropdown-options="downloadLinks"
            @click="handleDownload"
          />
          <FtIconButton
            v-if="!isUpcoming"
            :title="t('Change Format.Change Media Formats')"
            theme="secondary"
            :icon="['fas', 'file-video']"
            :dropdown-options="formatTypeOptions"
            @click="changeFormat"
          />
          <FtShareButton
            v-if="!hideSharingActions"
            :id="id"
            :get-timestamp="getTimestamp"
            :playlist-id="playlistId"
          />
        </span>
      </div>
    </div>
  </FtCard>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed, nextTick, onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'

import FtCard from '../ft-card/ft-card.vue'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import FtShareButton from '../FtShareButton/FtShareButton.vue'
import FtSubscribeButton from '../FtSubscribeButton/FtSubscribeButton.vue'

import store from '../../store'

import { formatNumber, openExternalLink, showToast } from '../../helpers/utils'

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  channelId: {
    type: String,
    required: true
  },
  channelName: {
    type: String,
    required: true
  },
  channelThumbnail: {
    type: String,
    required: true
  },
  published: {
    type: Number,
    required: true
  },
  premiereDate: {
    type: Date,
    default: undefined
  },
  viewCount: {
    type: Number,
    default: null
  },
  subscriptionCountText: {
    type: String,
    required: true
  },
  likeCount: {
    type: Number,
    default: 0
  },
  dislikeCount: {
    type: Number,
    default: 0
  },
  getTimestamp: {
    type: Function,
    required: true
  },
  isLive: {
    type: Boolean,
    required: false
  },
  isLiveContent: {
    type: Boolean,
    required: true
  },
  isUpcoming: {
    type: Boolean,
    required: true
  },
  downloadLinks: {
    type: Array,
    required: true
  },
  playlistId: {
    type: String,
    default: null
  },
  getPlaylistIndex: {
    type: Function,
    required: true
  },
  getPlaylistReverse: {
    type: Function,
    required: true
  },
  getPlaylistShuffle: {
    type: Function,
    required: true
  },
  getPlaylistLoop: {
    type: Function,
    required: true
  },
  lengthSeconds: {
    type: Number,
    required: true
  },
  videoThumbnail: {
    type: String,
    required: true
  },
  inUserPlaylist: {
    type: Boolean,
    required: true
  },
  isUnlisted: {
    type: Boolean,
    required: false
  },
  canSaveWatchedProgress: {
    type: Boolean,
    required: true
  },
})

const emit = defineEmits([
  'change-format',
  'pause-player',
  'set-info-area-sticky',
  'scroll-to-info-area',
  'save-watched-progress',
])

const USING_ELECTRON = process.env.IS_ELECTRON

const { locale, t } = useI18n()

/** @type {import('vue').ComputedRef<boolean>} */
const hideSharingActions = computed(() => store.getters.getHideSharingActions)

/** @type {import('vue').ComputedRef<boolean>} */
const hideUnsubscribeButton = computed(() => store.getters.getHideUnsubscribeButton)

/** @type {import('vue').ComputedRef<boolean>} */
const hideUploader = computed(() => store.getters.getHideUploader)

/** @type {import('vue').ComputedRef<boolean>} */
const hideVideoLikesAndDislikes = computed(() => store.getters.getHideVideoLikesAndDislikes)

const parsedLikeCount = computed(() => {
  if (hideVideoLikesAndDislikes.value || props.likeCount === null) {
    return null
  }

  return formatNumber(props.likeCount)
})

/** @type {import('vue').ComputedRef<boolean>} */
const hideVideoViews = computed(() => store.getters.getHideVideoViews)

const parsedViewCount = computed(() => {
  if (hideVideoViews.value || props.viewCount == null) {
    return null
  }

  return t('Global.Counts.View Count', { count: formatNumber(props.viewCount) }, props.viewCount)
})

const dateString = computed(() => {
  const formatter = new Intl.DateTimeFormat([locale.value, 'en'], { dateStyle: 'medium' })
  const localeDateString = formatter.format(props.published)
  // replace spaces with no break spaces to make the date act as a single entity while wrapping
  return localeDateString.replaceAll(' ', '\u00A0')
})

const publishedString = computed(() => {
  if (props.isLive) {
    return t('Video.Started streaming on')
  } else if (props.isLiveContent && !props.isLive) {
    return t('Video.Streamed on')
  } else {
    return t('Video.Published on')
  }
})

const formatTypeOptions = computed(() => [
  {
    label: t('Change Format.Use Dash Formats'),
    value: 'dash'
  },
  {
    label: t('Change Format.Use Legacy Formats'),
    value: 'legacy'
  },
  {
    label: t('Change Format.Use Audio Formats'),
    value: 'audio'
  }
])

/**
 * @param {'dash' | 'legacy' | 'audio'} value
 */
function changeFormat(value) {
  emit('change-format', value)
}

const watchedProgressSavingInSemiAutoMode = computed(() => {
  return store.getters.getWatchedProgressSavingMode === 'semi-auto'
})

function saveWatchedProgressManually() {
  emit('save-watched-progress')
}

/** @type {import('vue').ComputedRef<boolean>} */
const rememberHistory = computed(() => store.getters.getRememberHistory)

const historyEntryExists = computed(() => store.getters.getHistoryCacheById[props.id] !== undefined)

/** @type {import('vue').ComputedRef<string>} */
const externalPlayer = computed(() => store.getters.getExternalPlayer)

/** @type {import('vue').ComputedRef<number>} */
const defaultPlayback = computed(() => store.getters.getDefaultPlayback)

function handleExternalPlayer() {
  emit('pause-player')

  let payload

  // Only play video in non playlist mode when user playlist detected
  if (props.inUserPlaylist) {
    payload = {
      watchProgress: props.getTimestamp(),
      playbackRate: defaultPlayback.value,
      videoId: props.id,
      videoLength: props.lengthSeconds
    }
  } else {
    payload = {
      watchProgress: props.getTimestamp(),
      playbackRate: defaultPlayback.value,
      videoId: props.id,
      videoLength: props.lengthSeconds,
      playlistId: props.playlistId,
      playlistIndex: props.getPlaylistIndex(),
      playlistReverse: props.getPlaylistReverse(),
      playlistShuffle: props.getPlaylistShuffle(),
      playlistLoop: props.getPlaylistLoop()
    }
  }

  store.dispatch('openInExternalPlayer', payload)

  if (rememberHistory.value) {
    // Marking as watched
    const videoData = {
      videoId: props.id,
      title: props.title,
      author: props.channelName,
      authorId: props.channelId,
      published: props.published,
      description: props.description,
      viewCount: props.viewCount,
      lengthSeconds: props.lengthSeconds,
      watchProgress: 0,
      timeWatched: Date.now(),
      isLive: false,
      type: 'video'
    }

    store.dispatch('updateHistory', videoData)

    if (!historyEntryExists.value) {
      showToast(t('Video.Video has been marked as watched'))
    }
  }
}

const downloadButton = useTemplateRef('downloadButton')

/** @type {import('vue').WatchHandle | undefined} */
let downloadDropdownWatcher

onMounted(() => {
  if (process.env.IS_ELECTRON || 'mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: props.title,
      artist: props.channelName,
      artwork: [{
        src: props.videoThumbnail,
        sizes: '128x128',
        type: 'img/png'
      }]
    })
  }

  downloadDropdownWatcher = watch(() => downloadButton.value.dropdownShown, (dropdownShown) => {
    emit('set-info-area-sticky', !dropdownShown)

    if (dropdownShown && window.innerWidth >= 901) {
      // adds a slight delay so we know that the dropdown has shown up
      // and won't mess up our scrolling
      nextTick(() => {
        emit('scroll-to-info-area')
      })
    }
  })
})

onBeforeUnmount(() => {
  if (downloadDropdownWatcher) {
    downloadDropdownWatcher.stop()
    downloadDropdownWatcher = undefined
  }
})

/** @type {import('vue').ComputedRef<'download' | 'open'>} */
const downloadBehavior = computed(() => store.getters.getDownloadBehavior)

/**
 * @param {number} index
 */
function handleDownload(index) {
  const selectedDownloadLinkOption = props.downloadLinks[index]
  const mimeTypeUrl = selectedDownloadLinkOption.value.split('||')

  if (!process.env.IS_ELECTRON || downloadBehavior.value === 'open') {
    openExternalLink(mimeTypeUrl[1])
  } else {
    store.dispatch('downloadMedia', {
      url: mimeTypeUrl[1],
      title: props.title,
      mimeType: mimeTypeUrl[0]
    })
  }
}

const showPlaylists = computed(() => !store.getters.getHidePlaylists)

function togglePlaylistPrompt() {
  const videoData = {
    videoId: props.id,
    title: props.title,
    author: props.channelName,
    authorId: props.channelId,
    description: props.description,
    viewCount: props.viewCount,
    lengthSeconds: props.lengthSeconds,
    published: props.published,
    premiereDate: props.premiereDate
  }

  store.dispatch('showAddToPlaylistPromptForManyVideos', { videos: [videoData] })
}

const quickBookmarkPlaylist = computed(() => store.getters.getQuickBookmarkPlaylist)

const isQuickBookmarkEnabled = computed(() => quickBookmarkPlaylist.value != null)

const isInQuickBookmarkPlaylist = computed(() => {
  if (!isQuickBookmarkEnabled.value) { return false }

  // Accessing a reactive property has a negligible amount of overhead,
  // however as we know that some users have playlists that have more than 10k items in them
  // it adds up quickly. So create a temporary variable outside of the array, so we only have to do it once.
  // Also the search is retriggered every time any playlist is modified.
  const id = props.id

  return quickBookmarkPlaylist.value.videos.some((video) => {
    return video.videoId === id
  })
})

const quickBookmarkIconText = computed(() => {
  if (!isQuickBookmarkEnabled.value) { return '' }

  const translationProperties = {
    playlistName: quickBookmarkPlaylist.value.playlistName,
  }
  return isInQuickBookmarkPlaylist.value
    ? t('User Playlists.Remove from Favorites', translationProperties)
    : t('User Playlists.Add to Favorites', translationProperties)
})

const quickBookmarkIconTheme = computed(() => isInQuickBookmarkPlaylist.value ? 'base favorite' : 'base')

function toggleQuickBookmarked() {
  if (!isQuickBookmarkEnabled.value) {
    // This should be prevented by UI
    return
  }

  if (isInQuickBookmarkPlaylist.value) {
    removeFromQuickBookmarkPlaylist()
  } else {
    addToQuickBookmarkPlaylist()
  }
}

function addToQuickBookmarkPlaylist() {
  const videoData = {
    videoId: props.id,
    title: props.title,
    author: props.channelName,
    authorId: props.channelId,
    lengthSeconds: props.lengthSeconds,
    published: props.published,
    premiereDate: props.premiereDate
  }

  store.dispatch('addVideo', {
    _id: quickBookmarkPlaylist.value._id,
    videoData,
  })

  // TODO: Maybe show playlist name
  showToast(t('Video.Video has been saved'))
}

function removeFromQuickBookmarkPlaylist() {
  store.dispatch('removeVideo', {
    _id: quickBookmarkPlaylist.value._id,
    // Remove all playlist items with same videoId
    videoId: props.id,
  })

  // TODO: Maybe show playlist name
  showToast(t('Video.Video has been removed from your saved list'))
}
</script>

<style scoped src="./WatchVideoInfo.css" />
