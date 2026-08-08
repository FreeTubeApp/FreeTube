<template>
  <FtCard class="watchVideoInfo">
    <div>
      <h1
        class="videoTitle"
        dir="auto"
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
          <component
            :is="enableChannelLinks ? 'RouterLink' : 'div'"
            :to="`/channel/${channelId}`"
          >
            <img
              :src="channelThumbnail"
              :class="enableChannelLinks ? '' : 'initialCursor'"
              class="channelThumbnail"
              alt=""
            >
          </component>
        </div>
        <div>
          <div
            v-if="!hideUploader"
          >
            <component
              :is="enableChannelLinks ? 'RouterLink' : 'span'"
              :to="`/channel/${channelId}`"
              :class="enableChannelLinks ? '' : 'initialCursor'"
              class="channelName"
              dir="auto"
            >
              {{ channelName }}
            </component>
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
            v-if="USING_ELECTRON"
            :title="t('Video.Download Video')"
            :icon="['fas', 'download']"
            theme="secondary"
            :force-dropdown="true"
          >
            <div class="downloadOptions">
              <FtFlexBox>
                <FtToggleSwitch
                  :label="t('Video.Download.Include Timestamp')"
                  :compact="true"
                  :default-value="downloadIncludeTimestamp"
                  @change="updateDownloadIncludeTimestamp"
                />
              </FtFlexBox>
              <FtFlexBox v-if="downloadIncludeTimestamp">
                <FtInput
                  :placeholder="t('Video.Download.Start Time')"
                  :show-action-button="false"
                  :show-label="true"
                  :value="downloadStartTime"
                  @input="updateDownloadStartTime"
                />
              </FtFlexBox>
              <FtFlexBox v-if="downloadIncludeTimestamp">
                <FtInput
                  :placeholder="t('Video.Download.End Time')"
                  :show-action-button="false"
                  :show-label="true"
                  :value="downloadEndTime"
                  @input="updateDownloadEndTime"
                />
              </FtFlexBox>
            </div>
            <div class="downloadButtons">
              <FtButton
                class="action"
                :icon="['fas', 'video']"
                :label="t('Video.Download.Video')"
                @click="handleDownload('video')"
              />
              <FtButton
                class="action"
                :icon="['fas', 'headphones']"
                :label="t('Video.Download.Audio')"
                @click="handleDownload('audio')"
              />
            </div>
          </FtIconButton>
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
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import FtButton from '../FtButton/FtButton.vue'
import FtCard from '../ft-card/ft-card.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtIconButton from '../FtIconButton/FtIconButton.vue'
import FtInput from '../FtInput/FtInput.vue'
import FtShareButton from '../FtShareButton/FtShareButton.vue'
import FtSubscribeButton from '../FtSubscribeButton/FtSubscribeButton.vue'
import FtToggleSwitch from '../FtToggleSwitch/FtToggleSwitch.vue'

import store from '../../store'

import { formatDurationAsTimestamp, formatNumber, showToast } from '../../helpers/utils'

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
  playlistId: {
    type: String,
    default: null
  },
  /** @type {import('vue').PropType<() => { index: number, reverse: boolean, shuffle: boolean, loop: boolean }>} */
  getPlaylistState: {
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
  'save-watched-progress',
])

const USING_ELECTRON = process.env.IS_ELECTRON

const { locale, t } = useI18n()
const router = useRouter()

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
      videoId: props.id,
      startTime: props.getTimestamp(),
      playbackRate: defaultPlayback.value,
    }
  } else {
    const playlistState = props.getPlaylistState()

    payload = {
      videoId: props.id,
      playlistId: props.playlistId,
      startTime: props.getTimestamp(),
      playbackRate: defaultPlayback.value,
      playlistIndex: playlistState.index,
      playlistReverse: playlistState.reverse,
      playlistShuffle: playlistState.shuffle,
      playlistLoop: playlistState.loop
    }
  }

  if (process.env.IS_ELECTRON) {
    window.ftElectron.openInExternalPlayer(payload)
  }

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

const downloadIncludeTimestamp = ref(false)
const downloadStartTime = ref('0:00')
const downloadEndTime = ref('')

function updateDownloadIncludeTimestamp() {
  downloadIncludeTimestamp.value = !downloadIncludeTimestamp.value

  if (downloadIncludeTimestamp.value) {
    downloadStartTime.value = formatDurationAsTimestamp(Math.trunc(props.getTimestamp()))
    downloadEndTime.value = formatDurationAsTimestamp(Math.trunc(props.lengthSeconds))
  }
}

/**
 * @param {string} value
 */
function updateDownloadStartTime(value) {
  downloadStartTime.value = value
}

/**
 * @param {string} value
 */
function updateDownloadEndTime(value) {
  downloadEndTime.value = value
}

/**
 * @param {string} value
 * @returns {number | null}
 */
function parseTimestampToSeconds(value) {
  const trimmed = value.trim()
  if (trimmed === '') {
    return null
  }

  const parts = trimmed.split(':')
  if (parts.length < 2 || parts.length > 3 || parts.some(part => !/^\d+$/.test(part))) {
    return null
  }

  const numbers = parts.map(Number)
  const [hours, minutes, seconds] = numbers.length === 3 ? numbers : [0, ...numbers]

  return (hours * 3600) + (minutes * 60) + seconds
}

/**
 * @param {'video' | 'audio'} mode
 */
async function handleDownload(mode) {
  if (!process.env.IS_ELECTRON) {
    return
  }

  const startTime = downloadIncludeTimestamp.value ? parseTimestampToSeconds(downloadStartTime.value) : null
  const endTime = downloadIncludeTimestamp.value ? parseTimestampToSeconds(downloadEndTime.value) : null

  const result = await window.ftElectron.downloadVideo(props.id, mode, startTime, endTime)

  switch (result) {
    case 'ok':
      showToast(mode === 'audio'
        ? t('Video.Audio download has started')
        : t('Video.Video download has started'))
      break
    case 'not-configured':
    case 'error':
      showToast(t('Video.Video download failed, please configure the External Downloader Settings'))
      router.push({ path: '/settings', query: { section: 'external-downloader' } })
      break
  }
}

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
})

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

const enableChannelLinks = computed(() => !store.getters.getDisableChannelLinks)
</script>

<style scoped src="./WatchVideoInfo.css" />
