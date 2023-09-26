<template>
  <div>
    <ft-card class="card">
      <h2>{{ $t("Subscriptions.Subscriptions") }}</h2>
      <ft-flex-box
        class="subscriptionTabs"
        role="tablist"
        :aria-label="$t('Subscriptions.Subscriptions Tabs')"
      >
        <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
        <div
          v-if="!hideSubscriptionsVideos"
          ref="videos"
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
          ref="shorts"
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
          ref="live"
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
          ref="community"
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
      </ft-flex-box>
      <subscriptions-videos
        v-if="currentTab === 'videos'"
        id="subscriptionsPanel"
        role="tabpanel"
      />
      <subscriptions-shorts
        v-else-if="currentTab === 'shorts'"
        id="subscriptionsPanel"
        role="tabpanel"
      />
      <subscriptions-live
        v-else-if="currentTab === 'live'"
        id="subscriptionsPanel"
        role="tabpanel"
      />
      <subscriptions-community
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
    </ft-card>
  </div>
</template>

<script src="./Subscriptions.js" />
<style scoped src="./Subscriptions.css" />
