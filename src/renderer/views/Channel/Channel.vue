<template>
  <div>
    <FtLoader
      v-if="isLoading && !errorMessage"
      :fullscreen="true"
    />
    <ChannelDetails
      v-else-if="(isFamilyFriendly || !showFamilyFriendlyOnly)"
      :id="id"
      :name="channelName"
      :banner-url="bannerUrl"
      :has-error-message="!!errorMessage"
      :thumbnail-url="thumbnailUrl"
      :sub-count="subCount"
      :show-share-menu="showShareMenu"
      :show-search-bar="showSearchBar"
      :is-subscribed="isSubscribed"
      :visible-tabs="tabInfoValues"
      :current-tab="currentTab"
      :query="lastSearchQuery"
      class="card channelDetails"
      @change-tab="changeTab"
      @search="newSearchWithStatePersist"
      @subscribed="handleSubscription"
    />
    <FtCard
      v-if="!isLoading && !errorMessage && (isFamilyFriendly || !showFamilyFriendlyOnly)"
      class="card"
    >
      <ChannelAbout
        v-if="currentTab === 'about'"
        id="aboutPanel"
        :description="description"
        :joined="joined"
        :views="viewCount"
        :videos="videoCount"
        :location="location"
        :tags="tags"
        :related-channels="relatedChannels"
      />
      <div class="select-container">
        <FtSelect
          v-if="showVideoSortBy"
          v-show="currentTab === 'videos' && (showFetchMoreButton || filteredVideos.length > 1)"
          :value="videoSortBy"
          :select-names="videoLiveShortSelectNames"
          :select-values="videoLiveShortSelectValues"
          :placeholder="$t('Global.Sort By')"
          :icon="getIconForSortPreference(videoSortBy)"
          @change="videoSortBy = $event"
        />
        <FtSelect
          v-if="!hideChannelShorts && showShortSortBy"
          v-show="currentTab === 'shorts' && (showFetchMoreButton || filteredShorts.length > 1)"
          :value="shortSortBy"
          :select-names="videoLiveShortSelectNames"
          :select-values="videoLiveShortSelectValues"
          :placeholder="$t('Global.Sort By')"
          :icon="getIconForSortPreference(shortSortBy)"
          @change="shortSortBy = $event"
        />
        <FtSelect
          v-if="!hideLiveStreams && showLiveSortBy"
          v-show="currentTab === 'live' && (showFetchMoreButton || filteredLive.length > 1)"
          :value="liveSortBy"
          :select-names="videoLiveShortSelectNames"
          :select-values="videoLiveShortSelectValues"
          :placeholder="$t('Global.Sort By')"
          :icon="getIconForSortPreference(liveSortBy)"
          @change="liveSortBy = $event"
        />
        <FtSelect
          v-if="!hideChannelPlaylists && showPlaylistSortBy"
          v-show="currentTab === 'playlists' && latestPlaylists.length > 0"
          :value="playlistSortBy"
          :select-names="playlistSelectNames"
          :select-values="PLAYLIST_SELECT_VALUES"
          :placeholder="$t('Global.Sort By')"
          :icon="getIconForSortPreference(playlistSortBy)"
          @change="playlistSortBy = $event"
        />
      </div>
      <FtLoader
        v-if="isCurrentTabLoading"
      />
      <div
        v-if="currentTab !== 'about' && !isElementListLoading"
        class="elementList"
      >
        <ChannelHome
          v-show="currentTab === 'home'"
          id="homePanel"
          :shelves="homeData"
          role="tabpanel"
          aria-labelledby="homeTab"
        />
        <FtElementList
          v-show="currentTab === 'videos'"
          id="videoPanel"
          :data="filteredVideos"
          :use-channels-hidden-preference="false"
          role="tabpanel"
          aria-labelledby="videosTab"
        />
        <FtFlexBox
          v-if="currentTab === 'videos' && latestVideos.length === 0"
        >
          <p class="message">
            {{ $t("Channel.Videos.This channel does not currently have any videos") }}
          </p>
        </FtFlexBox>
        <FtElementList
          v-if="!hideChannelShorts && currentTab === 'shorts'"
          id="shortPanel"
          :data="filteredShorts"
          :use-channels-hidden-preference="false"
          role="tabpanel"
          aria-labelledby="shortsTab"
        />
        <FtFlexBox
          v-if="!hideChannelShorts && currentTab === 'shorts' && latestShorts.length === 0"
        >
          <p class="message">
            {{ $t("Channel.Shorts.This channel does not currently have any shorts") }}
          </p>
        </FtFlexBox>
        <FtElementList
          v-if="!hideLiveStreams"
          v-show="currentTab === 'live'"
          id="livePanel"
          :data="filteredLive"
          :use-channels-hidden-preference="false"
          role="tabpanel"
          aria-labelledby="liveTab"
        />
        <FtFlexBox
          v-if="!hideLiveStreams && currentTab === 'live' && latestLive.length === 0"
        >
          <p class="message">
            {{ $t("Channel.Live.This channel does not currently have any live streams") }}
          </p>
        </FtFlexBox>
        <FtElementList
          v-if="!hideChannelPodcasts && currentTab === 'podcasts'"
          id="podcastPanel"
          :data="latestPodcasts"
          :use-channels-hidden-preference="false"
          role="tabpanel"
          aria-labelledby="podcastsTab"
        />
        <FtFlexBox
          v-if="!hideChannelPodcasts && currentTab === 'podcasts' && latestPodcasts.length === 0"
        >
          <p class="message">
            {{ $t("Channel.Podcasts.This channel does not currently have any podcasts") }}
          </p>
        </FtFlexBox>
        <FtElementList
          v-if="!hideChannelReleases && currentTab === 'releases'"
          id="releasePanel"
          :data="latestReleases"
          :use-channels-hidden-preference="false"
          role="tabpanel"
          aria-labelledby="releasesTab"
        />
        <FtFlexBox
          v-if="!hideChannelReleases && currentTab === 'releases' && latestReleases.length === 0"
        >
          <p class="message">
            {{ $t("Channel.Releases.This channel does not currently have any releases") }}
          </p>
        </FtFlexBox>
        <FtElementList
          v-if="!hideChannelCourses && currentTab === 'courses'"
          id="coursesPanel"
          :data="latestCourses"
          :use-channels-hidden-preference="false"
          role="tabpanel"
          aria-labelledby="coursesTab"
        />
        <FtFlexBox
          v-if="!hideChannelCourses && currentTab === 'courses' && latestCourses.length === 0"
        >
          <p class="message">
            {{ $t("Channel.Courses.This channel does not currently have any courses") }}
          </p>
        </FtFlexBox>
        <FtElementList
          v-if="!hideChannelPlaylists && currentTab === 'playlists'"
          id="playlistPanel"
          :data="latestPlaylists"
          :use-channels-hidden-preference="false"
          role="tabpanel"
          aria-labelledby="playlistsTab"
        />
        <FtFlexBox
          v-if="!hideChannelPlaylists && currentTab === 'playlists' && latestPlaylists.length === 0"
        >
          <p class="message">
            {{ $t("Channel.Playlists.This channel does not currently have any playlists") }}
          </p>
        </FtFlexBox>
        <FtElementList
          v-if="!hideChannelCommunity && currentTab === 'community'"
          id="communityPanel"
          class="communityPanel"
          :data="latestCommunityPosts"
          :use-channels-hidden-preference="false"
          role="tabpanel"
          aria-labelledby="communityTab"
          display="list"
        />
        <FtFlexBox
          v-if="!hideChannelCommunity && currentTab === 'community' && latestCommunityPosts.length === 0"
        >
          <p class="message">
            {{ $t("Channel.Posts.This channel currently does not have any posts") }}
          </p>
        </FtFlexBox>
        <FtElementList
          v-show="currentTab === 'search'"
          :data="searchResults"
          :use-channels-hidden-preference="false"
        />
        <FtFlexBox
          v-if="currentTab === 'search' && !isSearchTabLoading && searchResults.length === 0"
        >
          <p class="message">
            {{ $t("Channel.Your search results have returned 0 results") }}
          </p>
        </FtFlexBox>
        <FtAutoLoadNextPageWrapper
          v-if="showFetchMoreButton"
          @load-next-page="handleFetchMore"
        >
          <div
            class="getNextPage"
            role="button"
            tabindex="0"
            @click="handleFetchMore"
            @keydown.space.prevent="handleFetchMore"
            @keydown.enter.prevent="handleFetchMore"
          >
            <FontAwesomeIcon :icon="['fas', 'search']" /> {{ $t("Search Filters.Fetch more results") }}
          </div>
        </FtAutoLoadNextPageWrapper>
      </div>
    </FtCard>
    <FtCard
      v-if="errorMessage"
      class="card"
    >
      <p>
        {{ errorMessage }}
      </p>
    </FtCard>
    <FtAgeRestricted
      v-else-if="!isLoading && (!isFamilyFriendly && showFamilyFriendlyOnly)"
      class="ageRestricted"
      :is-channel="true"
    />
  </div>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import autolinker from 'autolinker'
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'
import { isNavigationFailure, NavigationFailureType, useRoute, useRouter } from 'vue-router'
import { YTNodes } from 'youtubei.js'

import ChannelAbout from '../../components/ChannelAbout/ChannelAbout.vue'
import ChannelDetails from '../../components/ChannelDetails/ChannelDetails.vue'
import ChannelHome from '../../components/ChannelHome/ChannelHome.vue'
import FtAgeRestricted from '../../components/FtAgeRestricted/FtAgeRestricted.vue'
import FtAutoLoadNextPageWrapper from '../../components/FtAutoLoadNextPageWrapper.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtElementList from '../../components/FtElementList/FtElementList.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtLoader from '../../components/FtLoader/FtLoader.vue'
import FtSelect from '../../components/FtSelect/FtSelect.vue'

import store from '../../store/index'

import packageDetails from '../../../../package.json'
import {
  copyToClipboard,
  extractNumberFromString,
  showToast,
  getChannelPlaylistId,
  getIconForSortPreference,
  removeFromArrayIfExists
} from '../../helpers/utils'
import { isNullOrEmpty } from '../../helpers/strings'
import {
  getInvidiousChannelLive,
  getInvidiousChannelPlaylists,
  getInvidiousChannelPodcasts,
  getInvidiousChannelReleases,
  getInvidiousChannelCourses,
  getInvidiousChannelShorts,
  getInvidiousChannelVideos,
  invidiousGetChannelId,
  invidiousGetChannelInfo,
  invidiousGetCommunityPosts,
  searchInvidiousChannel,
  youtubeImageUrlToInvidious
} from '../../helpers/api/invidious'
import {
  getLocalChannel,
  getLocalChannelId,
  getLocalArtistTopicChannelReleases,
  parseLocalChannelHeader,
  parseLocalChannelShorts,
  parseLocalChannelVideos,
  parseLocalCommunityPosts,
  parseLocalListPlaylist,
  parseLocalListVideo,
  parseLocalSubscriberCount,
  getLocalArtistTopicChannelReleasesContinuation,
  getLocalPlaylist,
  parseLocalPlaylistVideo,
  parseChannelHomeTab
} from '../../helpers/api/local'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

let skipRouteChangeWatcherOnce = false
let autoRefreshOnSortByChangeEnabled = false
/** @type {import('youtubei.js').YT.Channel|null} */
let channelInstance = null
/** @type {'local' | 'invidious' | ''} */
let apiUsed = ''
let mayContainContentFromOtherChannels = false

const isLoading = ref(true)
const isElementListLoading = ref(false)
const isSearchTabLoading = ref(false)
const currentTab = ref('videos')

const isCurrentTabLoading = computed(() => {
  return currentTab.value === 'search' ? isSearchTabLoading.value : isElementListLoading.value
})

const id = ref('')
const channelName = ref('')
const bannerUrl = ref('')
const thumbnailUrl = ref('')
const subCount = ref(0)
const description = ref('')
const tags = shallowRef([])
const viewCount = ref(0)
const videoCount = ref(0)
const joined = ref(0)
const location = ref(null)
const relatedChannels = shallowRef([])
const isArtistTopicChannel = ref(false)
const isFamilyFriendly = ref(false)

const errorMessage = ref('')
const showSearchBar = ref(true)
const showShareMenu = ref(true)

const PLAYLIST_SELECT_VALUES = ['newest', 'last']
const playlistSelectNames = computed(() => [
  t('Channel.Playlists.Sort Types.Newest'),
  t('Channel.Playlists.Sort Types.Last Video Added')
])

const videoLiveShortSelectValues = computed(() => {
  return isArtistTopicChannel.value
    ? ['newest', 'popular']
    : ['newest', 'popular', 'oldest']
})

const videoLiveShortSelectNames = computed(() => {
  if (isArtistTopicChannel.value) {
    return [
      t('Channel.Videos.Sort Types.Newest'),
      t('Channel.Videos.Sort Types.Most Popular'),
    ]
  }

  return [
    t('Channel.Videos.Sort Types.Newest'),
    t('Channel.Videos.Sort Types.Most Popular'),
    t('Channel.Videos.Sort Types.Oldest')
  ]
})

const SUPPORTED_CHANNEL_TABS = [
  'home',
  'videos',
  'shorts',
  'live',
  'releases',
  'podcasts',
  'courses',
  'playlists',
  'community',
  'about'
]

const channelTabs = shallowRef([
  'videos',
  'shorts',
  'live',
  'releases',
  'podcasts',
  'courses',
  'playlists',
  'community',
  'about'
])

/** @type {import('vue').ComputedRef<'local' | 'invidious'>} */
const backendPreference = computed(() => store.getters.getBackendPreference)

/** @type {import('vue').ComputedRef<boolean>} */
const backendFallback = computed(() => store.getters.getBackendFallback)

/** @type {import('vue').ComputedRef<boolean>} */
const showFamilyFriendlyOnly = computed(() => store.getters.getShowFamilyFriendlyOnly)

/** @type {import('vue').ComputedRef<string>} */
const currentInvidiousInstanceUrl = computed(() => {
  return store.getters.getCurrentInvidiousInstanceUrl
})

const activeProfile = computed(() => store.getters.getActiveProfile)

const subscriptionInfo = computed(() => {
  return activeProfile.value.subscriptions.find((channel) => {
    return channel.id === id.value
  }) ?? null
})

const isSubscribed = computed(() => subscriptionInfo.value !== null)

/** @type {import('vue').ComputedRef<boolean>} */
const isSubscribedInAnyProfile = computed(() => {
  return store.getters.getSubscribedChannelIdSet.has(id.value)
})

/** @type {import('vue').ComputedRef<boolean>} */
const hideChannelHome = computed(() => store.getters.getHideChannelHome)

/** @type {import('vue').ComputedRef<boolean>} */
const hideChannelShorts = computed(() => store.getters.getHideChannelShorts)

/** @type {import('vue').ComputedRef<boolean>} */
const hideLiveStreams = computed(() => store.getters.getHideLiveStreams)

/** @type {import('vue').ComputedRef<boolean>} */
const hideChannelPodcasts = computed(() => store.getters.getHideChannelPodcasts)

/** @type {import('vue').ComputedRef<boolean>} */
const hideChannelReleases = computed(() => store.getters.getHideChannelReleases)

/** @type {import('vue').ComputedRef<boolean>} */
const hideChannelCourses = computed(() => store.getters.getHideChannelCourses)

/** @type {import('vue').ComputedRef<boolean>} */
const hideChannelPlaylists = computed(() => store.getters.getHideChannelPlaylists)

/** @type {import('vue').ComputedRef<boolean>} */
const hideChannelCommunity = computed(() => store.getters.getHideChannelCommunity)

/** @type {import('vue').ComputedRef<boolean>} */
const hideWatchedSubs = computed(() => store.getters.getHideWatchedSubs)

const tabInfoValues = computed(() => {
  const values = [...channelTabs.value]

  // remove tabs from the array based on user settings
  if (hideChannelHome.value || !homeData.value || homeData.value.length === 0) {
    removeFromArrayIfExists(values, 'home')
  }

  if (hideChannelShorts.value) {
    removeFromArrayIfExists(values, 'shorts')
  }

  if (hideLiveStreams.value) {
    removeFromArrayIfExists(values, 'live')
  }

  if (hideChannelPlaylists.value) {
    removeFromArrayIfExists(values, 'playlists')
  }

  if (hideChannelCommunity.value) {
    removeFromArrayIfExists(values, 'community')
  }

  if (hideChannelPodcasts.value) {
    removeFromArrayIfExists(values, 'podcasts')
  }

  if (hideChannelReleases.value) {
    removeFromArrayIfExists(values, 'releases')
  }

  if (hideChannelCourses.value) {
    removeFromArrayIfExists(values, 'courses')
  }

  return values
})

watch(route, () => {
  if (skipRouteChangeWatcherOnce) {
    skipRouteChangeWatcherOnce = false
    return
  }
  isLoading.value = true

  if (route.query.url) {
    resolveChannelUrl(route.query.url, route.params.currentTab)
    return
  }

  // Disable auto refresh on sort value change during state reset
  autoRefreshOnSortByChangeEnabled = false

  id.value = route.params.id
  searchPage = 1
  relatedChannels.value = []
  latestVideos.value = []
  latestShorts.value = []
  latestLive.value = []
  videoSortBy.value = 'newest'
  shortSortBy.value = 'newest'
  liveSortBy.value = 'newest'
  playlistSortBy.value = 'newest'
  latestPlaylists.value = []
  latestPodcasts.value = []
  latestReleases.value = []
  latestCommunityPosts.value = []
  searchResults.value = []
  apiUsed = ''
  channelInstance = null
  mayContainContentFromOtherChannels = false
  isArtistTopicChannel.value = false
  videoContinuationData.value = null
  shortContinuationData.value = null
  liveContinuationData.value = null
  playlistContinuationData.value = null
  podcastContinuationData.value = null
  releaseContinuationData.value = null
  searchContinuationData.value = null
  communityContinuationData.value = null
  showSearchBar.value = true
  showVideoSortBy.value = true
  showShortSortBy.value = true
  showLiveSortBy.value = true
  showPlaylistSortBy.value = true

  currentTab.value = currentOrFirstTab(route.params.currentTab)

  if (id.value === '@@@') {
    showShareMenu.value = false
    setErrorMessage(t('Channel.This channel does not exist'))
    return
  }

  showShareMenu.value = true
  errorMessage.value = ''

  // Re-enable auto refresh on sort value change AFTER update done
  if (!process.env.SUPPORTS_LOCAL_API || backendPreference.value === 'invidious') {
    getChannelInfoInvidious().finally(() => {
      autoRefreshOnSortByChangeEnabled = true
    })
  } else {
    getChannelLocal().finally(() => {
      autoRefreshOnSortByChangeEnabled = true
    })
  }
}, { deep: true })

onMounted(async () => {
  if (route.query.url) {
    await resolveChannelUrl(route.query.url, route.params.currentTab)
    return
  }

  id.value = route.params.id

  currentTab.value = currentOrFirstTab(route.params.currentTab)

  if (id.value === '@@@') {
    showShareMenu.value = false
    setErrorMessage(t('Channel.This channel does not exist'))
    return
  }

  // Enable auto refresh on sort value change AFTER initial update done
  if (!process.env.SUPPORTS_LOCAL_API || backendPreference.value === 'invidious') {
    await getChannelInfoInvidious().finally(() => {
      autoRefreshOnSortByChangeEnabled = true
    })
  } else {
    await getChannelLocal().finally(() => {
      autoRefreshOnSortByChangeEnabled = true
    })
  }

  const oldQuery = route.query.searchQueryText ?? ''
  if (oldQuery !== '') {
    newSearch(oldQuery)
  }
})

/**
 * @param {string} url
 * @param {string|undefined} tab
 */
async function resolveChannelUrl(url, tab = undefined) {
  let id

  if (!process.env.SUPPORTS_LOCAL_API || backendPreference.value === 'invidious') {
    id = await invidiousGetChannelId(url)
  } else {
    id = await getLocalChannelId(url)
  }

  if (id === null) {
    // the channel page shows an error about the channel not existing when the id is @@@
    id = '@@@'
  }

  // use router.replace to replace the current history entry
  // with the one with the resolved channel id
  // that way if you navigate back or forward in the history to this entry
  // we don't need to resolve the URL again as we already know it
  if (tab) {
    router.replace({ path: `/channel/${id}/${tab}` })
  } else {
    router.replace({ path: `/channel/${id}` })
  }
}

/**
 * @param {string} currentTab
 */
function currentOrFirstTab(currentTab) {
  return tabInfoValues.value.includes(currentTab) ? currentTab : tabInfoValues.value[0]
}

async function ensureChannelInstance() {
  if (!channelInstance) {
    channelInstance = await getLocalChannel(id.value)
  }
}

async function getChannelLocal() {
  apiUsed = 'local'
  isLoading.value = true
  const expectedId = id.value

  try {
    await ensureChannelInstance()

    let channelName_
    let channelThumbnailUrl

    if (channelInstance.alert) {
      setErrorMessage(channelInstance.alert)
      return
    } else if (channelInstance.memo.has('ChannelAgeGate')) {
      /** @type {import('youtubei.js').YTNodes.ChannelAgeGate} */
      const ageGate = channelInstance.memo.get('ChannelAgeGate')[0]

      channelName_ = ageGate.channel_title
      channelThumbnailUrl = ageGate.avatar[0].url

      channelName.value = channelName
      thumbnailUrl.value = channelThumbnailUrl

      store.commit('setAppTitle', `${channelName_} - ${packageDetails.productName}`)

      store.dispatch('updateSubscriptionDetails', { channelThumbnailUrl, channelName: channelName_, channelId: id.value })

      setErrorMessage(t('Channel["This channel is age-restricted and currently cannot be viewed in FreeTube."]'), true)
      return
    }

    errorMessage.value = ''
    if (expectedId !== id.value) {
      return
    }

    const parsedHeader = parseLocalChannelHeader(channelInstance)

    const channelId = parsedHeader.id ?? id.value
    const subscriberText = parsedHeader.subscriberText ?? null
    let tags_ = parsedHeader.tags

    channelThumbnailUrl = parsedHeader.thumbnailUrl ?? subscriptionInfo.value?.thumbnail
    channelName_ = parsedHeader.name ?? subscriptionInfo.value?.name

    if (channelThumbnailUrl?.startsWith('//')) {
      channelThumbnailUrl = `https:${channelThumbnailUrl}`
    }

    channelName.value = channelName_
    thumbnailUrl.value = channelThumbnailUrl
    bannerUrl.value = parsedHeader.bannerUrl ?? null
    isFamilyFriendly.value = !!channelInstance.metadata.is_family_safe
    isArtistTopicChannel.value = channelName_.endsWith('- Topic') && !!channelInstance.metadata.music_artist_name

    mayContainContentFromOtherChannels = isArtistTopicChannel.value ||
      !!channelInstance.header?.is(YTNodes.CarouselHeader, YTNodes.InteractiveTabbedHeader) ||
      !!(channelInstance.header?.is(YTNodes.PageHeader) && channelInstance.header.content?.animated_image)

    if (channelInstance.metadata.tags) {
      tags_.push(...channelInstance.metadata.tags)
    }

    // deduplicate tags
    // a Set can only ever contain unique elements,
    // so this is an easy way to get rid of duplicates
    if (tags_.length > 0) {
      tags_ = Array.from(new Set(tags_))
    }
    tags.value = tags_

    store.commit('setAppTitle', `${channelName_} - ${packageDetails.productName}`)

    if (subscriberText) {
      const subCount_ = parseLocalSubscriberCount(subscriberText)

      if (isNaN(subCount_)) {
        subCount.value = null
      } else {
        subCount.value = subCount_
      }
    } else {
      subCount.value = null
    }

    store.dispatch('updateSubscriptionDetails', { channelThumbnailUrl, channelName: channelName_, channelId })

    if (channelInstance.has_about) {
      getChannelAboutLocal()
    } else {
      description.value = ''
      viewCount.value = null
      videoCount.value = null
      joined.value = 0
      location.value = null
    }
    const tabs = ['about']

    // we'll count it as home page if it's not video. This will help us support some special channels
    if ((channelInstance.has_home || channelInstance.tabs[0] !== 'Videos')) {
      if (!hideChannelHome.value) {
        tabs.push('home')
      }
      // we still parse the home page so we can set related channels
      getChannelHomeLocal()
    }

    if (channelInstance.has_videos || isArtistTopicChannel.value) {
      tabs.push('videos')
      getChannelVideosLocal()
    }

    if (!hideChannelShorts.value && channelInstance.has_shorts) {
      tabs.push('shorts')
      getChannelShortsLocal()
    }

    if (!hideLiveStreams.value && channelInstance.has_live_streams) {
      tabs.push('live')
      getChannelLiveLocal()
    }

    if (!hideChannelPodcasts.value && channelInstance.has_podcasts) {
      tabs.push('podcasts')
      getChannelPodcastsLocal()
    }

    if (!hideChannelReleases.value && (channelInstance.has_releases || isArtistTopicChannel.value)) {
      tabs.push('releases')
      getChannelReleasesLocal()
    }

    if (!hideChannelCourses.value && channelInstance.has_courses) {
      tabs.push('courses')
      getChannelCoursesLocal()
    }

    if (!hideChannelPlaylists.value) {
      if (channelInstance.has_playlists) {
        tabs.push('playlists')
        getChannelPlaylistsLocal()
      }
    }

    if (!hideChannelCommunity.value && channelInstance.has_community) {
      tabs.push('community')
      getCommunityPostsLocal()
    }

    channelTabs.value = SUPPORTED_CHANNEL_TABS.filter(tab => {
      return tabs.includes(tab)
    })

    currentTab.value = currentOrFirstTab(route.params.currentTab)
    showSearchBar.value = channelInstance.has_search

    isLoading.value = false
  } catch (err) {
    console.error(err)
    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })
    if (backendPreference.value === 'local' && backendFallback.value) {
      showToast(t('Falling back to Invidious API'))
      getChannelInfoInvidious()
    } else {
      isLoading.value = false
    }
  }
}

async function getChannelAboutLocal() {
  try {
    await ensureChannelInstance()
    const about = await channelInstance.getAbout()

    if (about.is(YTNodes.ChannelAboutFullMetadata)) {
      description.value = about.description.isEmpty() ? '' : autolinker.link(about.description.text)

      const viewCount_ = extractNumberFromString(about.view_count.text)
      viewCount.value = isNaN(viewCount_) ? null : viewCount_

      videoCount.value = null

      joined.value = about.joined_date.isEmpty() ? 0 : Date.parse(about.joined_date.text.replace('Joined').trim())

      location.value = about.country.isEmpty() ? null : about.country.text
    } else {
      description.value = about.metadata.description ? autolinker.link(about.metadata.description) : ''

      const viewCount_ = extractNumberFromString(about.metadata.view_count)
      viewCount.value = isNaN(viewCount_) ? null : viewCount_

      const videoCount_ = extractNumberFromString(about.metadata.video_count)
      videoCount.value = isNaN(videoCount_) ? null : videoCount_

      joined.value = about.metadata.joined_date && !about.metadata.joined_date.isEmpty() ? Date.parse(about.metadata.joined_date.text.replace('Joined').trim()) : 0

      location.value = about.metadata.country ?? null
    }
  } catch (err) {
    console.error(err)
    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })
    if (backendPreference.value === 'local' && backendFallback.value) {
      showToast(t('Falling back to Invidious API'))
      getChannelInfoInvidious()
    } else {
      isLoading.value = false
    }
  }
}

const homeData = shallowRef([])

function getChannelHomeLocal() {
  isElementListLoading.value = true
  const expectedId = id.value

  try {
    const homeTab = channelInstance //  await channel.getHome()

    if (expectedId !== id.value) {
      return
    }

    let homeData_

    if (mayContainContentFromOtherChannels) {
      homeData_ = parseChannelHomeTab(homeTab)
    } else {
      homeData_ = parseChannelHomeTab(homeTab, id.value, channelName.value)
    }

    if (!hideChannelHome.value) {
      homeData.value = homeData_
    }

    // parse related channels from home page data
    const relatedChannels_ = []
    /** @type {Set<string>} */
    const knownChannelIds = new Set()

    for (const shelf of homeData_) {
      for (const item of shelf.content) {
        if (item.type === 'channel' && !knownChannelIds.has(item.id)) {
          knownChannelIds.add(item)
          relatedChannels_.push({
            name: item.name,
            id: item.id,
            thumbnailUrl: item.thumbnail
          })
        }
      }
    }
    relatedChannels.value = relatedChannels_

    isElementListLoading.value = false
  } catch (err) {
    console.error(err)
    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })
  }
}

async function getChannelInfoInvidious() {
  isLoading.value = true
  apiUsed = 'invidious'
  channelInstance = null

  const expectedId = id.value
  try {
    const response = await invidiousGetChannelInfo(id.value)

    if (expectedId !== id.value) {
      return
    }

    const channelName_ = response.author
    const channelId = response.authorId
    channelName.value = channelName_
    store.commit('setAppTitle', `${channelName_} - ${packageDetails.productName}`)
    id.value = channelId
    isFamilyFriendly.value = response.isFamilyFriendly
    subCount.value = response.subCount
    const thumbnail = response.authorThumbnails[3].url
    thumbnailUrl.value = youtubeImageUrlToInvidious(thumbnail, currentInvidiousInstanceUrl.value)
    store.dispatch('updateSubscriptionDetails', { channelThumbnailUrl: thumbnail, channelName: channelName_, channelId })
    description.value = autolinker.link(response.description)
    viewCount.value = response.totalViews
    videoCount.value = null
    joined.value = response.joined * 1000
    relatedChannels.value = response.relatedChannels.map((channel) => {
      const thumbnailUrl = channel.authorThumbnails.at(-1).url

      return {
        name: channel.author,
        id: channel.authorId,
        thumbnailUrl: youtubeImageUrlToInvidious(thumbnailUrl, currentInvidiousInstanceUrl.value)
      }
    })

    if (Array.isArray(response.authorBanners) && response.authorBanners.length > 0) {
      bannerUrl.value = youtubeImageUrlToInvidious(response.authorBanners[0].url, currentInvidiousInstanceUrl.value)
    } else {
      bannerUrl.value = null
    }

    errorMessage.value = ''

    // some channels only have a few tabs
    // here are all possible values: home, videos, shorts, streams, playlists, community, channels, about

    channelTabs.value = SUPPORTED_CHANNEL_TABS.filter(tab => {
      return response.tabs.includes(tab) && tab !== 'home'
    })

    currentTab.value = currentOrFirstTab(route.params.currentTab)

    if (response.tabs.includes('videos')) {
      channelInvidiousVideos()
    }

    if (!hideChannelShorts.value && response.tabs.includes('shorts')) {
      channelInvidiousShorts()
    }

    if (!hideLiveStreams.value && response.tabs.includes('live')) {
      channelInvidiousLive()
    }

    if (!hideChannelPodcasts.value && response.tabs.includes('podcasts')) {
      channelInvidiousPodcasts()
    }

    if (!hideChannelReleases.value && response.tabs.includes('releases')) {
      channelInvidiousReleases()
    }

    if (!hideChannelCourses.value && response.tabs.includes('courses')) {
      channelInvidiousCourses()
    }

    if (!hideChannelPlaylists.value && response.tabs.includes('playlists')) {
      getPlaylistsInvidious()
    }

    if (!hideChannelCommunity.value && response.tabs.includes('community')) {
      getCommunityPostsInvidious()
    }

    isLoading.value = false
  } catch (err) {
    setErrorMessage(err)
    console.error(err)

    const errorMessage = t('Invidious API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })

    if (process.env.SUPPORTS_LOCAL_API && backendPreference.value === 'invidious' && backendFallback.value) {
      showToast(t('Falling back to Local API'))
      getChannelLocal()
    } else {
      isLoading.value = false
    }
  }
}

const latestVideos = shallowRef([])
const videoContinuationData = shallowRef(null)
const showVideoSortBy = ref(true)
const videoSortBy = ref('newest')

const filteredVideos = computed(() => {
  if (hideWatchedSubs.value) {
    return filterWatchedArray(latestVideos.value)
  } else {
    return latestVideos.value
  }
})

const filteredShorts = computed(() => {
  if (hideWatchedSubs.value) {
    return filterWatchedArray(latestShorts.value)
  } else {
    return latestShorts.value
  }
})

const filteredLive = computed(() => {
  if (hideWatchedSubs.value) {
    return filterWatchedArray(latestLive.value)
  } else {
    return latestLive.value
  }
})

watch(videoSortBy, () => {
  if (!autoRefreshOnSortByChangeEnabled) { return }

  isElementListLoading.value = true
  latestVideos.value = []
  videoContinuationData.value = null

  if (process.env.SUPPORTS_LOCAL_API && apiUsed === 'local') {
    getChannelVideosLocal()
  } else {
    channelInvidiousVideos(true)
  }
})

async function getChannelVideosLocal() {
  isElementListLoading.value = true
  const expectedId = id.value

  try {
    if (isArtistTopicChannel.value) {
      // Artist topic channels don't have a videos tab.
      // Interestingly the auto-generated uploads playlists do exist for those channels,
      // so we'll use them instead.

      const playlistId = getChannelPlaylistId(id.value, 'videos', videoSortBy.value)
      const playlist = await getLocalPlaylist(playlistId)

      if (expectedId !== id.value) {
        return
      }

      latestVideos.value = playlist.items.map(parseLocalPlaylistVideo)
      videoContinuationData.value = playlist.has_continuation ? playlist : null
      isElementListLoading.value = false
    } else {
      await ensureChannelInstance()

      let videosTab = await channelInstance.getVideos()

      showVideoSortBy.value = videosTab.filters.length > 1

      if (showVideoSortBy.value && videoSortBy.value !== 'newest') {
        const index = videoLiveShortSelectValues.value.indexOf(videoSortBy.value)
        videosTab = await videosTab.applyFilter(videosTab.filters[index])
      }

      if (expectedId !== id.value) {
        return
      }

      latestVideos.value = parseLocalChannelVideos(videosTab.videos, id.value, channelName.value)
      videoContinuationData.value = videosTab.has_continuation ? videosTab : null
      isElementListLoading.value = false
    }

    if (isSubscribedInAnyProfile.value && latestVideos.value.length > 0 && videoSortBy.value === 'newest') {
      store.dispatch('updateSubscriptionVideosCacheByChannel', {
        channelId: id.value,
        videos: latestVideos.value
      })
    }
  } catch (err) {
    if (isArtistTopicChannel.value && err.message === 'The playlist does not exist.') {
      // If this artist topic channel doesn't have any videos, ignore the error.
      return
    }

    console.error(err)
    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })
    if (backendPreference.value === 'local' && backendFallback.value) {
      showToast(t('Falling back to Invidious API'))
      getChannelInfoInvidious()
    } else {
      isLoading.value = false
    }
  }
}

async function getChannelVideosLocalMore() {
  try {
    if (isArtistTopicChannel.value) {
      /** @type {import('youtubei.js').YT.Playlist} */
      const continuation = await videoContinuationData.value.getContinuation()

      latestVideos.value = latestVideos.value.concat(continuation.items.map(parseLocalPlaylistVideo))
      videoContinuationData.value = continuation.has_continuation ? continuation : null
    } else {
      /**
       * @type {import('youtubei.js').YT.ChannelListContinuation|import('youtubei.js').YT.FilteredChannelList}
       */
      const continuation = await videoContinuationData.value.getContinuation()

      latestVideos.value = latestVideos.value.concat(parseLocalChannelVideos(continuation.videos, id.value, channelName.value))
      videoContinuationData.value = continuation.has_continuation ? continuation : null
    }
  } catch (err) {
    console.error(err)
    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })
  }
}

/**
 * @param {boolean} sortByChanged
 */
async function channelInvidiousVideos(sortByChanged = false) {
  if (sortByChanged) {
    videoContinuationData.value = null
  }

  let more = false
  if (videoContinuationData.value) {
    more = true
  } else {
    isElementListLoading.value = true
  }

  try {
    const response = await getInvidiousChannelVideos(id.value, videoSortBy.value, videoContinuationData.value)
    if (more) {
      latestVideos.value = latestVideos.value.concat(response.videos)
    } else {
      latestVideos.value = response.videos
    }
    videoContinuationData.value = response.continuation || null
    isElementListLoading.value = false

    if (isSubscribedInAnyProfile.value && !more && latestVideos.value.length > 0 && videoSortBy.value === 'newest') {
      store.dispatch('updateSubscriptionVideosCacheByChannel', {
        channelId: id.value,
        videos: latestVideos.value
      })
    }
  } catch (err) {
    console.error(err)
    const errorMessage = t('Invidious API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })
  }
}

const latestShorts = shallowRef([])
const shortContinuationData = shallowRef(null)
const showShortSortBy = ref(true)
const shortSortBy = ref('newest')

watch(shortSortBy, () => {
  if (!autoRefreshOnSortByChangeEnabled) { return }

  isElementListLoading.value = true
  latestShorts.value = []
  shortContinuationData.value = null

  if (process.env.SUPPORTS_LOCAL_API && apiUsed === 'local') {
    getChannelShortsLocal()
  } else {
    channelInvidiousShorts(true)
  }
})

async function getChannelShortsLocal() {
  isElementListLoading.value = true
  const expectedId = id.value

  try {
    await ensureChannelInstance()

    let shortsTab = await channelInstance.getShorts()

    showShortSortBy.value = shortsTab.filters.length > 1

    if (showShortSortBy.value && shortSortBy.value !== 'newest') {
      const index = videoLiveShortSelectValues.value.indexOf(shortSortBy.value)
      shortsTab = await shortsTab.applyFilter(shortsTab.filters[index])
    }

    if (expectedId !== id.value) {
      return
    }

    let parsedShorts

    if (mayContainContentFromOtherChannels) {
      parsedShorts = parseLocalChannelShorts(shortsTab.videos)
    } else {
      parsedShorts = parseLocalChannelShorts(shortsTab.videos, id.value, channelName.value)
    }

    latestShorts.value = parsedShorts
    shortContinuationData.value = shortsTab.has_continuation ? shortsTab : null
    isElementListLoading.value = false

    if (isSubscribedInAnyProfile.value && latestShorts.value.length > 0 && shortSortBy.value === 'newest') {
      // As the shorts tab API response doesn't include the published dates,
      // we can't just write the results to the subscriptions cache like we do with videos and live (can't sort chronologically without the date).
      // However we can still update the metadata in the cache such as the view count and title that might have changed since it was cached
      store.dispatch('updateSubscriptionShortsCacheWithChannelPageShorts', {
        channelId: id.value,
        videos: latestShorts.value
      })
    }
  } catch (err) {
    console.error(err)
    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })
    if (backendPreference.value === 'local' && backendFallback.value) {
      showToast(t('Falling back to Invidious API'))
      getChannelInfoInvidious()
    } else {
      isLoading.value = false
    }
  }
}

async function getChannelShortsLocalMore() {
  try {
    /**
     * @type {import('youtubei.js').YT.ChannelListContinuation|import('youtubei.js').YT.FilteredChannelList}
     */
    const continuation = await shortContinuationData.value.getContinuation()

    let parsedShorts

    if (mayContainContentFromOtherChannels) {
      parsedShorts = parseLocalChannelShorts(continuation.videos)
    } else {
      parsedShorts = parseLocalChannelShorts(continuation.videos, id.value, channelName.value)
    }

    latestShorts.value = latestShorts.value.concat(parsedShorts)
    shortContinuationData.value = continuation.has_continuation ? continuation : null
  } catch (err) {
    console.error(err)
    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })
  }
}

/**
 * @param {boolean} sortByChanged
 */
async function channelInvidiousShorts(sortByChanged = false) {
  if (sortByChanged) {
    shortContinuationData.value = null
  }

  let more = false
  if (shortContinuationData.value) {
    more = true
  } else {
    isElementListLoading.value = true
  }

  try {
    const response = await getInvidiousChannelShorts(id.value, shortSortBy.value, shortContinuationData.value)
    if (more) {
      latestShorts.value = latestShorts.value.concat(response.videos)
    } else {
      latestShorts.value = response.videos
    }
    shortContinuationData.value = response.continuation || null
    isElementListLoading.value = false

    if (isSubscribedInAnyProfile.value && !more && latestShorts.value.length > 0 && shortSortBy.value === 'newest') {
      // As the shorts tab API response doesn't include the published dates,
      // we can't just write the results to the subscriptions cache like we do with videos and live (can't sort chronologically without the date).
      // However we can still update the metadata in the cache e.g. adding the duration, as that isn't included in the RSS feeds
      // and updating the view count and title that might have changed since it was cached
      store.dispatch('updateSubscriptionShortsCacheWithChannelPageShorts', {
        channelId: id.value,
        videos: latestShorts.value
      })
    }
  } catch (err) {
    console.error(err)
    const errorMessage = t('Invidious API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })
  }
}

const latestLive = shallowRef([])
const liveContinuationData = shallowRef(null)
const showLiveSortBy = ref(true)
const liveSortBy = ref('newest')

watch(liveSortBy, () => {
  if (!autoRefreshOnSortByChangeEnabled) { return }

  isElementListLoading.value = true
  latestLive.value = []
  liveContinuationData.value = null

  if (process.env.SUPPORTS_LOCAL_API && apiUsed === 'local') {
    getChannelLiveLocal()
  } else {
    channelInvidiousLive(true)
  }
})

async function getChannelLiveLocal() {
  isElementListLoading.value = true
  const expectedId = id.value

  try {
    await ensureChannelInstance()

    let liveTab = await channelInstance.getLiveStreams()

    showLiveSortBy.value = liveTab.filters.length > 1

    if (showLiveSortBy.value && liveSortBy.value !== 'newest') {
      const index = videoLiveShortSelectValues.value.indexOf(liveSortBy.value)
      liveTab = await liveTab.applyFilter(liveTab.filters[index])
    }

    if (expectedId !== id.value) {
      return
    }

    // work around YouTube bug where it will return a bunch of responses with only continuations in them
    // e.g. https://www.youtube.com/@TWLIVES/streams

    let videos = liveTab.videos
    while (videos.length === 0 && liveTab.has_continuation) {
      liveTab = await liveTab.getContinuation()
      videos = liveTab.videos
    }

    latestLive.value = parseLocalChannelVideos(videos, id.value, channelName.value)
    liveContinuationData.value = liveTab.has_continuation ? liveTab : null
    isElementListLoading.value = false

    if (isSubscribedInAnyProfile.value && latestLive.value.length > 0 && liveSortBy.value === 'newest') {
      store.dispatch('updateSubscriptionLiveCacheByChannel', {
        channelId: id.value,
        videos: latestLive.value
      })
    }
  } catch (err) {
    console.error(err)
    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })
    if (backendPreference.value === 'local' && backendFallback.value) {
      showToast(t('Falling back to Invidious API'))
      getChannelInfoInvidious()
    } else {
      isLoading.value = false
    }
  }
}

async function getChannelLiveLocalMore() {
  try {
    /**
     * @type {import('youtubei.js').YT.ChannelListContinuation|import('youtubei.js').YT.FilteredChannelList}
     */
    const continuation = await liveContinuationData.value.getContinuation()

    latestLive.value = latestLive.value.concat(parseLocalChannelVideos(continuation.videos, id.value, channelName.value))
    liveContinuationData.value = continuation.has_continuation ? continuation : null
  } catch (err) {
    console.error(err)
    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })
  }
}

/**
 * @param {boolean} sortByChanged
 */
async function channelInvidiousLive(sortByChanged) {
  if (sortByChanged) {
    liveContinuationData.value = null
  }

  let more = false
  if (liveContinuationData.value) {
    more = true
  } else {
    isElementListLoading.value = true
  }

  try {
    const response = await getInvidiousChannelLive(id.value, liveSortBy.value, liveContinuationData.value)
    if (more) {
      latestLive.value = latestLive.value.concat(response.videos)
    } else {
      latestLive.value = response.videos
    }
    liveContinuationData.value = response.continuation || null
    isElementListLoading.value = false

    if (isSubscribedInAnyProfile.value && !more && latestLive.value.length > 0 && liveSortBy.value === 'newest') {
      store.dispatch('updateSubscriptionLiveCacheByChannel', {
        channelId: id.value,
        videos: latestLive.value
      })
    }
  } catch (err) {
    console.error(err)
    const errorMessage = t('Invidious API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })
  }
}

const latestPlaylists = shallowRef([])
const playlistContinuationData = shallowRef(null)
const showPlaylistSortBy = ref(true)
const playlistSortBy = ref('newest')

watch(playlistSortBy, () => {
  if (!autoRefreshOnSortByChangeEnabled) { return }

  isElementListLoading.value = true
  latestPlaylists.value = []
  playlistContinuationData.value = null

  if (process.env.SUPPORTS_LOCAL_API && apiUsed === 'local') {
    getChannelPlaylistsLocal()
  } else {
    getPlaylistsInvidious(true)
  }
})

async function getChannelPlaylistsLocal() {
  const expectedId = id.value

  try {
    await ensureChannelInstance()

    let playlistsTab = await channelInstance.getPlaylists()

    // some channels have more categories of playlists than just "Created Playlists" e.g. https://www.youtube.com/channel/UCez-2shYlHQY3LfILBuDYqQ
    // for the moment we just want the "Created Playlists" category that has all playlists in it

    if (playlistsTab.content_type_filters.length > 1) {
      /**
       * @type {import('youtubei.js').YTNodes.ChannelSubMenu}
       */
      const menu = playlistsTab.current_tab.content.sub_menu
      const createdPlaylistsFilter = menu.content_type_sub_menu_items.find(contentType => {
        const url = `https://youtube.com/${contentType.endpoint.metadata.url}`
        return new URL(url).searchParams.get('view') === '1'
      }).title

      playlistsTab = await playlistsTab.applyContentTypeFilter(createdPlaylistsFilter)
    }

    // YouTube seems to allow the playlists tab to be sorted even if it only has one playlist
    // as it doesn't make sense to sort a list with a single playlist in it, we'll hide the sort by element if there is a single playlist
    showPlaylistSortBy.value = playlistsTab.sort_filters.length > 1 && playlistsTab.playlists.length > 1

    if (showPlaylistSortBy.value && playlistSortBy.value !== 'newest') {
      const index = PLAYLIST_SELECT_VALUES.indexOf(playlistSortBy.value)
      playlistsTab = await playlistsTab.applySort(playlistsTab.sort_filters[index])
    }

    if (expectedId !== id.value) {
      return
    }

    latestPlaylists.value = playlistsTab.playlists.map(playlist => parseLocalListPlaylist(playlist, id.value, channelName.value))
    playlistContinuationData.value = playlistsTab.has_continuation ? playlistsTab : null
    isElementListLoading.value = false
  } catch (err) {
    console.error(err)
    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })
    if (backendPreference.value === 'local' && backendFallback.value) {
      showToast(t('Falling back to Invidious API'))
      getPlaylistsInvidious()
    } else {
      isLoading.value = false
    }
  }
}

async function getChannelPlaylistsLocalMore() {
  try {
    /**
     * @type {import('youtubei.js').YT.ChannelListContinuation}
     */
    const continuation = await playlistContinuationData.value.getContinuation()

    const parsedPlaylists = continuation.playlists.map(playlist => parseLocalListPlaylist(playlist, id.value, channelName.value))
    latestPlaylists.value = latestPlaylists.value.concat(parsedPlaylists)
    playlistContinuationData.value = continuation.has_continuation ? continuation : null
  } catch (err) {
    console.error(err)
    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })
  }
}

async function getPlaylistsInvidious() {
  isElementListLoading.value = true

  try {
    const response = await getInvidiousChannelPlaylists(id.value, playlistSortBy.value)
    playlistContinuationData.value = response.continuation || null
    latestPlaylists.value = response.playlists
    isElementListLoading.value = false
  } catch (err) {
    console.error(err)
    const errorMessage = t('Invidious API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })
    if (process.env.SUPPORTS_LOCAL_API && backendPreference.value === 'invidious' && backendFallback.value) {
      showToast(t('Falling back to Local API'))
      getChannelPlaylistsLocal()
    } else {
      isLoading.value = false
    }
  }
}

async function getPlaylistsInvidiousMore() {
  try {
    const response = await getInvidiousChannelPlaylists(id.value, playlistSortBy.value, playlistContinuationData.value)
    playlistContinuationData.value = response.continuation || null
    latestPlaylists.value = latestPlaylists.value.concat(response.playlists)
    isElementListLoading.value = false
  } catch (err) {
    console.error(err)

    const errorMessage = t('Invidious API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })
  }
}

const latestReleases = shallowRef([])
const releaseContinuationData = shallowRef(null)

async function getChannelReleasesLocal() {
  isElementListLoading.value = true
  const expectedId = id.value

  try {
    await ensureChannelInstance()
    if (isArtistTopicChannel.value) {
      const { releases, continuationData } = await getLocalArtistTopicChannelReleases(channelInstance)

      if (expectedId !== id.value) {
        return
      }

      latestReleases.value = releases
      releaseContinuationData.value = continuationData
    } else {
      const releaseTab = await channelInstance.getReleases()

      if (expectedId !== id.value) {
        return
      }

      latestReleases.value = releaseTab.playlists.map(playlist => parseLocalListPlaylist(playlist, id.value, channelName.value))
      releaseContinuationData.value = releaseTab.has_continuation ? releaseTab : null
    }

    isElementListLoading.value = false
  } catch (err) {
    console.error(err)

    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })

    if (backendPreference.value === 'local' && backendFallback.value) {
      showToast(t('Falling back to Invidious API'))
      channelInvidiousReleases()
    } else {
      isLoading.value = false
    }
  }
}

async function getChannelReleasesLocalMore() {
  try {
    if (isArtistTopicChannel.value) {
      await ensureChannelInstance()

      const { releases, continuationData } = await getLocalArtistTopicChannelReleasesContinuation(
        channelInstance, releaseContinuationData.value
      )

      latestReleases.value = latestReleases.value.concat(releases)
      releaseContinuationData.value = continuationData
    } else {
      /**
       * @type {import('youtubei.js').YT.ChannelListContinuation}
       */
      const continuation = await releaseContinuationData.value.getContinuation()

      const parsedReleases = continuation.playlists.map(playlist => parseLocalListPlaylist(playlist, id.value, channelName.value))
      latestReleases.value = latestReleases.value.concat(parsedReleases)
      releaseContinuationData.value = continuation.has_continuation ? continuation : null
    }
  } catch (err) {
    console.error(err)
    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })
  }
}

async function channelInvidiousReleases() {
  isElementListLoading.value = true

  try {
    const response = await getInvidiousChannelReleases(id.value)
    releaseContinuationData.value = response.continuation || null
    latestReleases.value = response.playlists
    isElementListLoading.value = false
  } catch (err) {
    console.error(err)
    const errorMessage = t('Invidious API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })
    if (process.env.SUPPORTS_LOCAL_API && backendPreference.value === 'invidious' && backendFallback.value) {
      showToast(t('Falling back to Local API'))
      getChannelReleasesLocal()
    } else {
      isLoading.value = false
    }
  }
}

async function channelInvidiousReleasesMore() {
  try {
    const response = await getInvidiousChannelReleases(id.value, releaseContinuationData.value)
    releaseContinuationData.value = response.continuation || null
    latestReleases.value = latestReleases.value.concat(response.playlists)
    isElementListLoading.value = false
  } catch (err) {
    console.error(err)
    const errorMessage = t('Invidious API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })
  }
}

const latestPodcasts = shallowRef([])
const podcastContinuationData = shallowRef(null)

async function getChannelPodcastsLocal() {
  isElementListLoading.value = true
  const expectedId = id.value

  try {
    await ensureChannelInstance()

    const podcastTab = await channelInstance.getPodcasts()

    if (expectedId !== id.value) {
      return
    }

    latestPodcasts.value = podcastTab.playlists.map(playlist => parseLocalListPlaylist(playlist, id.value, channelName.value))
    podcastContinuationData.value = podcastTab.has_continuation ? podcastTab : null
    isElementListLoading.value = false
  } catch (err) {
    console.error(err)
    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })
    if (backendPreference.value === 'local' && backendFallback.value) {
      showToast(t('Falling back to Invidious API'))
      channelInvidiousPodcasts()
    } else {
      isLoading.value = false
    }
  }
}

async function getChannelPodcastsLocalMore() {
  try {
    /**
     * @type {import('youtubei.js').YT.ChannelListContinuation}
     */
    const continuation = await podcastContinuationData.value.getContinuation()

    const parsedPodcasts = continuation.playlists.map(playlist => parseLocalListPlaylist(playlist, id.value, channelName.value))
    latestPodcasts.value = latestPodcasts.value.concat(parsedPodcasts)
    podcastContinuationData.value = continuation.has_continuation ? continuation : null
  } catch (err) {
    console.error(err)
    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })
  }
}

async function channelInvidiousPodcasts() {
  isElementListLoading.value = true

  try {
    const response = await getInvidiousChannelPodcasts(id.value)
    podcastContinuationData.value = response.continuation || null
    latestPodcasts.value = response.playlists
    isElementListLoading.value = false
  } catch (err) {
    console.error(err)

    const errorMessage = t('Invidious API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })

    if (process.env.SUPPORTS_LOCAL_API && backendPreference.value === 'invidious' && backendFallback.value) {
      showToast(t('Falling back to Local API'))
      getChannelPodcastsLocal()
    } else {
      isLoading.value = false
    }
  }
}

async function channelInvidiousPodcastsMore() {
  try {
    const response = await getInvidiousChannelPodcasts(id.value, podcastContinuationData.value)
    podcastContinuationData.value = response.continuation || null
    latestPodcasts.value = latestPodcasts.value.concat(response.playlists)
    isElementListLoading.value = false
  } catch (err) {
    console.error(err)
    const errorMessage = t('Invidious API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })
  }
}

const latestCourses = shallowRef([])
const coursesContinuationData = shallowRef(null)

async function getChannelCoursesLocal() {
  isElementListLoading.value = true
  const expectedId = id.value

  try {
    await ensureChannelInstance()

    const coursesTab = await channelInstance.getCourses()

    if (expectedId !== id.value) {
      return
    }

    latestCourses.value = coursesTab.playlists.map(playlist => parseLocalListPlaylist(playlist, id.value, channelName.value))
    coursesContinuationData.value = coursesTab.has_continuation ? coursesTab : null
    isElementListLoading.value = false
  } catch (err) {
    console.error(err)

    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })

    if (backendPreference.value === 'local' && backendFallback.value) {
      showToast(t('Falling back to Invidious API'))
      channelInvidiousCourses()
    } else {
      isLoading.value = false
    }
  }
}

async function getChannelCoursesLocalMore() {
  try {
    /**
     * @type {import('youtubei.js').YT.ChannelListContinuation}
     */
    const continuation = await coursesContinuationData.value.getContinuation()

    const parsedCourses = continuation.playlists.map(playlist => parseLocalListPlaylist(playlist, id.value, channelName.value))
    latestCourses.value = latestCourses.value.concat(parsedCourses)
    coursesContinuationData.value = continuation.has_continuation ? continuation : null
  } catch (err) {
    console.error(err)
    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })
  }
}

async function channelInvidiousCourses() {
  isElementListLoading.value = true

  try {
    const response = await getInvidiousChannelCourses(id.value)
    coursesContinuationData.value = response.continuation || null
    latestCourses.value = response.playlists
    isElementListLoading.value = false
  } catch (err) {
    console.error(err)

    const errorMessage = t('Invidious API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })

    if (process.env.SUPPORTS_LOCAL_API && backendPreference.value === 'invidious' && backendFallback.value) {
      showToast(t('Falling back to Local API'))
      getChannelCoursesLocal()
    } else {
      isLoading.value = false
    }
  }
}

async function channelInvidiousCoursesMore() {
  try {
    const response = await getInvidiousChannelCourses(id.value, coursesContinuationData.value)
    coursesContinuationData.value = response.continuation || null
    latestCourses.value = latestCourses.value.concat(response.playlists)
    isElementListLoading.value = false
  } catch (err) {
    console.error(err)
    const errorMessage = t('Invidious API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })
  }
}

const latestCommunityPosts = shallowRef([])
const communityContinuationData = shallowRef(null)

async function getCommunityPostsLocal() {
  const expectedId = id.value

  try {
    await ensureChannelInstance()

    /**
     * @type {import('youtubei.js').YT.Channel|import('youtubei.js').YT.ChannelListContinuation}
     */
    let communityTab = await channelInstance.getCommunity()
    if (expectedId !== id.value) {
      return
    }

    // work around YouTube bug where it will return a bunch of responses with only continuations in them
    // e.g. https://www.youtube.com/@TheLinuxEXP/community

    let posts = communityTab.posts
    while (posts.length === 0 && communityTab.has_continuation) {
      communityTab = await communityTab.getContinuation()
      posts = communityTab.posts
    }

    latestCommunityPosts.value = parseLocalCommunityPosts(posts)
    communityContinuationData.value = communityTab.has_continuation ? communityTab : null

    if (latestCommunityPosts.value.length > 0) {
      store.dispatch('updateSubscriptionPostsCacheByChannel', {
        channelId: id.value,
        posts: latestCommunityPosts.value
      })
    }
  } catch (err) {
    console.error(err)

    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })

    if (backendPreference.value === 'local' && backendFallback.value) {
      showToast(t('Falling back to Invidious API'))
      getCommunityPostsInvidious()
    } else {
      isLoading.value = false
    }
  }
}

async function getCommunityPostsLocalMore() {
  try {
    /**
     * @type {import('youtubei.js').YT.ChannelListContinuation}
     */
    let continuation = await communityContinuationData.value.getContinuation()

    // work around YouTube bug where it will return a bunch of responses with only continuations in them
    // e.g. https://www.youtube.com/@TheLinuxEXP/community
    let posts = continuation.posts
    while (posts.length === 0 && continuation.has_continuation) {
      continuation = await continuation.getContinuation()
      posts = continuation.posts
    }

    latestCommunityPosts.value = latestCommunityPosts.value.concat(parseLocalCommunityPosts(posts))
    communityContinuationData.value = continuation.has_continuation ? continuation : null
  } catch (err) {
    console.error(err)
    const errorMessage = t('Local API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })
  }
}

async function getCommunityPostsInvidious() {
  const more = !isNullOrEmpty(communityContinuationData.value)

  try {
    const { posts, continuation } = await invidiousGetCommunityPosts(id.value, communityContinuationData.value)
    if (more) {
      latestCommunityPosts.value = latestCommunityPosts.value.concat(posts)
    } else {
      latestCommunityPosts.value = posts
    }
    communityContinuationData.value = continuation

    if (isSubscribedInAnyProfile.value && !more && latestCommunityPosts.value.length > 0) {
      store.dispatch('updateSubscriptionPostsCacheByChannel', {
        channelId: id.value,
        posts: latestCommunityPosts.value
      })
    }
  } catch (err) {
    console.error(err)

    const errorMessage = t('Invidious API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })

    if (process.env.SUPPORTS_LOCAL_API && backendPreference.value === 'invidious' && backendFallback.value) {
      showToast(t('Falling back to Local API'))
      getCommunityPostsLocal()
    }
  }
}

let searchPage = 1
const lastSearchQuery = ref('')
const searchResults = shallowRef([])
const searchContinuationData = shallowRef(null)

async function searchChannelLocal() {
  const isNewSearch = searchContinuationData.value === null

  try {
    await ensureChannelInstance()

    let result
    let contents

    if (isNewSearch) {
      if (!channelInstance.has_search) {
        showToast(t('Channel.This channel does not allow searching'), 5000)
        showSearchBar.value = false
        return
      }
      result = await channelInstance.search(lastSearchQuery.value)
      contents = result.current_tab.content.contents
    } else {
      result = await searchContinuationData.value.getContinuation()
      contents = result.contents.contents
    }

    const results = contents
      .filter(node => node.type === 'ItemSection')
      .flatMap(itemSection => itemSection.contents)
      .filter(item => item.type === 'Video' || (!hideChannelPlaylists.value && item.type === 'Playlist'))
      .map(item => {
        if (item.type === 'Video') {
          return parseLocalListVideo(item)
        } else {
          return parseLocalListPlaylist(item, id.value, channelName.value)
        }
      })

    if (isNewSearch) {
      searchResults.value = results
    } else {
      searchResults.value = searchResults.value.concat(results)
    }

    searchContinuationData.value = result.has_continuation ? result : null
    isSearchTabLoading.value = false
  } catch (err) {
    console.error(err)
    const errorMessage = t('Local API Error (Click to copy)')

    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })

    if (isNewSearch) {
      if (backendPreference.value === 'local' && backendFallback.value) {
        showToast(t('Falling back to Invidious API'))
        searchChannelInvidious()
      } else {
        isLoading.value = false
      }
    }
  }
}

async function searchChannelInvidious() {
  try {
    const response = await searchInvidiousChannel(id.value, lastSearchQuery.value, searchPage)

    if (hideChannelPlaylists.value) {
      searchResults.value = searchResults.value.concat(response.filter(item => item.type !== 'playlist'))
    } else {
      searchResults.value = searchResults.value.concat(response)
    }

    isSearchTabLoading.value = false
    searchPage++
  } catch (err) {
    console.error(err)

    const errorMessage = t('Invidious API Error (Click to copy)')
    showToast(`${errorMessage}: ${err}`, 10000, () => {
      copyToClipboard(err)
    })

    if (process.env.SUPPORTS_LOCAL_API && backendPreference.value === 'invidious' && backendFallback.value) {
      showToast(t('Falling back to Local API'))
      searchChannelLocal()
    } else {
      isLoading.value = false
    }
  }
}

/**
 * @param {string} query
 */
function newSearch(query) {
  lastSearchQuery.value = query
  searchContinuationData.value = null
  isSearchTabLoading.value = true
  searchPage = 1
  searchResults.value = []
  changeTab('search')

  if (process.env.SUPPORTS_LOCAL_API && apiUsed === 'local') {
    searchChannelLocal()
  } else {
    searchChannelInvidious()
  }
}

/**
 * @param {string} query
 */
function newSearchWithStatePersist(query) {
  saveStateInRouter(query)
  newSearch(query)
}

async function saveStateInRouter(query) {
  skipRouteChangeWatcherOnce = true

  let location

  if (query === '') {
    location = { path: `/channel/${id.value}` }
  } else {
    location = {
      path: `/channel/${id.value}`,
      params: {
        currentTab: 'search',
      },
      query: {
        searchQueryText: query,
      }
    }
  }

  try {
    await router.replace(location)
  } catch (failure) {
    if (isNavigationFailure(failure, NavigationFailureType.duplicated)) {
      return
    }

    throw failure
  }

  skipRouteChangeWatcherOnce = false
}

/**
 * @param {string} message
 * @param {boolean} responseHasNameAndThumbnail
 */
function setErrorMessage(message, responseHasNameAndThumbnail = false) {
  isLoading.value = false
  errorMessage.value = message

  if (!responseHasNameAndThumbnail) {
    channelName.value = subscriptionInfo.value?.name
    thumbnailUrl.value = subscriptionInfo.value?.thumbnail
  }

  bannerUrl.value = null
  subCount.value = null
}

const showFetchMoreButton = computed(() => {
  switch (currentTab.value) {
    case 'videos':
      return !isNullOrEmpty(videoContinuationData.value)
    case 'shorts':
      return !isNullOrEmpty(shortContinuationData.value)
    case 'live':
      return !isNullOrEmpty(liveContinuationData.value)
    case 'releases':
      return !isNullOrEmpty(releaseContinuationData.value)
    case 'podcasts':
      return !isNullOrEmpty(podcastContinuationData.value)
    case 'courses':
      return !isNullOrEmpty(coursesContinuationData.value)
    case 'playlists':
      return !isNullOrEmpty(playlistContinuationData.value)
    case 'community':
      return !isNullOrEmpty(communityContinuationData.value)
    case 'search':
      return !isNullOrEmpty(searchContinuationData.value)
    default:
      return false
  }
})

function handleFetchMore() {
  switch (currentTab.value) {
    case 'videos':
      if (process.env.SUPPORTS_LOCAL_API && apiUsed === 'local') {
        getChannelVideosLocalMore()
      } else {
        channelInvidiousVideos()
      }
      break
    case 'shorts':
      if (process.env.SUPPORTS_LOCAL_API && apiUsed === 'local') {
        getChannelShortsLocalMore()
      } else {
        channelInvidiousShorts()
      }
      break
    case 'live':
      if (process.env.SUPPORTS_LOCAL_API && apiUsed === 'local') {
        getChannelLiveLocalMore()
      } else {
        channelInvidiousLive()
      }
      break
    case 'releases':
      if (process.env.SUPPORTS_LOCAL_API && apiUsed === 'local') {
        getChannelReleasesLocalMore()
      } else {
        channelInvidiousReleasesMore()
      }
      break
    case 'podcasts':
      if (process.env.SUPPORTS_LOCAL_API && apiUsed === 'local') {
        getChannelPodcastsLocalMore()
      } else {
        channelInvidiousPodcastsMore()
      }
      break
    case 'courses':
      if (process.env.SUPPORTS_LOCAL_API && apiUsed === 'local') {
        getChannelCoursesLocalMore()
      } else {
        channelInvidiousCoursesMore()
      }
      break
    case 'playlists':
      if (process.env.SUPPORTS_LOCAL_API && apiUsed === 'local') {
        getChannelPlaylistsLocalMore()
      } else {
        getPlaylistsInvidiousMore()
      }
      break
    case 'search':
      if (process.env.SUPPORTS_LOCAL_API && apiUsed === 'local') {
        searchChannelLocal()
      } else {
        searchChannelInvidious()
      }
      break
    case 'community':
      if (process.env.SUPPORTS_LOCAL_API && apiUsed === 'local') {
        getCommunityPostsLocalMore()
      } else {
        getCommunityPostsInvidious()
      }
      break
    default:
      console.error(currentTab.value)
  }
}

function changeTab(tab) {
  // `newTabNode` can be `null` when `tab` === "search"
  const newTabNode = document.getElementById(`${tab}Tab`)
  currentTab.value = tab

  if (newTabNode != null) {
    newTabNode.focus()
    store.commit('setOutlinesHidden', false)
  }
}

function handleSubscription() {
  // We can't cache the shorts data as YouTube doesn't return published dates on the shorts channel tab

  if (videoSortBy.value === 'newest') {
    store.dispatch('updateSubscriptionVideosCacheByChannel', {
      channelId: id.value,
      videos: latestVideos.value
    })
  }

  if (liveSortBy.value === 'newest') {
    store.dispatch('updateSubscriptionLiveCacheByChannel', {
      channelId: id.value,
      videos: latestLive.value
    })
  }

  store.dispatch('updateSubscriptionPostsCacheByChannel', {
    channelId: id.value,
    posts: latestCommunityPosts.value
  })
}

function filterWatchedArray(videos) {
  const historyCache = store.getters.getHistoryCacheById
  return videos.filter(video => historyCache[video.videoId] === undefined)
}
</script>

<style scoped src="./Channel.css" />
