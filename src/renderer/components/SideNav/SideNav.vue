<template>
  <FtFlexBox
    class="sideNav"
    :class="[{closed: !isOpen}, applyHiddenLabels]"
    role="navigation"
  >
    <div
      class="inner"
      :class="applyHiddenLabels"
    >
      <router-link
        class="navOption topNavOption mobileShow "
        role="button"
        to="/subscriptions"
        :title="$t('Subscriptions.Subscriptions')"
      >
        <div
          class="thumbnailContainer"
        >
          <FontAwesomeIcon
            :icon="['fas', 'rss']"
            class="navIcon"
            :class="applyNavIconExpand"
            fixed-width
          />
        </div>
        <p
          v-if="!hideText"
          class="navLabel"
        >
          {{ $t("Subscriptions.Subscriptions") }}
        </p>
      </router-link>
      <router-link
        class="navOption mobileHidden"
        role="button"
        to="/subscribedchannels"
        :title="$t('Channels.Channels')"
      >
        <div
          class="thumbnailContainer"
        >
          <FontAwesomeIcon
            :icon="['fas', 'user-check']"
            class="navIcon"
            :class="applyNavIconExpand"
            fixed-width
          />
        </div>
        <p
          v-if="!hideText"
          class="navLabel"
        >
          {{ $t("Channels.Channels") }}
        </p>
      </router-link>
      <router-link
        v-if="!hideTrendingVideos"
        class="navOption mobileHidden"
        role="button"
        to="/trending"
        :title="$t('Trending.Trending')"
      >
        <div
          class="thumbnailContainer"
        >
          <FontAwesomeIcon
            :icon="['fas', 'fire']"
            class="navIcon"
            :class="applyNavIconExpand"
            fixed-width
          />
        </div>
        <p
          v-if="!hideText"
          class="navLabel"
        >
          {{ $t("Trending.Trending") }}
        </p>
      </router-link>
      <router-link
        v-if="!hidePopularVideos && (backendFallback || backendPreference === 'invidious')"
        class="navOption mobileHidden"
        role="button"
        to="/popular"
        :title="$t('Most Popular')"
      >
        <div
          class="thumbnailContainer"
        >
          <FontAwesomeIcon
            :icon="['fas', 'users']"
            class="navIcon"
            :class="applyNavIconExpand"
            fixed-width
          />
        </div>
        <p
          v-if="!hideText"
          class="navLabel"
        >
          {{ $t("Most Popular") }}
        </p>
      </router-link>
      <router-link
        v-if="!hidePlaylists"
        class="navOption mobileShow"
        role="button"
        to="/userplaylists"
        :title="$t('Playlists')"
      >
        <div
          class="thumbnailContainer"
        >
          <FontAwesomeIcon
            :icon="['fas', 'bookmark']"
            class="navIcon"
            :class="applyNavIconExpand"
            fixed-width
          />
        </div>
        <p
          v-if="!hideText"
          class="navLabel"
        >
          {{ $t("Playlists") }}
        </p>
      </router-link>
      <SideNavMoreOptions />
      <router-link
        class="navOption mobileShow"
        role="button"
        to="/history"
        :title="historyTitle"
      >
        <div
          class="thumbnailContainer"
        >
          <FontAwesomeIcon
            :icon="['fas', 'history']"
            class="navIcon"
            :class="applyNavIconExpand"
            fixed-width
          />
        </div>
        <p
          v-if="!hideText"
          class="navLabel"
        >
          {{ $t("History.History") }}
        </p>
      </router-link>
      <hr>
      <router-link
        class="navOption mobileShow smallMobileOnlyHidden"
        role="button"
        to="/settings"
        :title="settingsTitle"
      >
        <div
          class="thumbnailContainer"
        >
          <FontAwesomeIcon
            :icon="['fas', 'sliders-h']"
            class="navIcon"
            :class="applyNavIconExpand"
            fixed-width
          />
        </div>
        <p
          v-if="!hideText"
          class="navLabel"
        >
          {{ $t('Settings.Settings') }}
        </p>
      </router-link>
      <router-link
        class="navOption mobileHidden"
        role="button"
        to="/about"
        :title="$t('About.About')"
      >
        <div
          class="thumbnailContainer"
        >
          <FontAwesomeIcon
            :icon="['fas', 'info-circle']"
            class="navIcon"
            :class="applyNavIconExpand"
            fixed-width
          />
        </div>
        <p
          v-if="!hideText"
          class="navLabel"
        >
          {{ $t("About.About") }}
        </p>
      </router-link>
      <hr>
      <div
        v-if="!hideActiveSubscriptions"
        class="mobileHidden"
      >
        <router-link
          v-for="channel in activeSubscriptions"
          :key="channel.id"
          :to="`/channel/${channel.id}`"
          class="navChannel channelLink mobileHidden"
          :title="channel.name"
          role="button"
        >
          <div
            class="thumbnailContainer"
          >
            <img
              v-if="channel.thumbnail != null"
              class="channelThumbnail"
              height="35"
              width="35"
              loading="lazy"
              :src="channel.thumbnail"
              :alt="isOpen ? '' : channel.name"
            >
            <FontAwesomeIcon
              v-else
              class="channelThumbnail noThumbnail"
              :icon="['fas', 'circle-user']"
            />
          </div>
          <p
            v-if="isOpen"
            class="navLabel"
          >
            {{ channel.name }}
          </p>
        </router-link>
      </div>
    </div>
  </FtFlexBox>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'

import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import SideNavMoreOptions from '../SideNavMoreOptions/SideNavMoreOptions.vue'

import store from '../../store/index'

import { youtubeImageUrlToInvidious } from '../../helpers/api/invidious'
import { deepCopy, localizeAndAddKeyboardShortcutToActionTitle } from '../../helpers/utils'
import { KeyboardShortcuts } from '../../../constants'

const { locale, t } = useI18n()

/** @type {import('vue').ComputedRef<boolean>} */
const isOpen = computed(() => {
  return store.getters.getIsSideNavOpen
})

/** @type {import('vue').ComputedRef<boolean>} */
const backendFallback = computed(() => {
  return store.getters.getBackendFallback
})

/** @type {import('vue').ComputedRef<'local' | 'invidious'>} */
const backendPreference = computed(() => {
  return store.getters.getBackendPreference
})

/** @type {import('vue').ComputedRef<string>} */
const currentInvidiousInstanceUrl = computed(() => {
  return store.getters.getCurrentInvidiousInstanceUrl
})

/** @type {import('vue').ComputedRef<object>} */
const activeProfile = computed(() => {
  return store.getters.getActiveProfile
})

const activeSubscriptions = computed(() => {
  /** @type {any[]} */
  const subscriptions = deepCopy(activeProfile.value.subscriptions)

  subscriptions.forEach(channel => {
    // Change thumbnail size to 35x35, as that's the size we display it
    // so we don't need to download a bigger image (the default is 176x176)
    channel.thumbnail = channel.thumbnail?.replace(/=s\d+/, '=s35')
  })

  const locale_ = locale.value
  subscriptions.sort((a, b) => {
    return a.name?.toLowerCase().localeCompare(b.name?.toLowerCase(), locale_)
  })

  if (backendPreference.value === 'invidious') {
    const instanceUrl = currentInvidiousInstanceUrl.value

    subscriptions.forEach((channel) => {
      channel.thumbnail = youtubeImageUrlToInvidious(channel.thumbnail, instanceUrl)
    })
  }

  return subscriptions
})

/** @type {import('vue').ComputedRef<boolean>} */
const hidePopularVideos = computed(() => {
  return store.getters.getHidePopularVideos
})

/** @type {import('vue').ComputedRef<boolean>} */
const hidePlaylists = computed(() => {
  return store.getters.getHidePlaylists
})

/** @type {import('vue').ComputedRef<boolean>} */
const hideTrendingVideos = computed(() => {
  return store.getters.getHideTrendingVideos
})

/** @type {import('vue').ComputedRef<boolean>} */
const hideActiveSubscriptions = computed(() => {
  return store.getters.getHideActiveSubscriptions
})

/** @type {import('vue').ComputedRef<boolean>} */
const hideText = computed(() => {
  return !isOpen.value && store.getters.getHideLabelsSideBar
})

const applyNavIconExpand = computed(() => {
  return {
    navIconExpand: hideText.value
  }
})

const applyHiddenLabels = computed(() => {
  return {
    hiddenLabels: hideText.value
  }
})

const historyTitle = computed(() => {
  const shortcut = process.platform === 'darwin'
    ? KeyboardShortcuts.APP.GENERAL.NAVIGATE_TO_HISTORY_MAC
    : KeyboardShortcuts.APP.GENERAL.NAVIGATE_TO_HISTORY

  return localizeAndAddKeyboardShortcutToActionTitle(
    t('History.History'),
    shortcut
  )
})

const settingsTitle = computed(() => {
  return localizeAndAddKeyboardShortcutToActionTitle(
    t('Settings.Settings'),
    KeyboardShortcuts.APP.GENERAL.NAVIGATE_TO_SETTINGS
  )
})
</script>

<style scoped src="./SideNav.css" />
