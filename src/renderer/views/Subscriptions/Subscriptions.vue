<template>
  <div>
    <ft-card class="card">
      <h3>{{ $t("Subscriptions.Subscriptions") }}</h3>
      <ft-flex-box
        class="subscriptionTabs"
        role="tablist"
        :aria-label="$t('Trending.Trending Tabs')"
      >
        <div
          ref="videos"
          class="tab"
          role="tab"
          :aria-selected="String(currentTab === 'videos')"
          aria-controls="trendingPanel"
          :tabindex="currentTab === 'videos' ? 0 : -1"
          :class="{ selectedTab: currentTab === 'videos' }"
          @click="changeTab('videos')"
          @keydown.space.enter.prevent="changeTab('videos')"
          @keydown.left="focusTab($event, 'shorts')"
          @keydown.right="focusTab($event, 'live')"
        >
          {{ $t("Subscriptions.Tabs.Videos").toUpperCase() }}
        </div>
        <div
          ref="live"
          class="tab"
          role="tab"
          :aria-selected="String(currentTab === 'live')"
          aria-controls="trendingPanel"
          :tabindex="currentTab === 'live' ? 0 : -1"
          :class="{ selectedTab: currentTab === 'live' }"
          @click="changeTab('live')"
          @keydown.space.enter.prevent="changeTab('live')"
          @keydown.left="focusTab($event, 'videos')"
          @keydown.right="focusTab($event, 'shorts')"
        >
          {{ $t("Subscriptions.Tabs.Live").toUpperCase() }}
        </div>
        <div
          ref="shorts"
          class="tab"
          role="tab"
          :aria-selected="String(currentTab === 'shorts')"
          aria-controls="trendingPanel"
          :tabindex="currentTab === 'shorts' ? 0 : -1"
          :class="{ selectedTab: currentTab === 'shorts' }"
          @click="changeTab('shorts')"
          @keydown.space.enter.prevent="changeTab('shorts')"
          @keydown.left="focusTab($event, 'live')"
          @keydown.right="focusTab($event, 'videos')"
        >
          {{ $t("Subscriptions.Tabs.Shorts").toUpperCase() }}
        </div>
      </ft-flex-box>
      <subscriptions-videos v-if="currentTab === 'videos'" />
      <subscriptions-live v-if="currentTab === 'live'" />
      <subscriptions-shorts v-if="currentTab === 'shorts'" />
    </ft-card>
  </div>
</template>

<script src="./Subscriptions.js" />
<style scoped src="./Subscriptions.css" />
