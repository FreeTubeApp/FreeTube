<template>
  <div
    ref="menuRef"
    class="sideNavMoreOptions"
  >
    <div
      class="navOption moreOptionNav"
      tabindex="0"
      role="button"
      aria-labelledby="moreNavLabel"
      :title="$t('More')"
      @click="openMoreOptions = !openMoreOptions"
      @keydown.space.prevent="openMoreOptions = !openMoreOptions"
      @keydown.enter.prevent="openMoreOptions = !openMoreOptions"
    >
      <FontAwesomeIcon
        :icon="['fas', 'ellipsis-h']"
        class="navIcon"
        :class="applyNavIconExpand"
      />
      <p
        v-if="!hideLabelsSideBar"
        id="moreNavLabel"
        class="navLabel"
      >
        {{ $t("More") }}
      </p>
    </div>
    <div
      v-if="openMoreOptions"
      class="moreOptionContainer"
    >
      <router-link
        class="navOption mobileHidden"
        :title="$t('Channels.Channels')"
        :aria-label="hideLabelsSideBar ? $t('Channels.Channels') : null"
        to="/subscribedchannels"
        @click="closeMenu"
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
          v-if="!hideLabelsSideBar"
          id="channelLabel"
          class="navLabel"
        >
          {{ $t("Channels.Channels") }}
        </p>
      </router-link>
      <router-link
        v-if="!hideTrendingVideos"
        class="navOption"
        :title="$t('Trending.Trending')"
        :aria-label="hideLabelsSideBar ? $t('Trending.Trending') : null"
        to="/trending"
        @click="closeMenu"
      >
        <FontAwesomeIcon
          :icon="['fas', 'fire']"
          class="navIcon"
          :class="applyNavIconExpand"
        />
        <p
          v-if="!hideLabelsSideBar"
          id="trendingNavLabel"
          class="navLabel"
        >
          {{ $t("Trending.Trending") }}
        </p>
      </router-link>
      <router-link
        v-if="popularVisible"
        class="navOption"
        :title="$t('Most Popular')"
        :aria-label="hideLabelsSideBar ? $t('Most Popular') : null"
        to="/popular"
        @click="closeMenu"
      >
        <FontAwesomeIcon
          :icon="['fas', 'users']"
          class="navIcon"
          :class="applyNavIconExpand"
        />
        <p
          v-if="!hideLabelsSideBar"
          id="mostPopularNavLabel"
          class="navLabel"
        >
          {{ $t("Most Popular") }}
        </p>
      </router-link>
      <router-link
        class="navOption"
        :title="$t('About.About')"
        :aria-label="hideLabelsSideBar ? $t('About.About') : null"
        to="/about"
        @click="closeMenu"
      >
        <FontAwesomeIcon
          :icon="['fas', 'info-circle']"
          class="navIcon"
          :class="applyNavIconExpand"
        />
        <p
          v-if="!hideLabelsSideBar"
          id="aboutNavLabel"
          class="navLabel"
        >
          {{ $t("About.About") }}
        </p>
      </router-link>
      <router-link
        class="navOption smallMobileOnlyShow"
        :title="$t('Settings.Settings')"
        :aria-label="hideLabelsSideBar ? $t('Settings.Settings') : null"
        to="/settings"
        @click="closeMenu"
      >
        <FontAwesomeIcon
          :icon="['fas', 'sliders-h']"
          class="navIcon"
          :class="applyNavIconExpand"
        />
        <p
          id="settingsNavLabel"
          class="navLabel"
        >
          {{ $t("Settings.Settings") }}
        </p>
      </router-link>
    </div>
    <router-link
      class="navOption mobileShow"
      :title="$t('History.History')"
      :aria-label="hideLabelsSideBar ? $t('History.History'): null"
      to="/history"
    >
      <FontAwesomeIcon
        :icon="['fas', 'history']"
        class="navIcon"
        :class="applyNavIconExpand"
      />
      <p
        id="historyNavLabel"
        class="navLabel"
      >
        {{ $t("History.History") }}
      </p>
    </router-link>
    <hr>
    <router-link
      class="navOption mobileShow"
      :title="$t('Settings.Settings')"
      :aria-label="hideLabelsSideBar ? $t('Settings.Settings') : null"
      to="/settings"
    >
      <FontAwesomeIcon
        :icon="['fas', 'sliders-h']"
        class="navIcon"
        :class="applyNavIconExpand"
      />
      <p
        id="settingsNavLabel"
        class="navLabel"
      >
        {{ $t("Settings.Settings") }}
      </p>
    </router-link>
    <router-link
      class="navOption mobileHidden"
      :title="$t('About.About')"
      to="/about"
      :aria-label="hideLabelsSideBar ? $t('About.About') : null"
    >
      <FontAwesomeIcon
        :icon="['fas', 'info-circle']"
        class="navIcon"
        :class="applyNavIconExpand"
      />
      <p
        v-if="!hideLabelsSideBar"
        class="navLabel"
      >
        {{ $t("About.About") }}
      </p>
    </router-link>
  </div>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import router from '../../router/index.js'

import store from '../../store/index'

const openMoreOptions = ref(false)

const menuRef = ref(null)

/** @type {import('vue').ComputedRef<boolean>} */
const hideTrendingVideos = computed(() => {
  return store.getters.getHideTrendingVideos
})

/** @type {import('vue').ComputedRef<boolean>} */
const hideLabelsSideBar = computed(() => {
  return store.getters.getHideLabelsSideBar
})

/** @type {import('vue').ComputedRef<boolean>} */
const popularVisible = computed(() => {
  return !store.getters.getHidePopularVideos &&
    (store.getters.getBackendFallback || store.getters.getBackendPreference === 'invidious')
})

const applyNavIconExpand = computed(() => {
  return {
    navIconExpand: hideLabelsSideBar.value
  }
})

function closeMenu() {
  openMoreOptions.value = false
}

function handleClickOutside(event) {
  if (openMoreOptions.value && menuRef.value && !menuRef.value.contains(event.target)) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  router.afterEach(() => {
    closeMenu()
  })
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped src="./SideNavMoreOptions.css" />
