<template>
  <div>
    <ft-loader
      v-if="isLoading"
      :fullscreen="true"
    />
    <ft-card
      v-else
      class="card"
    >
      <h2>
        <font-awesome-icon
          :icon="['fas', 'fire']"
          class="trendingIcon"
          fixed-width
        />
        {{ $t("Trending.Trending") }}
      </h2>
      <ft-flex-box
        class="trendingInfoTabs"
        role="tablist"
        :aria-label="$t('Trending.Trending Tabs')"
      >
        <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
        <div
          ref="default"
          class="tab"
          role="tab"
          :aria-selected="String(currentTab === 'default')"
          aria-controls="trendingPanel"
          :tabindex="currentTab === 'default' ? 0 : -1"
          :class="{ selectedTab: currentTab === 'default' }"
          @click="changeTab('default')"
          @keydown.space.enter.prevent="changeTab('default')"
          @keydown.left="focusTab($event, 'movies')"
          @keydown.right="focusTab($event, 'music')"
        >
          <font-awesome-icon
            :icon="['fas', 'fire']"
            class="trendingIcon"
            fixed-width
          />
          {{ $t("Trending.Default").toUpperCase() }}
        </div>
        <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
        <div
          ref="music"
          class="tab"
          role="tab"
          :aria-selected="String(currentTab === 'music')"
          aria-controls="trendingPanel"
          :tabindex="currentTab === 'music' ? 0 : -1"
          :class="{ selectedTab: currentTab === 'music' }"
          @click="changeTab('music')"
          @keydown.space.enter.prevent="changeTab('music')"
          @keydown.left="focusTab($event, 'default')"
          @keydown.right="focusTab($event, 'gaming')"
        >
          <font-awesome-icon
            :icon="['fas', 'music']"
            class="trendingIcon"
            fixed-width
          />
          {{ $t("Trending.Music").toUpperCase() }}
        </div>
        <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
        <div
          ref="gaming"
          class="tab"
          role="tab"
          :aria-selected="String(currentTab === 'gaming')"
          aria-controls="trendingPanel"
          :tabindex="currentTab === 'gaming' ? 0 : -1"
          :class="{ selectedTab: currentTab === 'gaming' }"
          @click="changeTab('gaming')"
          @keydown.space.enter.prevent="changeTab('gaming')"
          @keydown.left="focusTab($event, 'music')"
          @keydown.right="focusTab($event, 'movies')"
        >
          <font-awesome-icon
            :icon="['fas', 'gamepad']"
            class="trendingIcon"
            fixed-width
          />
          {{ $t("Trending.Gaming").toUpperCase() }}
        </div>
        <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
        <div
          ref="movies"
          class="tab"
          role="tab"
          :aria-selected="String(currentTab === 'movies')"
          aria-controls="trendingPanel"
          :tabindex="currentTab === 'movies' ? 0 : -1"
          :class="{ selectedTab: currentTab === 'movies' }"
          @click="changeTab('movies')"
          @keydown.space.enter.prevent="changeTab('movies')"
          @keydown.left="focusTab($event, 'gaming')"
          @keydown.right="focusTab($event, 'default')"
        >
          <font-awesome-icon
            :icon="['fas', 'film']"
            class="trendingIcon"
            fixed-width
          />
          {{ $t("Trending.Movies").toUpperCase() }}
        </div>
      </ft-flex-box>
      <ft-element-list
        id="trendingPanel"
        role="tabpanel"
        :data="shownResults"
      />
    </ft-card>
    <ft-refresh-widget
      :disable-refresh="isLoading"
      :last-refresh-timestamp="lastTrendingRefreshTimestamp"
      :title="$t('Trending.Trending')"
      @click="getTrendingInfo(true)"
    />
  </div>
</template>

<script src="./Trending.js" />
<style scoped src="./Trending.css" />
