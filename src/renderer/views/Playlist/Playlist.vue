<template>
  <div
    :class="{
      [listType]: true,
      playlistInEditMode,
      hasNoPlaylistDescription: !playlistDescription,
      oneOrFewer: shownVideoCount < 2
    }"
    class="playlistPage"
  >
    <FtLoader
      v-if="isLoading"
      :fullscreen="true"
    />
    <div
      v-if="!isLoading"
      class="playlistInfoContainer"
      :class="{
        promptOpen,
      }"
    >
      <PlaylistInfo
        :id="playlistId"
        :first-video-id="firstVideoId"
        :first-video-playlist-item-id="firstVideoPlaylistItemId"
        :playlist-thumbnail="playlistThumbnail"
        :title="playlistTitle"
        :channel-name="channelName"
        :channel-thumbnail="channelThumbnail"
        :channel-id="channelId"
        :last-updated="lastUpdated"
        :description="playlistDescription"
        :video-count="shownVideoCount"
        :videos="shownPlaylistItems"
        :sorted-videos="sortedPlaylistItems"
        :view-count="viewCount"
        :total-playlist-duration="totalPlaylistDuration"
        :is-duration-approximate="isDurationApproximate"
        :info-source="infoSource"
        :more-video-data-available="moreVideoDataAvailable"
        :search-video-mode-allowed="isUserPlaylistRequested && shownVideoCount > 1"
        :search-query-text="searchQueryTextRequested"
        :theme="listType === 'list' ? 'base' : 'top-bar'"
        class="playlistInfo"
        @enter-edit-mode="playlistInEditMode = true"
        @exit-edit-mode="playlistInEditMode = false"
        @search-video-query-change="handleVideoSearchQueryChange"
        @prompt-open="promptOpen = true"
        @prompt-close="promptOpen = false"
      />
    </div>

    <FtCard
      v-if="!isLoading"
      class="playlistItemsCard"
    >
      <template
        v-if="shownPlaylistItems.length > 0"
      >
        <FtSelect
          v-if="isUserPlaylistRequested && shownPlaylistItems.length > 1"
          class="sortSelect"
          :value="sortOrder"
          :select-names="sortBySelectNames"
          :select-values="SORT_BY_SELECT_VALUES"
          :placeholder="t('Global.Sort By')"
          :icon="sortOrderIcon"
          @change="updateUserPlaylistSortOrder"
        />
        <template
          v-if="visiblePlaylistItems.length > 0"
        >
          <FtElementList
            v-if="listType === 'grid'"
            :data="visiblePlaylistItems"
            display="grid"
            :playlist-id="playlistId"
            :playlist-type="infoSource"
            :show-video-with-last-viewed-playlist="true"
            :use-channels-hidden-preference="false"
            :hide-forbidden-titles="false"
            :always-show-add-to-playlist-button="true"
            :quick-bookmark-button-enabled="quickBookmarkButtonEnabled"
            :can-move-video-up="canMoveVideos"
            :can-move-video-down="canMoveVideos"
            :playlist-items-length="shownPlaylistItems.length"
            :can-remove-from-playlist="true"
            @move-video-up="moveVideoUp"
            @move-video-down="moveVideoDown"
            @remove-from-playlist="removeVideoFromPlaylist"
          />
          <TransitionGroup
            v-else
            name="playlistItem"
            tag="span"
            class="playlistItems"
          >
            <FtListVideoNumbered
              v-for="(item, index) in visiblePlaylistItems"
              :key="`${item.videoId}-${item.playlistItemId || index}`"
              class="playlistItem"
              :data="item"
              :playlist-id="playlistId"
              :playlist-type="infoSource"
              :playlist-index="playlistInVideoSearchMode ? shownPlaylistItems.findIndex(i => i === item) : index"
              :playlist-item-id="item.playlistItemId"
              appearance="result"
              :always-show-add-to-playlist-button="true"
              :quick-bookmark-button-enabled="quickBookmarkButtonEnabled"
              :can-move-video-up="index > 0 && canMoveVideos"
              :can-move-video-down="index < shownPlaylistItems.length - 1 && canMoveVideos"
              :can-remove-from-playlist="true"
              :video-index="playlistInVideoSearchMode ? shownPlaylistItems.findIndex(i => i === item) : index"
              :initial-visible-state="index < 10"
              @move-video-up="moveVideoUp"
              @move-video-down="moveVideoDown"
              @remove-from-playlist="removeVideoFromPlaylist"
            />
          </TransitionGroup>
          <FtAutoLoadNextPageWrapper
            v-if="moreVideoDataAvailable && !isLoadingMore"
            @load-next-page="getNextPage"
          >
            <FtFlexBox>
              <FtButton
                :label="t('Subscriptions.Load More Videos')"
                background-color="var(--primary-color)"
                text-color="var(--text-with-main-color)"
                @click="getNextPage"
              />
            </FtFlexBox>
          </FtAutoLoadNextPageWrapper>
          <div
            v-if="isLoadingMore"
            class="loadNextPageWrapper"
          >
            <FtLoader />
          </div>
        </template>
        <FtFlexBox
          v-else
        >
          <p class="message">
            {{ t("User Playlists['Empty Search Message']") }}
          </p>
        </FtFlexBox>
      </template>
      <FtFlexBox
        v-else
      >
        <p class="message">
          {{ t("User Playlists['This playlist currently has no videos.']") }}
        </p>
      </FtFlexBox>
    </FtCard>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'
import { isNavigationFailure, NavigationFailureType, onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'

import FtLoader from '../../components/FtLoader/FtLoader.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import PlaylistInfo from '../../components/PlaylistInfo/PlaylistInfo.vue'
import FtListVideoNumbered from '../../components/FtListVideoNumbered/FtListVideoNumbered.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtButton from '../../components/FtButton/FtButton.vue'
import FtElementList from '../../components/FtElementList/FtElementList.vue'
import FtSelect from '../../components/FtSelect/FtSelect.vue'
import FtAutoLoadNextPageWrapper from '../../components/FtAutoLoadNextPageWrapper.vue'

import store from '../../store/index'

import {
  extractLocalCacheablePlaylistContinuation,
  getLocalPlaylist,
  getLocalPlaylistContinuation,
  parseLocalPlaylistVideo,
} from '../../helpers/api/local'
import {
  debounce,
  extractNumberFromString,
  getIconForSortPreference,
  showToast,
  deepCopy,
} from '../../helpers/utils'
import { invidiousGetPlaylistInfo, youtubeImageUrlToInvidious } from '../../helpers/api/invidious'
import { getSortedPlaylistItems, videoDurationPresent, videoDurationWithFallback, SORT_BY_VALUES } from '../../helpers/playlists'
import packageDetails from '../../../../package.json'
import { MOBILE_WIDTH_THRESHOLD, PLAYLIST_HEIGHT_FORCE_LIST_THRESHOLD } from '../../../constants'

const { locale, t } = useI18n()
const route = useRoute()
const router = useRouter()

const isLoading = ref(true)
const playlistTitle = ref('')
const playlistDescription = ref('')
const firstVideoId = ref('')
const firstVideoPlaylistItemId = ref('')
const playlistThumbnail = ref('')
const viewCount = ref(0)
const videoCount = ref(0)
/** @type {import('vue').Ref<string | undefined>} */
const lastUpdated = ref(undefined)
const channelName = ref('')
const channelThumbnail = ref('')
const channelId = ref('')
const infoSource = ref('local')
const playlistItems = ref([])
const userPlaylistVisibleLimit = ref(100)
/** @type {import('vue').ShallowRef<import('youtubei.js').YT.Playlist | null>} */
const continuationData = shallowRef(null)
const isLoadingMore = ref(false)
const playlistInEditMode = ref(false)
const forceListView = ref(false)
let alreadyShownNotice = false
const videoSearchQuery = ref('')
const promptOpen = ref(false)
/** @type {import('vue').Ref<string[]>} */
const toBeDeletedPlaylistItemIds = ref([])
/** @type {AbortController | null} */
let undoToastAbortController = null

/** @type {import('vue').ComputedRef<'local' | 'invidious'>} */
const backendPreference = computed(() => store.getters.getBackendPreference)

/** @type {import('vue').ComputedRef<boolean>} */
const backendFallback = computed(() => store.getters.getBackendFallback)

/** @type {import('vue').ComputedRef<string>} */
const currentInvidiousInstanceUrl = computed(() => store.getters.getCurrentInvidiousInstanceUrl)

/** @type {import('vue').ComputedRef<string>} */
const userPlaylistSortOrder = computed(() => store.getters.getUserPlaylistSortOrder)

const sortOrder = computed(() => isUserPlaylistRequested.value ? userPlaylistSortOrder.value : SORT_BY_VALUES.Custom)

const playlistId = computed(() => route.params.id)

/** @type {import('vue').ComputedRef<'grid' | 'list'>} */
const listType = computed(() => isUserPlaylistRequested.value && !forceListView.value ? store.getters.getListType : 'list')

/** @type {import('vue').ComputedRef<boolean>} */
const userPlaylistsReady = computed(() => store.getters.getPlaylistsReady)

const selectedUserPlaylist = computed(() => {
  const playlistId_ = playlistId.value

  if (
    !isUserPlaylistRequested.value ||
    playlistId_ == null ||
    playlistId_ === ''
  ) {
    return null
  }

  return store.getters.getPlaylist(playlistId_)
})

/** @type {import('vue').ComputedRef<number | undefined>} */
const selectedUserPlaylistLastUpdatedAt = computed(() => selectedUserPlaylist.value?.lastUpdatedAt)

/** @type {import('vue').ComputedRef<any[]>} */
const selectedUserPlaylistVideos = computed(() => selectedUserPlaylist.value?.videos ?? [])

const selectedUserPlaylistVideoCount = computed(() => selectedUserPlaylistVideos.value.length)

const moreVideoDataAvailable = computed(() => {
  return isUserPlaylistRequested.value
    ? userPlaylistVisibleLimit.value < sometimesFilteredUserPlaylistItems.value.length
    : continuationData.value !== null
})

const processedVideoSearchQuery = computed(() => videoSearchQuery.value.trim().toLowerCase())

const playlistInVideoSearchMode = computed(() => processedVideoSearchQuery.value !== '')

/** @type {import('vue').ComputedRef<string>} */
const searchQueryTextRequested = computed(() => route.query.searchQueryText ?? '')
const searchQueryTextPresent = computed(() => {
  const searchQueryText = searchQueryTextRequested.value
  return typeof searchQueryText === 'string' && searchQueryText !== ''
})

const isUserPlaylistRequested = computed(() => route.query.playlistType === 'user')

/** @type {import('vue').ComputedRef<string | undefined>} */
const quickBookmarkPlaylistId = computed(() => store.getters.getQuickBookmarkTargetPlaylistId)

const quickBookmarkButtonEnabled = computed(() => {
  if (selectedUserPlaylist.value == null) { return true }

  return selectedUserPlaylist.value?._id !== quickBookmarkPlaylistId.value
})

const sometimesFilteredUserPlaylistItems = computed(() => {
  if (!isUserPlaylistRequested.value || processedVideoSearchQuery.value === '') {
    return sortedPlaylistItems.value
  }

  const processedVideoSearchQuery_ = processedVideoSearchQuery.value

  return sortedPlaylistItems.value.filter((v) => {
    return (typeof v.title === 'string' && v.title.toLowerCase().includes(processedVideoSearchQuery_)) ||
      (typeof v.author === 'string' && v.author.toLowerCase().includes(processedVideoSearchQuery_))
  })
})

const isSortOrderCustom = computed(() => sortOrder.value === SORT_BY_VALUES.Custom)

const sortedPlaylistItems = computed(() => {
  if (
    sortOrder.value === SORT_BY_VALUES.VideoDurationAscending ||
    sortOrder.value === SORT_BY_VALUES.VideoDurationDescending
  ) {
    const playlistItems = getPlaylistItemsWithDuration()
    return getSortedPlaylistItems(playlistItems, sortOrder.value, locale.value)
  }
  return getSortedPlaylistItems(shownPlaylistItems.value, sortOrder.value, locale.value)
})

const visiblePlaylistItems = computed(() => {
  if (!isUserPlaylistRequested.value) {
    // No filtering for non user playlists yet
    return sortedPlaylistItems.value
  }

  if (userPlaylistVisibleLimit.value < sometimesFilteredUserPlaylistItems.value.length) {
    return sometimesFilteredUserPlaylistItems.value.slice(0, userPlaylistVisibleLimit.value)
  } else {
    return sometimesFilteredUserPlaylistItems.value
  }
})

const sortOrderIcon = computed(() => getIconForSortPreference(sortOrder.value))

const SORT_BY_SELECT_VALUES = Object.values(SORT_BY_VALUES)

const sortBySelectNames = computed(() => {
  return SORT_BY_SELECT_VALUES.map((k) => {
    switch (k) {
      case SORT_BY_VALUES.Custom:
        return t('Playlist.Sort By.Custom')
      case SORT_BY_VALUES.DateAddedNewest:
        return t('Playlist.Sort By.DateAddedNewest')
      case SORT_BY_VALUES.DateAddedOldest:
        return t('Playlist.Sort By.DateAddedOldest')
      case SORT_BY_VALUES.PublishedNewest:
        return t('Playlist.Sort By.PublishedNewest')
      case SORT_BY_VALUES.PublishedOldest:
        return t('Playlist.Sort By.PublishedOldest')
      case SORT_BY_VALUES.VideoTitleAscending:
        return t('Playlist.Sort By.VideoTitleAscending')
      case SORT_BY_VALUES.VideoTitleDescending:
        return t('Playlist.Sort By.VideoTitleDescending')
      case SORT_BY_VALUES.AuthorAscending:
        return t('Playlist.Sort By.AuthorAscending')
      case SORT_BY_VALUES.AuthorDescending:
        return t('Playlist.Sort By.AuthorDescending')
      case SORT_BY_VALUES.VideoDurationAscending:
        return t('Playlist.Sort By.VideoDurationAscending')
      case SORT_BY_VALUES.VideoDurationDescending:
        return t('Playlist.Sort By.VideoDurationDescending')
      default:
        console.error(`Unknown sort: ${k}`)
        return k
    }
  })
})

/**
 * @param {string} value
 */
function updateUserPlaylistSortOrder(value) {
  store.dispatch('updateUserPlaylistSortOrder', value)
}

/** @type {import('vue').ComputedRef<number>} */
const totalPlaylistDuration = computed(() => {
  return shownPlaylistItems.value.reduce((acc, video) => {
    return typeof video.lengthSeconds === 'number' ? acc + video.lengthSeconds : acc
  }, 0)
})

const isDurationApproximate = computed(() => {
  return shownPlaylistItems.value.some((video) => typeof video.lengthSeconds !== 'number')
})

const noPlaylistItemsPendingDeletion = computed(() => toBeDeletedPlaylistItemIds.value.length === 0)

const shownPlaylistItems = computed(() => {
  if (noPlaylistItemsPendingDeletion.value) {
    return playlistItems.value
  }

  const toBeDeletedPlaylistItemIds_ = toBeDeletedPlaylistItemIds.value
  return playlistItems.value.filter((v) => !toBeDeletedPlaylistItemIds_.includes(v.playlistItemId))
})

const shownPlaylistItemCount = computed(() => shownPlaylistItems.value)

const shownVideoCount = computed(() => isUserPlaylistRequested.value ? shownPlaylistItemCount.value.length : videoCount.value)

function getPlaylistInfo() {
  isLoading.value = true

  if (isUserPlaylistRequested.value) {
    if (!userPlaylistsReady.value) { return }

    if (selectedUserPlaylist.value != null) {
      parseUserPlaylist(selectedUserPlaylist.value)
    } else {
      showToast(t('User Playlists.SinglePlaylistView.Toast.This playlist does not exist'))
    }
  } else {
    if (!process.env.SUPPORTS_LOCAL_API || backendPreference.value === 'invidious') {
      getPlaylistInvidious()
    } else {
      getPlaylistLocal()
    }
  }
}

const getPlaylistInfoDebounce = debounce(getPlaylistInfo, 100)

async function getPlaylistLocal() {
  try {
    const result = await getLocalPlaylist(playlistId.value)

    let channelName_

    if (result.info.author) {
      channelName_ = result.info.author.name
    } else {
      const subtitle = result.info.subtitle?.toString()
      if (subtitle) {
        const index = subtitle.lastIndexOf('•')
        channelName_ = subtitle.substring(0, index).trim()
      } else {
        channelName_ = ''
      }
    }

    const playlistItems_ = result.items.map(parseLocalPlaylistVideo)

    playlistTitle.value = result.info.title
    playlistDescription.value = result.info.description ?? ''
    firstVideoId.value = playlistItems_[0].videoId
    playlistThumbnail.value = result.info.thumbnails[0].url
    viewCount.value = result.info.views.toLowerCase() === 'no views' ? 0 : extractNumberFromString(result.info.views)
    videoCount.value = extractNumberFromString(result.info.total_items)
    lastUpdated.value = result.info.last_updated ?? ''
    channelName.value = channelName_ ?? ''
    channelThumbnail.value = result.info.author?.best_thumbnail?.url ?? ''
    channelId.value = result.info.author?.id
    infoSource.value = 'local'

    store.dispatch('updateSubscriptionDetails', {
      channelThumbnailUrl: channelThumbnail.value,
      channelName: channelName_,
      channelId: channelId.value
    })

    playlistItems.value = playlistItems_

    let shouldGetNextPage = false
    if (result.has_continuation) {
      continuationData.value = result
      shouldGetNextPage = playlistItems.value.length < 100
    }
    // To workaround the effect of useless continuation data
    // auto load next page again when no. of parsed items < page size
    if (shouldGetNextPage) {
      getNextPageLocal()
    }

    updatePageTitle()

    isLoading.value = false
  } catch (err) {
    console.error(err)

    if (backendPreference.value === 'local' && backendFallback.value) {
      console.warn('Falling back to Invidious API')
      getPlaylistInvidious()
    } else {
      isLoading.value = false
    }
  }
}

async function getPlaylistInvidious() {
  try {
    const result = await invidiousGetPlaylistInfo(playlistId.value)

    playlistTitle.value = result.title
    playlistDescription.value = result.description
    firstVideoId.value = result.videos[0].videoId
    viewCount.value = result.viewCount
    videoCount.value = result.videoCount
    channelName.value = result.author
    channelThumbnail.value = youtubeImageUrlToInvidious(result.authorThumbnails[2].url, currentInvidiousInstanceUrl.value)
    channelId.value = result.authorId
    infoSource.value = 'invidious'

    store.dispatch('updateSubscriptionDetails', {
      channelThumbnailUrl: result.authorThumbnails[2].url,
      channelName: channelName.value,
      channelId: channelId.value
    })

    const dateString = new Date(result.updated * 1000)
    lastUpdated.value = dateString.toLocaleDateString(locale.value, { year: 'numeric', month: 'short', day: 'numeric' })

    playlistItems.value = result.videos

    updatePageTitle()

    isLoading.value = false
  } catch (err) {
    console.error(err)

    if (process.env.SUPPORTS_LOCAL_API && backendPreference.value === 'invidious' && backendFallback.value) {
      console.warn('Error getting data with Invidious, falling back to local backend')
      getPlaylistLocal()
    } else {
      isLoading.value = false
      // TODO: Show toast with error message
    }
  }
}

function parseUserPlaylist(playlist) {
  playlistTitle.value = playlist.playlistName
  playlistDescription.value = playlist.description ?? ''

  if (playlist.videos.length > 0) {
    firstVideoId.value = playlist.videos[0].videoId
    firstVideoPlaylistItemId.value = playlist.videos[0].playlistItemId
  } else {
    firstVideoId.value = ''
    firstVideoPlaylistItemId.value = ''
  }

  const dateString = new Date(playlist.lastUpdatedAt)
  lastUpdated.value = dateString.toLocaleDateString(locale.value, { year: 'numeric', month: 'short', day: 'numeric' })
  viewCount.value = 0
  channelName.value = ''
  channelThumbnail.value = ''
  channelId.value = ''
  infoSource.value = 'user'

  playlistItems.value = playlist.videos

  updatePageTitle()

  isLoading.value = false
}

// react to route changes...
watch(playlistId, getPlaylistInfoDebounce)

watch(userPlaylistsReady, () => {
  // Fetch from local store when playlist data ready
  if (!isUserPlaylistRequested.value) { return }

  getPlaylistInfoDebounce()
})

// Fetch from local store when current user playlist changed
watch(selectedUserPlaylist, getPlaylistInfoDebounce)

// Re-fetch from local store when current user playlist updated
watch(selectedUserPlaylistLastUpdatedAt, getPlaylistInfoDebounce)

watch(selectedUserPlaylistVideoCount, async () => {
  // Monitoring `selectedUserPlaylistVideos` makes this function called
  // Even when the same array object is returned
  // So length is monitored instead
  // Assuming in user playlist video cannot be swapped without length change

  // Re-fetch from local store when current user playlist videos updated
  // MUST NOT use `getPlaylistInfoDebounce` as it will cause delay in data update
  // Causing deleted videos to reappear for one frame
  getPlaylistInfo()
})

const historyCacheById = computed(() => store.getters.getHistoryCacheById)

function getPlaylistItemsWithDuration() {
  const modifiedPlaylistItems = deepCopy(shownPlaylistItems.value)
  let anyVideoMissingDuration = false

  modifiedPlaylistItems.forEach(video => {
    if (videoDurationPresent(video)) { return }

    const videoHistory = historyCacheById[video.videoId]

    if (typeof videoHistory !== 'undefined') {
      const fetchedLengthSeconds = videoDurationWithFallback(videoHistory)
      video.lengthSeconds = fetchedLengthSeconds

      // if the video duration is 0, it will be the fallback value, so mark it as missing a duration
      if (fetchedLengthSeconds === 0) {
        anyVideoMissingDuration = true
      }
    } else {
      // Mark at least one video have no duration, show notice later
      // Also assign fallback duration here
      anyVideoMissingDuration = true
      video.lengthSeconds = 0
    }
  })

  // Show notice if not already shown before returning playlist items
  if (anyVideoMissingDuration && !alreadyShownNotice) {
    showToast(t('User Playlists.SinglePlaylistView.Toast.This playlist has a video with a duration error'), 5000)
    alreadyShownNotice = true
  }

  return modifiedPlaylistItems
}

function getNextPage() {
  if (process.env.SUPPORTS_LOCAL_API && infoSource.value === 'local') {
    getNextPageLocal()
  } else if (infoSource.value === 'user') {
    // Stop users from spamming the load more button, by replacing it with a loading symbol until the newly added items are renderered
    isLoadingMore.value = true

    nextTick(() => {
      if (userPlaylistVisibleLimit.value + 100 < shownVideoCount.value) {
        userPlaylistVisibleLimit.value += 100
      } else {
        userPlaylistVisibleLimit.value = shownVideoCount.value
      }

      isLoadingMore.value = false
    })
  } else if (infoSource.value === 'invidious') {
    console.error('Playlist pagination is not currently supported when the Invidious backend is selected.')
  }
}

async function getNextPageLocal() {
  isLoadingMore.value = true

  const result = await getLocalPlaylistContinuation(continuationData.value)

  let shouldGetNextPage = false

  if (result) {
    const parsedVideos = result.items.map(parseLocalPlaylistVideo)
    playlistItems.value = playlistItems.value.concat(parsedVideos)

    if (result.has_continuation) {
      continuationData.value = result

      // To workaround the effect of useless continuation data
      // auto load next page again when no. of parsed items < page size
      shouldGetNextPage = parsedVideos.length < 100
    } else {
      continuationData.value = null
    }
  } else {
    continuationData.value = null
  }

  isLoadingMore.value = false

  if (shouldGetNextPage) {
    getNextPageLocal()
  }
}

const canMoveVideos = computed(() => {
  return !playlistInVideoSearchMode.value && isSortOrderCustom.value && noPlaylistItemsPendingDeletion.value
})

/**
 * @param {string} videoId
 * @param {string} playlistItemId
 */
function moveVideoUp(videoId, playlistItemId) {
  const playlistItems_ = playlistItems.value.slice()

  const index = playlistItems_.findIndex((video) => {
    return video.videoId === videoId && video.playlistItemId === playlistItemId
  })

  if (index === 0) {
    showToast(t('User Playlists.SinglePlaylistView.Toast["This video cannot be moved up."]'))
    return
  }

  [playlistItems_[index], playlistItems_[index - 1]] = [playlistItems_[index - 1], playlistItems_[index]]

  const playlist = {
    playlistName: playlistTitle.value,
    protected: selectedUserPlaylist.value.protected,
    description: playlistDescription.value,
    videos: deepCopy(playlistItems_),
    _id: playlistId.value
  }

  try {
    store.dispatch('updatePlaylist', playlist)
    playlistItems.value = playlistItems_
  } catch (e) {
    showToast(t('User Playlists.SinglePlaylistView.Toast["There was an issue with updating this playlist."]'))
    console.error(e)
  }
}

/**
 * @param {string} videoId
 * @param {string} playlistItemId
 */
function moveVideoDown(videoId, playlistItemId) {
  const playlistItems_ = playlistItems.value.slice()

  const index = playlistItems_.findIndex((video) => {
    return video.videoId === videoId && video.playlistItemId === playlistItemId
  })

  if (index + 1 >= playlistItems_.length) {
    showToast(t('User Playlists.SinglePlaylistView.Toast["This video cannot be moved down."]'))
    return
  }

  [playlistItems_[index], playlistItems_[index + 1]] = [playlistItems_[index + 1], playlistItems_[index]]

  const playlist = {
    playlistName: playlistTitle.value,
    protected: selectedUserPlaylist.value.protected,
    description: playlistDescription.value,
    videos: deepCopy(playlistItems_),
    _id: playlistId.value
  }

  try {
    store.dispatch('updatePlaylist', playlist)
    playlistItems.value = playlistItems_
  } catch (e) {
    showToast(t('User Playlists.SinglePlaylistView.Toast["There was an issue with updating this playlist."]'))
    console.error(e)
  }
}

/**
 * @param {string} videoId
 * @param {string} playlistItemId
 */
function removeVideoFromPlaylist(videoId, playlistItemId) {
  try {
    const foundVideo = playlistItems.value.some((video) => {
      return video.videoId === videoId && video.playlistItemId === playlistItemId
    })

    if (foundVideo) {
      toBeDeletedPlaylistItemIds.value.push(playlistItemId)

      // Only show toast when no existing toast shown
      if (undoToastAbortController == null) {
        undoToastAbortController = new AbortController()

        const timeoutMs = 5000
        const actualRemoveVideosTimeout = setTimeout(() => {
          removeToBeDeletedVideosSometimes()
        }, timeoutMs)

        showToast(
          t('User Playlists.SinglePlaylistView.Toast["Video has been removed. Click here to undo."]'),
          timeoutMs,
          () => {
            clearTimeout(actualRemoveVideosTimeout)
            toBeDeletedPlaylistItemIds.value = []
            undoToastAbortController = null
          },
          undoToastAbortController.signal,
        )
      }
    }
  } catch (e) {
    showToast(t('User Playlists.SinglePlaylistView.Toast.There was a problem with removing this video'))
    console.error(e)
  }
}

async function removeToBeDeletedVideosSometimes() {
  if (isLoading.value) { return }

  if (toBeDeletedPlaylistItemIds.value.length > 0) {
    await store.dispatch('removeVideos', {
      _id: playlistId.value,
      // Create a new non-reactive array to avoid Electron erroring about Proxy objects not being clonable
      playlistItemIds: [...toBeDeletedPlaylistItemIds.value],
    })

    toBeDeletedPlaylistItemIds.value = []
    undoToastAbortController?.abort()
    undoToastAbortController = null
  }
}

function updatePageTitle() {
  const playlistTitle_ = playlistTitle.value
  const channelName_ = channelName.value

  let titleText = ''

  if (playlistTitle_) {
    titleText = playlistTitle_
  }

  if (channelName_) {
    if (titleText.length > 0) {
      titleText += `| ${channelName_}`
    } else {
      titleText = channelName_
    }
  }

  store.commit('setAppTitle', `${titleText} - ${packageDetails.productName}`)
}

/**
 * @param {string} value
 */
function handleVideoSearchQueryChange(value) {
  videoSearchQuery.value = value

  saveStateInRouter(value)
}

/**
 * @param {string} query
 */
async function saveStateInRouter(query) {
  const routeQuery = {
    playlistType: route.query.playlistType,
  }

  if (query !== '') {
    routeQuery.searchQueryText = query
  }

  try {
    await router.replace({
      path: `/playlist/${playlistId.value}`,
      query: routeQuery,
    })
  } catch (failure) {
    if (isNavigationFailure(failure, NavigationFailureType.duplicated)) {
      return
    }

    throw failure
  }
}

if (isUserPlaylistRequested.value && searchQueryTextPresent.value) {
  handleVideoSearchQueryChange(searchQueryTextRequested.value)
}

function handleResize() {
  forceListView.value = window.innerWidth <= MOBILE_WIDTH_THRESHOLD || window.innerHeight <= PLAYLIST_HEIGHT_FORCE_LIST_THRESHOLD
}

onMounted(() => {
  getPlaylistInfoDebounce()
  handleResize()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})

onBeforeRouteLeave((to) => {
  if (!isLoading.value && to.path.startsWith('/watch') && to.query.playlistId === playlistId.value) {
    store.commit('setCachedPlaylist', {
      id: playlistId.value,
      title: playlistTitle.value,
      channelName: channelName.value,
      channelId: channelId.value,
      items: sortedPlaylistItems.value,
      continuationData: continuationData.value
        ? extractLocalCacheablePlaylistContinuation(continuationData.value)
        : null,
    })
  }

  removeToBeDeletedVideosSometimes()
})
</script>

<style scoped src="./Playlist.scss" lang="scss" />
