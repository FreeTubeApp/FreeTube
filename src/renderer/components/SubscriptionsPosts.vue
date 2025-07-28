<template>
  <SubscriptionsTabUi
    :is-loading="isLoading"
    :video-list="postList"
    :error-channels="errorChannels"
    :attempted-fetch="attemptedFetch"
    :is-community="true"
    :initial-data-limit="20"
    :last-refresh-timestamp="lastPostsRefreshTimestamp"
    :title="t('Global.Posts')"
    @refresh="loadPostsForSubscriptionsFromRemote"
  />
</template>

<script setup>
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { useI18n } from '../composables/use-i18n-polyfill'

import SubscriptionsTabUi from './SubscriptionsTabUi/SubscriptionsTabUi.vue'

import store from '../store/index'

import { copyToClipboard, getRelativeTimeFromDate, showToast } from '../helpers/utils'
import { getLocalChannelCommunity } from '../helpers/api/local'
import { invidiousGetCommunityPosts } from '../helpers/api/invidious'

const { t } = useI18n()

const isLoading = ref(true)
const postList = shallowRef([])
const errorChannels = ref([])
const attemptedFetch = ref(false)
/** @type {import('vue').Ref<number | null>} */
const lastRemoteRefreshSuccessTimestamp = ref(null)

let alreadyLoadedRemotely = false

/** @type {import('vue').ComputedRef<'local' | 'invidious'>} */
const backendPreference = computed(() => store.getters.getBackendPreference)

/** @type {import('vue').ComputedRef<'local' | 'invidious'>} */
const backendFallback = computed(() => store.getters.getBackendFallback)

/** @type {import('vue').ComputedRef<boolean>} */
const subscriptionCacheReady = computed(() => store.getters.getSubscriptionCacheReady)

/** @type {import('vue').ComputedRef<boolean>} */
const fetchSubscriptionsAutomatically = computed(() => store.getters.getFetchSubscriptionsAutomatically)

const activeSubscriptionList = computed(() => store.getters.getActiveProfile.subscriptions)

const cacheEntriesForAllActiveProfileChannels = computed(() => {
  const postsCache = store.getters.getPostsCache
  const entries = []

  activeSubscriptionList.value.forEach((channel) => {
    const cacheEntry = postsCache[channel.id]

    if (cacheEntry != null) {
      entries.push(cacheEntry)
    }
  })

  return entries
})

const postCacheForAllActiveProfileChannelsPresent = computed(() => {
  if (
    cacheEntriesForAllActiveProfileChannels.value.length === 0 ||
    cacheEntriesForAllActiveProfileChannels.value.length < activeSubscriptionList.value.length
  ) {
    return false
  }

  return cacheEntriesForAllActiveProfileChannels.value.every((cacheEntry) => {
    return cacheEntry.posts != null
  })
})

const lastPostsRefreshTimestamp = computed(() => {
  // Cache is not ready when data is just loaded from remote
  if (lastRemoteRefreshSuccessTimestamp.value) {
    return getRelativeTimeFromDate(lastRemoteRefreshSuccessTimestamp.value, true)
  }

  if (
    !postCacheForAllActiveProfileChannelsPresent.value ||
    cacheEntriesForAllActiveProfileChannels.value.length === 0
  ) {
    return ''
  }

  let minTimestamp = null
  cacheEntriesForAllActiveProfileChannels.value.forEach((cacheEntry) => {
    if (!minTimestamp || cacheEntry.timestamp.getTime() < minTimestamp.getTime()) {
      minTimestamp = cacheEntry.timestamp
    }
  })

  return getRelativeTimeFromDate(minTimestamp.getTime(), true)
})

watch(activeSubscriptionList, () => {
  lastRemoteRefreshSuccessTimestamp.value = null
  isLoading.value = true
  loadPostsFromCacheSometimes()
}, { deep: true })

if (!subscriptionCacheReady.value) {
  watch(subscriptionCacheReady, () => {
    if (!alreadyLoadedRemotely) {
      loadPostsFromCacheSometimes()
    }
  })
}

onMounted(() => {
  loadPostsFromRemoteFirstPerWindowSometimes()
})

function loadPostsFromRemoteFirstPerWindowSometimes() {
  if (
    !fetchSubscriptionsAutomatically.value ||
    // Only auto fetch once per window
    store.getters.getSubscriptionForPostsFirstAutoFetchRun
  ) {
    loadPostsFromCacheSometimes()
    return
  }

  alreadyLoadedRemotely = true
  loadPostsForSubscriptionsFromRemote()
  store.commit('setSubscriptionForPostsFirstAutoFetchRun')
}

function loadPostsFromCacheSometimes() {
  // Can only load reliably when cache ready
  if (!subscriptionCacheReady.value) { return }

  // This method is called on view visible
  if (postCacheForAllActiveProfileChannelsPresent.value) {
    loadPostsFromCacheForAllActiveProfileChannels()
    return
  }

  if (fetchSubscriptionsAutomatically.value) {
    // `isLoading.value = false` is called inside `loadPostsForSubscriptionsFromRemote` when needed
    loadPostsForSubscriptionsFromRemote()
    return
  }

  // Auto fetch disabled, not enough cache for profile = show nothing
  postList.value = []
  attemptedFetch.value = false
  isLoading.value = false
}

function loadPostsFromCacheForAllActiveProfileChannels() {
  const postList_ = cacheEntriesForAllActiveProfileChannels.value.flatMap((cacheEntry) => {
    return cacheEntry.posts
  })

  postList_.sort((a, b) => {
    return b.publishedTime - a.publishedTime
  })

  postList.value = postList_
  isLoading.value = false
}

async function loadPostsForSubscriptionsFromRemote() {
  if (activeSubscriptionList.value.length === 0) {
    isLoading.value = false
    postList.value = []
    return
  }

  const channelsToLoadFromRemote = activeSubscriptionList.value
  let channelCount = 0
  isLoading.value = true

  store.commit('setShowProgressBar', true)
  store.commit('setProgressBarPercentage', 0)
  attemptedFetch.value = true

  errorChannels.value = []
  const subscriptionUpdates = []

  const postListFromRemote = (await Promise.all(channelsToLoadFromRemote.map(async (channel) => {
    let posts = []
    if (!process.env.SUPPORTS_LOCAL_API || backendPreference.value === 'invidious') {
      posts = await getChannelPostsInvidious(channel)
    } else {
      posts = await getChannelPostsLocal(channel)
    }

    channelCount++
    const percentageComplete = (channelCount / channelsToLoadFromRemote.length) * 100
    store.commit('setProgressBarPercentage', percentageComplete)

    store.dispatch('updateSubscriptionPostsCacheByChannel', {
      channelId: channel.id,
      posts
    })

    if (posts.length > 0) {
      const post = posts.find(post => post.authorId === channel.id)

      if (post) {
        const name = post.author
        let thumbnailUrl = post.authorThumbnails?.[0]?.url

        if (name || thumbnailUrl) {
          if (thumbnailUrl?.startsWith('//')) {
            thumbnailUrl = 'https:' + thumbnailUrl
          }

          subscriptionUpdates.push({
            channelId: channel.id,
            channelName: name,
            channelThumbnailUrl: thumbnailUrl
          })
        }
      }
    }

    return posts
  }))).flat()

  postListFromRemote.sort((a, b) => {
    return b.publishedTime - a.publishedTime
  })

  postList.value = postListFromRemote
  isLoading.value = false
  store.commit('setShowProgressBar', false)
  lastRemoteRefreshSuccessTimestamp.value = Date.now()

  store.dispatch('batchUpdateSubscriptionDetails', subscriptionUpdates)
}

async function getChannelPostsLocal(channel) {
  try {
    const entries = await getLocalChannelCommunity(channel.id)

    if (entries === null) {
      errorChannels.value.push(channel)
      return []
    }

    return entries
  } catch (err) {
    console.error(err)
    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })

    if (backendPreference.value === 'local' && backendFallback.value) {
      showToast(t('Falling back to Invidious API'))
      return await getChannelPostsInvidious(channel)
    }

    return []
  }
}

async function getChannelPostsInvidious(channel) {
  try {
    const result = await invidiousGetCommunityPosts(channel.id)

    return result.posts
  } catch (err) {
    console.error(err)
    const errorMessage = t('Invidious API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })

    if (process.env.SUPPORTS_LOCAL_API && backendPreference.value === 'invidious' && backendFallback.value) {
      showToast(t('Falling back to Local API'))
      return await getChannelPostsLocal(channel)
    } else {
      return []
    }
  }
}
</script>
