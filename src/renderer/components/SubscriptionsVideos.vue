<template>
  <SubscriptionsTabUi
    :is-loading="isLoading"
    :video-list="videoList"
    :error-channels="errorChannels"
    :last-refresh-timestamp="lastVideoRefreshTimestamp"
    :attempted-fetch="attemptedFetch"
    :title="t('Global.Videos')"
    @refresh="loadVideosForSubscriptionsFromRemote"
  />
</template>

<script setup>
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { useI18n } from '../composables/use-i18n-polyfill'

import SubscriptionsTabUi from './SubscriptionsTabUi/SubscriptionsTabUi.vue'

import store from '../store/index'

import {
  copyToClipboard,
  getRelativeTimeFromDate,
  showToast,
  getChannelPlaylistId
} from '../helpers/utils'
import { getInvidiousChannelVideos, invidiousFetch } from '../helpers/api/invidious'
import { getLocalChannelVideos, getLocalPlaylist } from '../helpers/api/local'
import { parseYouTubeChannelRSSFeed, parseYouTubePlaylistRSSFeed, updateVideoListAfterProcessing } from '../helpers/subscriptions'

const { t } = useI18n()

const isLoading = ref(true)
const videoList = shallowRef([])
const errorChannels = ref([])
const attemptedFetch = ref(false)
/** @type {import('vue').Ref<number | null>} */
const lastRemoteRefreshSuccessTimestamp = ref(null)

let alreadyLoadedRemotely = false

/** @type {import('vue').ComputedRef<'local' | 'invidious'>} */
const backendPreference = computed(() => store.getters.getBackendPreference)

/** @type {import('vue').ComputedRef<'local' | 'invidious'>} */
const backendFallback = computed(() => store.getters.getBackendFallback)

/** @type {import('vue').ComputedRef<string>} */
const currentInvidiousInstanceUrl = computed(() => store.getters.getCurrentInvidiousInstanceUrl)

/** @type {import('vue').ComputedRef<boolean>} */
const subscriptionCacheReady = computed(() => store.getters.getSubscriptionCacheReady)

/** @type {import('vue').ComputedRef<boolean>} */
const useRssFeeds = computed(() => store.getters.getUseRssFeeds)

/** @type {import('vue').ComputedRef<boolean>} */
const fetchSubscriptionsAutomatically = computed(() => store.getters.getFetchSubscriptionsAutomatically)

const activeSubscriptionList = computed(() => store.getters.getActiveProfile.subscriptions)
const activePlaylistSubscriptionList = computed(() => store.getters.getActiveProfile.listSubscriptions || [])

const cacheEntriesForAllActiveProfileChannels = computed(() => {
  const videoCache = store.getters.getVideoCache
  const entries = []

  activeSubscriptionList.value.forEach((channel) => {
    const cacheEntry = videoCache[channel.id]

    if (cacheEntry != null) {
      entries.push(cacheEntry)
    }
  })

  return entries
})

const cacheEntriesForAllActiveProfilePlaylists = computed(() => {
  const playlistCache = store.getters.getPlaylistCache
  const entries = []

  activePlaylistSubscriptionList.value.forEach((playlist) => {
    const cacheEntry = playlistCache[playlist.id]

    if (cacheEntry != null) {
      entries.push(cacheEntry)
    }
  })

  return entries
})

const videoCacheForAllActiveProfileChannelsPresent = computed(() => {
  if (
    cacheEntriesForAllActiveProfileChannels.value.length === 0 ||
    cacheEntriesForAllActiveProfileChannels.value.length < activeSubscriptionList.value.length
  ) {
    return false
  }

  return cacheEntriesForAllActiveProfileChannels.value.every((cacheEntry) => {
    return cacheEntry.videos != null
  })
})

const videoCacheForAllActiveProfilePlaylistsPresent = computed(() => {
  if (activePlaylistSubscriptionList.value.length === 0) {
    return true // No playlists to check
  }

  if (cacheEntriesForAllActiveProfilePlaylists.value.length < activePlaylistSubscriptionList.value.length) {
    return false
  }

  return cacheEntriesForAllActiveProfilePlaylists.value.every((cacheEntry) => {
    return cacheEntry.videos != null
  })
})

const lastVideoRefreshTimestamp = computed(() => {
  // Cache is not ready when data is just loaded from remote
  if (lastRemoteRefreshSuccessTimestamp.value) {
    return getRelativeTimeFromDate(lastRemoteRefreshSuccessTimestamp.value, true)
  }

  if (
    !videoCacheForAllActiveProfileChannelsPresent.value ||
    !videoCacheForAllActiveProfilePlaylistsPresent.value ||
     (cacheEntriesForAllActiveProfileChannels.value.length === 0 &&
      cacheEntriesForAllActiveProfilePlaylists.value.length === 0)
  ) {
    return ''
  }

  let minTimestamp = null

  // Check channel cache timestamps
  cacheEntriesForAllActiveProfileChannels.value.forEach((cacheEntry) => {
    if (!minTimestamp || cacheEntry.timestamp.getTime() < minTimestamp.getTime()) {
      minTimestamp = cacheEntry.timestamp
    }
  })

  // Check playlist cache timestamps
  cacheEntriesForAllActiveProfilePlaylists.value.forEach((cacheEntry) => {
    if (!minTimestamp || cacheEntry.timestamp.getTime() < minTimestamp.getTime()) {
      minTimestamp = cacheEntry.timestamp
    }
  })

  return getRelativeTimeFromDate(minTimestamp.getTime(), true)
})

watch([activeSubscriptionList, activePlaylistSubscriptionList], () => {
  lastRemoteRefreshSuccessTimestamp.value = null
  isLoading.value = true
  loadVideosFromCacheSometimes()
}, { deep: true })

if (!subscriptionCacheReady.value) {
  watch(subscriptionCacheReady, () => {
    if (!alreadyLoadedRemotely) {
      loadVideosFromCacheSometimes()
    }
  })
}

onMounted(() => {
  loadVideosFromRemoteFirstPerWindowSometimes()
})

function loadVideosFromRemoteFirstPerWindowSometimes() {
  if (
    !fetchSubscriptionsAutomatically.value ||
    // Only auto fetch once per window
    store.getters.getSubscriptionForVideosFirstAutoFetchRun
  ) {
    loadVideosFromCacheSometimes()
    return
  }

  alreadyLoadedRemotely = true
  loadVideosForSubscriptionsFromRemote()
  store.commit('setSubscriptionForVideosFirstAutoFetchRun')
}

function loadVideosFromCacheSometimes() {
  // Can only load reliably when cache ready
  if (!subscriptionCacheReady.value) { return }

  // This method is called on view visible
  if (videoCacheForAllActiveProfileChannelsPresent.value &&
      videoCacheForAllActiveProfilePlaylistsPresent.value) {
    loadVideosFromCacheForAllActiveProfileChannelsAndPlaylists()
    return
  }

  if (fetchSubscriptionsAutomatically.value) {
    // `isLoading.value = false` is called inside `loadVideosForSubscriptionsFromRemote` when needed
    loadVideosForSubscriptionsFromRemote()
    return
  }

  // Auto fetch disabled, not enough cache for profile = show nothing
  videoList.value = []
  attemptedFetch.value = false
  isLoading.value = false
}

function loadVideosFromCacheForAllActiveProfileChannelsAndPlaylists() {
  const channelVideos = cacheEntriesForAllActiveProfileChannels.value.flatMap((cacheEntry) => {
    return cacheEntry.videos
  })

  const playlistVideos = cacheEntriesForAllActiveProfilePlaylists.value.flatMap((cacheEntry) => {
    return cacheEntry.videos
  })

  const videoList_ = [...channelVideos, ...playlistVideos]
  videoList.value = updateVideoListAfterProcessing(videoList_)
  isLoading.value = false
}

async function loadVideosForSubscriptionsFromRemote() {
  if (activeSubscriptionList.value.length === 0 && activePlaylistSubscriptionList.value.length === 0) {
    isLoading.value = false
    videoList.value = []
    return
  }

  const totalItems =
    activeSubscriptionList.value.length + activePlaylistSubscriptionList.value.length
  let itemCount = 0

  let useRss = useRssFeeds.value
  if (totalItems >= 125 && !useRss) {
    showToast(
      t('Subscriptions["This profile has a large number of subscriptions. Forcing RSS to avoid rate limiting"]'),
      10000
    )
    useRss = true
  }

  isLoading.value = true
  attemptedFetch.value = true
  store.commit('setShowProgressBar', true)
  store.commit('setProgressBarPercentage', 0)
  errorChannels.value = []

  const subscriptionUpdates = []

  // Unified fetch helper
  const fetchItem = async (item, type) => {
    try {
      let result = { videos: [], name: '', thumbnailUrl: '' }

      if (type === 'channel') {
        if (!process.env.SUPPORTS_LOCAL_API || backendPreference.value === 'invidious') {
          if (useRss) {
            result = await getChannelVideosInvidiousRSS(item)
          } else {
            result = await getChannelVideosInvidiousScraper(item)
          }
        } else {
          if (useRss) {
            result = await getChannelVideosLocalRSS(item)
          } else {
            result = await getChannelVideosLocalScraper(item)
          }
        }
      } else if (type === 'playlist') {
        if (!process.env.SUPPORTS_LOCAL_API || backendPreference.value === 'invidious') {
          result = await getPlaylistVideosInvidiousScraper(item)
        } else {
          result = await getPlaylistVideosLocalRSS(item)
        }
      }

      // Update caches
      if (type === 'channel' && result.videos) {
        store.dispatch('updateSubscriptionVideosCacheByChannel', {
          channelId: item.id,
          videos: result.videos
        })
      } else if (type === 'playlist' && result.videos) {
        store.dispatch('updateSubscriptionPlaylistCacheByPlaylist', {
          playlistId: item.id,
          videos: result.videos
        })
      }

      // Update subscription details (channel name + thumbnail)
      if (result.name || result.thumbnailUrl) {
        subscriptionUpdates.push({
          channelId: type === 'channel' ? item.id : undefined,
          playlistId: type === 'playlist' ? item.id : undefined,
          channelName: result.name,
          channelThumbnailUrl: result.thumbnailUrl
        })
      }
      return result.videos ?? []
    } catch (err) {
      console.error(`Failed fetching ${type} ${item.id}:`, err)
      errorChannels.value.push(item)
      return []
    } finally {
      itemCount++
      store.commit('setProgressBarPercentage', (itemCount / totalItems) * 100)
    }
  }

  // Fetch channels
  const channelPromises = activeSubscriptionList.value.map(channel => fetchItem(channel, 'channel'))

  // Fetch playlists
  const playlistPromises = activePlaylistSubscriptionList.value.map(playlist => fetchItem(playlist, 'playlist'))

  const [channelVideos, playlistVideos] = await Promise.all([
    Promise.all(channelPromises),
    Promise.all(playlistPromises)
  ])

  // Merge and process all videos
  videoList.value = updateVideoListAfterProcessing([
    ...channelVideos.flat(),
    ...playlistVideos.flat()
  ])

  store.commit('setShowProgressBar', false)
  isLoading.value = false
  lastRemoteRefreshSuccessTimestamp.value = Date.now()

  // Batch update subscription metadata
  store.dispatch('batchUpdateSubscriptionDetails', subscriptionUpdates)
}

async function getPlaylistVideosLocalScraper(playlist, failedAttempts = 0) {
  try {
    const result = await getLocalPlaylist(playlist.id)
    if (!result || !result.items) throw new Error('No items from local API')
    return {
      name: result.title || '',
      videos: result.items
        .filter(v => v.type === 'video')
        .map(video => ({
          videoId: video.videoId,
          title: video.title,
          author: video.author,
          authorId: video.authorId,
          published: video.published || Date.now(),
          publishedText: video.publishedText || '',
          viewCount: video.viewCount || 0,
          lengthSeconds: video.lengthSeconds || 0,
          type: 'video'
        }))
    }
  } catch (err) {
    console.error(`Local scraper failed for playlist ${playlist.id}:`, err)
    return await getPlaylistVideosLocalRSS(playlist, failedAttempts + 1)
  }
}

async function getPlaylistVideosLocalRSS(playlist, failedAttempts = 0) {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlist.id}`
  try {
    const response = await fetch(feedUrl)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    return await parseYouTubePlaylistRSSFeed(await response.text(), playlist.id)
  } catch (err) {
    console.error(`Local RSS failed for playlist ${playlist.id}:`, err)

    try {
      return await getPlaylistVideosLocalScraper(playlist, failedAttempts + 1)
    } catch (err) {
      console.error(`Local Scrapper failed for playlist ${playlist.id}:`, err)
      try {
        showToast(t('Falling back to Invidious API'))
        return await getPlaylistVideosInvidiousScraper(playlist, failedAttempts + 1)
      } catch (err) {
        console.error(`All fallbacks failed for playlist ${playlist.id}:`, err)
        return { videos: [] }
      }
    }
  }
}

async function getPlaylistVideosInvidiousScraper(playlist, failedAttempts = 0) {
  try {
    const url = `${currentInvidiousInstanceUrl.value}/api/v1/playlists/${playlist.id}`
    const response = await invidiousFetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const json = await response.json()
    return {
      name: json.title || '',
      videos: json.videos.map(video => ({
        videoId: video.videoId,
        title: video.title,
        author: video.author,
        authorId: video.authorId,
        published: video.published || Date.now(),
        publishedText: video.publishedText || '',
        viewCount: video.viewCount || 0,
        lengthSeconds: video.lengthSeconds || 0,
        type: 'video'
      }))
    }
  } catch (err) {
    console.error(`Invidious scraper failed for playlist ${playlist.id}:`, err)
    return await getPlaylistVideosInvidiousRSS(playlist, failedAttempts + 1)
  }
}

async function getPlaylistVideosInvidiousRSS(playlist, failedAttempts = 0) {
  const feedUrl = `${currentInvidiousInstanceUrl.value}/feed/playlist/${playlist.id}`
  try {
    const response = await invidiousFetch(feedUrl)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    return await parseYouTubePlaylistRSSFeed(await response.text(), playlist.id)
  } catch (err) {
    console.error(`Invidious RSS failed for playlist ${playlist.id}:`, err)
    return { videos: [] }
  }
}

async function getChannelVideosLocalScraper(channel, failedAttempts = 0) {
  try {
    const result = await getLocalChannelVideos(channel.id)

    if (result === null) {
      errorChannels.value.push(channel)
      return {
        videos: []
      }
    }

    return result
  } catch (err) {
    console.error(err)
    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })

    switch (failedAttempts) {
      case 0:
        return await getChannelVideosLocalRSS(channel, failedAttempts + 1)
      case 1:
        if (backendFallback.value) {
          showToast(t('Falling back to Invidious API'))
          return await getChannelVideosInvidiousScraper(channel, failedAttempts + 1)
        } else {
          return {
            videos: []
          }
        }
      case 2:
        return await getChannelVideosLocalRSS(channel, failedAttempts + 1)
      default:
        return {
          videos: []
        }
    }
  }
}

async function getChannelVideosLocalRSS(channel, failedAttempts = 0) {
  const playlistId = getChannelPlaylistId(channel.id, 'videos', 'newest')
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`

  try {
    const response = await fetch(feedUrl)

    if (response.status === 403) {
      return {
        videos: null
      }
    }

    if (response.status === 404) {
      const response2 = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`, {
        method: 'HEAD'
      })

      if (response2.status === 404) {
        errorChannels.value.push(channel)
      }

      return {
        videos: []
      }
    }

    return await parseYouTubeChannelRSSFeed(await response.text(), channel.id)
  } catch (error) {
    console.error(error)
    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${error}`, 10000, () => {
      copyToClipboard(error)
    })

    switch (failedAttempts) {
      case 0:
        return await getChannelVideosLocalScraper(channel, failedAttempts + 1)
      case 1:
        if (backendFallback.value) {
          showToast(t('Falling back to Invidious API'))
          return await getChannelVideosInvidiousRSS(channel, failedAttempts + 1)
        } else {
          return {
            videos: []
          }
        }
      case 2:
        return await getChannelVideosLocalScraper(channel, failedAttempts + 1)
      default:
        return {
          videos: []
        }
    }
  }
}

async function getChannelVideosInvidiousScraper(channel, failedAttempts = 0) {
  try {
    const result = await getInvidiousChannelVideos(channel.id)

    let name

    if (result.videos.length > 0) {
      name = result.videos.find(video => video.type === 'video' && video.author).author
    }

    return {
      name,
      videos: result.videos
    }
  } catch (err) {
    console.error(err)
    const errorMessage = t('Invidious API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })

    switch (failedAttempts) {
      case 0:
        return await getChannelVideosInvidiousRSS(channel, failedAttempts + 1)
      case 1:
        if (process.env.SUPPORTS_LOCAL_API && backendFallback.value) {
          showToast(t('Falling back to Local API'))
          return await getChannelVideosLocalScraper(channel, failedAttempts + 1)
        } else {
          return {
            videos: []
          }
        }
      case 2:
        return await getChannelVideosInvidiousRSS(channel, failedAttempts + 1)
      default:
        return {
          videos: []
        }
    }
  }
}

async function getChannelVideosInvidiousRSS(channel, failedAttempts = 0) {
  const playlistId = getChannelPlaylistId(channel.id, 'videos', 'newest')
  const feedUrl = `${currentInvidiousInstanceUrl.value}/feed/playlist/${playlistId}`

  try {
    const response = await invidiousFetch(feedUrl)

    if (response.status === 404) {
      const response2 = await fetch(`${currentInvidiousInstanceUrl.value}/feed/channel/${channel.id}`, {
        method: 'GET'
      })

      if (response2.status === 404) {
        errorChannels.value.push(channel)
      }

      return {
        videos: []
      }
    }

    return await parseYouTubeChannelRSSFeed(await response.text(), channel.id)
  } catch (error) {
    console.error(error)
    const errorMessage = t('Invidious API Error (Click to copy)')
    showToast(`${errorMessage}: ${error}`, 10000, () => {
      copyToClipboard(error)
    })

    switch (failedAttempts) {
      case 0:
        return await getChannelVideosInvidiousScraper(channel, failedAttempts + 1)
      case 1:
        if (process.env.SUPPORTS_LOCAL_API && backendFallback.value) {
          showToast(t('Falling back to Local API'))
          return await getChannelVideosLocalRSS(channel, failedAttempts + 1)
        } else {
          return {
            videos: []
          }
        }
      case 2:
        return await getChannelVideosInvidiousScraper(channel, failedAttempts + 1)
      default:
        return {
          videos: []
        }
    }
  }
}
</script>
