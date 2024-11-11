<template>
  <div>
    <FtCard class="card">
      <h2>{{ $t("Subscriptions.Subscriptions") }}</h2>
      <FtFlexBox
        class="subscriptionTabs"
        role="tablist"
        :aria-label="$t('Subscriptions.Subscriptions Tabs')"
      >
        <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
        <div
          v-if="!hideSubscriptionsVideos"
          ref="videosTab"
          class="tab"
          role="tab"
          :aria-selected="String(currentTab === 'videos')"
          aria-controls="subscriptionsPanel"
          :tabindex="currentTab === 'videos' ? 0 : -1"
          :class="{ selectedTab: currentTab === 'videos' }"
          @click="changeTab('videos')"
          @keydown.space.enter.prevent="changeTab('videos')"
          @keydown.left.right="focusTab($event, 'videos')"
        >
          {{ $t("Global.Videos").toUpperCase() }}
        </div>
        <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
        <div
          v-if="!hideSubscriptionsShorts"
          ref="shortsTab"
          class="tab"
          role="tab"
          :aria-selected="String(currentTab === 'shorts')"
          aria-controls="subscriptionsPanel"
          :tabindex="currentTab === 'shorts' ? 0 : -1"
          :class="{ selectedTab: currentTab === 'shorts' }"
          @click="changeTab('shorts')"
          @keydown.space.enter.prevent="changeTab('shorts')"
          @keydown.left.right="focusTab($event, 'shorts')"
        >
          {{ $t("Global.Shorts").toUpperCase() }}
        </div>
        <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
        <div
          v-if="!hideSubscriptionsLive"
          ref="liveTab"
          class="tab"
          role="tab"
          :aria-selected="String(currentTab === 'live')"
          aria-controls="subscriptionsPanel"
          :tabindex="currentTab === 'live' ? 0 : -1"
          :class="{ selectedTab: currentTab === 'live' }"
          @click="changeTab('live')"
          @keydown.space.enter.prevent="changeTab('live')"
          @keydown.left.right="focusTab($event, 'live')"
        >
          {{ $t("Global.Live").toUpperCase() }}
        </div>
        <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
        <div
          v-if="visibleTabs.includes('community')"
          ref="communityTab"
          class="tab"
          role="tab"
          :aria-selected="String(currentTab === 'community')"
          aria-controls="subscriptionsPanel"
          :tabindex="currentTab === 'community' ? 0 : -1"
          :class="{ selectedTab: currentTab === 'community' }"
          @click="changeTab('community')"
          @keydown.space.enter.prevent="changeTab('community')"
          @keydown.left.right="focusTab($event, 'community')"
        >
          {{ $t("Global.Community").toUpperCase() }}
        </div>
      </FtFlexBox>
      <SubscriptionsVideos
        v-if="currentTab === 'videos'"
        id="subscriptionsPanel"
        role="tabpanel"
      />
      <SubscriptionsShorts
        v-else-if="currentTab === 'shorts'"
        id="subscriptionsPanel"
        role="tabpanel"
      />
      <SubscriptionsLive
        v-else-if="currentTab === 'live'"
        id="subscriptionsPanel"
        role="tabpanel"
      />
      <SubscriptionsCommunity
        v-else-if="currentTab === 'community'"
        id="subscriptionsPanel"
        role="tabpanel"
      />
      <p v-else-if="currentTab === null">
        {{ $t("Subscriptions.All Subscription Tabs Hidden", {
          subsection: $t('Settings.Distraction Free Settings.Sections.Subscriptions Page'),
          settingsSection: $t('Settings.Distraction Free Settings.Distraction Free Settings')
        }) }}
      </p>
    </FtCard>
  </div>
</template>

<script setup>
import { computed, onBeforeMount, ref, watch } from 'vue'

import SubscriptionsVideos from '../../components/subscriptions-videos/subscriptions-videos.vue'
import SubscriptionsLive from '../../components/subscriptions-live/subscriptions-live.vue'
import SubscriptionsShorts from '../../components/subscriptions-shorts/subscriptions-shorts.vue'
import SubscriptionsCommunity from '../../components/subscriptions-community/subscriptions-community.vue'

import FtCard from '../../components/ft-card/ft-card.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import store from '../../store/index'

/** @typedef {'videos' | 'shorts' | 'live' | 'community'} SubscriptionTab */

/** @type {import('vue').Ref<SubscriptionTab | null>} */
const currentTab = ref('videos')
/** @type {import('vue').Ref<HTMLDivElement | null>} */
const videosTab = ref(null)
/** @type {import('vue').Ref<HTMLDivElement | null>} */
const shortsTab = ref(null)
/** @type {import('vue').Ref<HTMLDivElement | null>} */
const liveTab = ref(null)
/** @type {import('vue').Ref<HTMLDivElement | null>} */
const communityTab = ref(null)

/** @type {import('vue').ComputedRef<boolean>} */
const hideSubscriptionsVideos = computed(() => {
  return store.getters.getHideSubscriptionsVideos
})

/** @type {import('vue').ComputedRef<boolean>} */
const hideSubscriptionsShorts = computed(() => {
  return store.getters.getHideSubscriptionsShorts
})

/** @type {import('vue').ComputedRef<boolean>} */
const hideSubscriptionsLive = computed(() => {
  return store.getters.getHideLiveStreams || store.getters.getHideSubscriptionsLive
})

/** @type {import('vue').ComputedRef<boolean>} */
const hideSubscriptionsCommunity = computed(() => {
  return store.getters.getHideSubscriptionsCommunity
})

/** @type {import('vue').ComputedRef<object>} */
const activeProfile = computed(() => {
  return store.getters.getActiveProfile
})

/** @type {import('vue').ComputedRef<Array>} */
const activeSubscriptionList = computed(() => {
  return activeProfile.value.subscriptions
})

/** @type {import('vue').ComputedRef<boolean>} */
const useRssFeeds = computed(() => {
  return store.getters.getUseRssFeeds
})

/** @type {import('vue').ComputedRef<Array<'videos' | 'shorts' | 'live' | 'community'>} */
const visibleTabs = computed(() => {
  const tabs = []

  if (!hideSubscriptionsVideos.value) {
    tabs.push('videos')
  }

  if (!hideSubscriptionsShorts.value) {
    tabs.push('shorts')
  }

  if (!hideSubscriptionsLive.value) {
    tabs.push('live')
  }

  // community does not support rss
  if (!hideSubscriptionsCommunity.value && !useRssFeeds.value && activeSubscriptionList.value.length < 125) {
    tabs.push('community')
  }

  return tabs
})

watch(currentTab,
/**
 * @param {SubscriptionTab} value
 */
  (value) => {
    if (value !== null) {
      // Save last used tab, restore when view mounted again
      sessionStorage.setItem('Subscriptions/currentTab', value)
    } else {
      sessionStorage.removeItem('Subscriptions/currentTab')
    }
  }
)

watch(visibleTabs,
/**
 * @param {Array<SubscriptionTab>} newValue
 */
  (newValue) => {
    if (newValue.length === 0) {
      currentTab.value = null
    } else if (!newValue.includes(currentTab.value)) {
      currentTab.value = newValue[0]
    }
  }
)

onBeforeMount(async () => {
  if (visibleTabs.value.length === 0) {
    currentTab.value = null
  } else {
    // Restore currentTab
    const lastCurrentTabId = sessionStorage.getItem('Subscriptions/currentTab')
    if (lastCurrentTabId !== null) {
      changeTab(lastCurrentTabId)
    } else if (!visibleTabs.value.includes(currentTab.value)) {
      currentTab.value = visibleTabs.value[0]
    }
  }
})

/**
 * @param {SubscriptionTab} tab
 */
function changeTab(tab) {
  if (tab === currentTab.value) {
    return
  }

  if (visibleTabs.value.includes(tab)) {
    currentTab.value = tab
  } else {
    // First visible tab or no tab
    currentTab.value = visibleTabs.value.length > 0 ? visibleTabs.value[0] : null
  }
}

/**
 * @param {KeyboardEvent} event
 * @param {SubscriptionTab} currentTab
 */
function focusTab(event, currentTab) {
  if (!event.altKey) {
    event.preventDefault()

    if (visibleTabs.value.length === 1) {
      store.dispatch('showOutlines')
      return
    }

    let index = visibleTabs.value.indexOf(currentTab)

    if (event.key === 'ArrowLeft') {
      index--
    } else {
      index++
    }

    if (index < 0) {
      index = visibleTabs.value.length - 1
    } else if (index > visibleTabs.value.length - 1) {
      index = 0
    }

    switch (visibleTabs.value[index]) {
      case 'videos':
        videosTab.value.focus()
        break
      case 'shorts':
        shortsTab.value.focus()
        break
      case 'live':
        liveTab.value.focus()
        break
      case 'community':
        communityTab.value.focus()
        break
    }
    store.dispatch('showOutlines')
  }
}

</script>
<style scoped src="./Subscriptions.css" />
