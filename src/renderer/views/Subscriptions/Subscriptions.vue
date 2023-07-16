<template>
  <div>
    <ft-card class="card">
      <h3>{{ $t("Subscriptions.Subscriptions") }}</h3>
      <ft-flex-box
        class="subscriptionTabs"
        role="tablist"
        :aria-label="$t('Subscriptions.Subscriptions Tabs')"
      >
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
          @keydown.left="focusTab($event, 'shorts')"
          @keydown.right="focusTab($event, 'live')"
        >
          {{ $t("Global.Videos").toUpperCase() }}
        </div>
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
          @keydown.left="focusTab($event, 'live')"
          @keydown.right="focusTab($event, 'videos')"
        >
          {{ $t("Global.Shorts").toUpperCase() }}
        </div>
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
          @keydown.left="focusTab($event, 'videos')"
          @keydown.right="focusTab($event, 'shorts')"
        >
          {{ $t("Global.Live").toUpperCase() }}
        </div>
      </ft-flex-box>
      <subscriptions-videos
        v-if="currentTab === 'videos'"
        id="subscriptionsPanel"
        role="tabpanel"
      />
      <subscriptions-shorts
        v-if="currentTab === 'shorts'"
        id="subscriptionsPanel"
        role="tabpanel"
      />
      <subscriptions-live
        v-if="currentTab === 'live'"
        id="subscriptionsPanel"
        role="tabpanel"
      />
      <p v-if="currentTab === null">
        {{ $t("Subscriptions['All subscription tabs are hidden. To see content here, please unhide some tabs in the Channel Page section in Distraction Free Settings.']") }}
      </p>
    </ft-card>
  </div>
</template>

<script src="./Subscriptions.js" />
<style scoped src="./Subscriptions.css" />
