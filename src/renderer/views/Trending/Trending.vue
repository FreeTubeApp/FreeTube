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
      <h3>{{ $t("Trending.Trending") }}</h3>
      <ft-flex-box
        class="trendingInfoTabs"
        role="tablist"
        :aria-label="$t('Trending.Trending Tabs')"
      >
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
          @keydown.left.prevent="focusTab('movies')"
          @keydown.right.prevent="focusTab('music')"
        >
          {{ $t("Trending.Default").toUpperCase() }}
        </div>
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
          @keydown.left.prevent="focusTab('default')"
          @keydown.right.prevent="focusTab('gaming')"
        >
          {{ $t("Trending.Music").toUpperCase() }}
        </div>
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
          @keydown.left.prevent="focusTab('music')"
          @keydown.right.prevent="focusTab('movies')"
        >
          {{ $t("Trending.Gaming").toUpperCase() }}
        </div>
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
          @keydown.left.prevent="focusTab('gaming')"
          @keydown.right.prevent="focusTab('default')"
        >
          {{ $t("Trending.Movies").toUpperCase() }}
        </div>
      </ft-flex-box>
      <ft-element-list
        id="trendingPanel"
        role="tabpanel"
        :data="shownResults"
      />
    </ft-card>
    <ft-icon-button
      v-if="!isLoading"
      :icon="['fas', 'sync']"
      class="floatingTopButton"
      :size="12"
      theme="primary"
      @click="getTrendingInfo"
    />
  </div>
</template>

<script src="./Trending.js" />
<style scoped src="./Trending.css" />
