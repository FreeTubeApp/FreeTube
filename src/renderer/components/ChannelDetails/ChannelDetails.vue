<template>
  <FtCard>
    <div
      class="bannerContainer"
      :class="{
        default: !bannerUrl
      }"
      :style="{ '--banner-url': `url('${bannerUrl}')` }"
    />

    <div
      class="infoContainer"
    >
      <div
        class="info"
        :class="{ infoHasError: hasErrorMessage }"
      >
        <div
          class="thumbnailContainer"
        >
          <img
            v-if="thumbnailUrl"
            class="thumbnail"
            :src="thumbnailUrl"
            alt=""
          >
          <FontAwesomeIcon
            v-else
            class="thumbnail"
            :icon="['fas', 'circle-user']"
          />
          <div
            class="lineContainer"
          >
            <h1
              class="name"
            >
              {{ name }}
            </h1>

            <p
              v-if="subCount !== null && !hideChannelSubscriptions"
              class="subCount"
            >
              {{ $tc('Global.Counts.Subscriber Count', subCount, { count: formattedSubCount }) }}
            </p>
          </div>
        </div>

        <div class="infoActionsContainer">
          <FtShareButton
            v-if="!hideSharingActions && showShareMenu"
            :id="id"
            share-target-type="Channel"
            class="shareIcon"
          />

          <FtSubscribeButton
            v-if="!hideUnsubscribeButton && (!hasErrorMessage || isSubscribed)"
            :channel-id="id"
            :channel-name="name"
            :channel-thumbnail="thumbnailUrl"
            @subscribed="subscribed"
          />
        </div>
      </div>

      <FtFlexBox
        v-if="!hasErrorMessage"
        class="infoTabs"
      >
        <div
          class="tabs"
          role="tablist"
          :aria-label="$t('Channel.Channel Tabs')"
        >
          <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
          <div
            v-if="visibleTabs.includes('home')"
            id="homeTab"
            class="tab"
            :class="{ selectedTab: currentTab === 'home' }"
            role="tab"
            :aria-selected="String(currentTab === 'home')"
            aria-controls="homePanel"
            :tabindex="(currentTab === 'home' || currentTab === 'search') ? 0 : -1"
            @click="changeTab('home')"
            @keydown.left.right="focusTab('home', $event)"
            @keydown.enter.space.prevent="changeTab('home')"
          >
            {{ $t("Channel.Home.Home").toUpperCase() }}
          </div>
          <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
          <div
            v-if="visibleTabs.includes('videos')"
            id="videosTab"
            class="tab"
            :class="{ selectedTab: currentTab === 'videos' }"
            role="tab"
            :aria-selected="String(currentTab === 'videos')"
            aria-controls="videoPanel"
            :tabindex="(currentTab === 'videos' || currentTab === 'search') ? 0 : -1"
            @click="changeTab('videos')"
            @keydown.left.right="focusTab('videos', $event)"
            @keydown.enter.space.prevent="changeTab('videos')"
          >
            {{ $t("Channel.Videos.Videos").toUpperCase() }}
          </div>
          <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
          <div
            v-if="visibleTabs.includes('shorts')"
            id="shortsTab"
            class="tab"
            :class="{ selectedTab: currentTab === 'shorts' }"
            role="tab"
            :aria-selected="String(currentTab === 'shorts')"
            aria-controls="shortPanel"
            :tabindex="currentTab === 'shorts' ? 0 : -1"
            @click="changeTab('shorts')"
            @keydown.left.right="focusTab('shorts', $event)"
            @keydown.enter.space.prevent="changeTab('shorts')"
          >
            {{ $t("Global.Shorts").toUpperCase() }}
          </div>
          <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
          <div
            v-if="visibleTabs.includes('live')"
            id="liveTab"
            class="tab"
            :class="{ selectedTab: currentTab === 'live' }"
            role="tab"
            :aria-selected="String(currentTab === 'live')"
            aria-controls="livePanel"
            :tabindex="currentTab === 'live' ? 0 : -1"
            @click="changeTab('live')"
            @keydown.left.right="focusTab('live', $event)"
            @keydown.enter.space.prevent="changeTab('live')"
          >
            {{ $t("Channel.Live.Live").toUpperCase() }}
          </div>
          <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
          <div
            v-if="visibleTabs.includes('releases')"
            id="releasesTab"
            class="tab"
            role="tab"
            :aria-selected="String(currentTab === 'releases')"
            aria-controls="releasePanel"
            :tabindex="currentTab === 'releases' ? 0 : -1"
            :class="{ selectedTab: currentTab === 'releases' }"
            @click="changeTab('releases')"
            @keydown.left.right="focusTab('releases', $event)"
            @keydown.enter.space.prevent="changeTab('releases')"
          >
            {{ $t("Channel.Releases.Releases").toUpperCase() }}
          </div>
          <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
          <div
            v-if="visibleTabs.includes('podcasts')"
            id="podcastsTab"
            class="tab"
            role="tab"
            :aria-selected="String(currentTab === 'podcasts')"
            aria-controls="podcastPanel"
            :tabindex="currentTab === 'podcasts' ? 0 : -1"
            :class="{ selectedTab: currentTab === 'podcasts' }"
            @click="changeTab('podcasts')"
            @keydown.left.right="focusTab('podcasts', $event)"
            @keydown.enter.space.prevent="changeTab('podcasts')"
          >
            {{ $t("Channel.Podcasts.Podcasts").toUpperCase() }}
          </div>
          <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
          <div
            v-if="visibleTabs.includes('courses')"
            id="coursesTab"
            class="tab"
            role="tab"
            :aria-selected="String(currentTab === 'courses')"
            aria-controls="coursesPanel"
            :tabindex="currentTab === 'courses' ? 0 : -1"
            :class="{ selectedTab: currentTab === 'courses' }"
            @click="changeTab('courses')"
            @keydown.left.right="focusTab('courses', $event)"
            @keydown.enter.space.prevent="changeTab('courses')"
          >
            {{ $t("Channel.Courses.Courses").toUpperCase() }}
          </div>
          <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
          <div
            v-if="visibleTabs.includes('playlists')"
            id="playlistsTab"
            class="tab"
            role="tab"
            :aria-selected="String(currentTab === 'playlists')"
            aria-controls="playlistPanel"
            :tabindex="currentTab === 'playlists' ? 0 : -1"
            :class="{ selectedTab: currentTab === 'playlists' }"
            @click="changeTab('playlists')"
            @keydown.left.right="focusTab('playlists', $event)"
            @keydown.enter.space.prevent="changeTab('playlists')"
          >
            {{ $t("Channel.Playlists.Playlists").toUpperCase() }}
          </div>
          <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
          <div
            v-if="visibleTabs.includes('community')"
            id="communityTab"
            class="tab"
            role="tab"
            :aria-selected="String(currentTab === 'community')"
            aria-controls="communityPanel"
            :tabindex="currentTab === 'community' ? 0 : -1"
            :class="{ selectedTab: currentTab === 'community' }"
            @click="changeTab('community')"
            @keydown.left.right="focusTab('community', $event)"
            @keydown.enter.space.prevent="changeTab('community')"
          >
            {{ $t("Global.Posts").toUpperCase() }}
          </div>
          <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
          <div
            id="aboutTab"
            class="tab"
            role="tab"
            :aria-selected="String(currentTab === 'about')"
            aria-controls="aboutPanel"
            :tabindex="currentTab === 'about' ? 0 : -1"
            :class="{ selectedTab: currentTab === 'about' }"
            @click="changeTab('about')"
            @keydown.left.right="focusTab('about', $event)"
            @keydown.enter.space.prevent="changeTab('about')"
          >
            {{ $t("Channel.About.About").toUpperCase() }}
          </div>
        </div>

        <FtInput
          v-if="showSearchBar"
          ref="searchBar"
          :placeholder="$t('Channel.Search Channel')"
          :value="query"
          :show-clear-text-button="true"
          class="channelSearch"
          :maxlength="255"
          @click="search"
        />
      </FtFlexBox>
    </div>
  </FtCard>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import FtCard from '../ft-card/ft-card.vue'
import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtShareButton from '../FtShareButton/FtShareButton.vue'
import FtSubscribeButton from '../FtSubscribeButton/FtSubscribeButton.vue'
import FtInput from '../ft-input/ft-input.vue'

import store from '../../store/index'

import { ctrlFHandler, formatNumber } from '../../helpers/utils'

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    default: null
  },
  bannerUrl: {
    type: String,
    default: null
  },
  hasErrorMessage: {
    type: Boolean,
    default: false
  },
  thumbnailUrl: {
    type: String,
    default: null
  },
  subCount: {
    type: Number,
    default: null
  },
  showShareMenu: {
    type: Boolean,
    default: true
  },
  showSearchBar: {
    type: Boolean,
    default: true
  },
  isSubscribed: {
    type: Boolean,
    default: false
  },
  visibleTabs: {
    type: Array,
    default: () => ([])
  },
  currentTab: {
    type: String,
    default: 'videos'
  },
  query: {
    type: String,
    default: ''
  },
})

const emit = defineEmits(['change-tab', 'search', 'subscribed'])

/** @type {import('vue').ComputedRef<boolean>} */
const hideChannelSubscriptions = computed(() => {
  return store.getters.getHideChannelSubscriptions
})

/** @type {import('vue').ComputedRef<boolean>} */
const hideSharingActions = computed(() => {
  return store.getters.getHideSharingActions
})

/** @type {import('vue').ComputedRef<boolean>} */
const hideUnsubscribeButton = computed(() => {
  return store.getters.getHideUnsubscribeButton
})

const formattedSubCount = computed(() => {
  if (hideChannelSubscriptions.value) {
    return null
  }
  return formatNumber(props.subCount)
})

function subscribed() {
  emit('subscribed')
}

/**
 * @param {string} tab
 */
function changeTab(tab) {
  emit('change-tab', tab)
}

/**
 * @param {string} currentTab
 * @param {KeyboardEvent} event
 */
function focusTab(currentTab, event) {
  if (event.altKey) {
    return
  }

  event.preventDefault()

  const visibleTabs = props.visibleTabs

  const index = visibleTabs.indexOf(currentTab)

  // focus left or right tab with wrap around
  const tab = (event.key === 'ArrowLeft')
    ? visibleTabs[(index > 0 ? index : visibleTabs.length) - 1]
    : visibleTabs[(index + 1) % visibleTabs.length]

  document.getElementById(`${tab}Tab`).focus()
  store.dispatch('showOutlines')
}

/**
 * @param {string} query
 */
function search(query) {
  emit('search', query)
}

const searchBar = ref(null)

/**
 * @param {KeyboardEvent} event
 */
function keyboardShortcutHandler(event) {
  ctrlFHandler(event, searchBar.value)
}

onMounted(() => {
  document.addEventListener('keydown', keyboardShortcutHandler)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', keyboardShortcutHandler)
})
</script>

<style scoped src="./ChannelDetails.css" />
