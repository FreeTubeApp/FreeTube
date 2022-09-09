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
          id="defaultTab"
          class="tab"
          role="tab"
          aria-selected="true"
          aria-controls="trendingPanel"
          tabindex="0"
          :class="(currentTab=='default')?'selectedTab':''"
          @click="changeTab('default')"
          @keydown="changeTab('default', $event)"
        >
          {{ $t("Trending.Default").toUpperCase() }}
        </div>
        <div
          id="musicTab"
          class="tab"
          role="tab"
          aria-selected="false"
          aria-controls="trendingPanel"
          tabindex="-1"
          :class="(currentTab=='music')?'selectedTab':''"
          @click="changeTab('music')"
          @keydown="changeTab('music', $event)"
        >
          {{ $t("Trending.Music").toUpperCase() }}
        </div>
        <div
          id="gamingTab"
          class="tab"
          role="tab"
          aria-selected="false"
          aria-controls="trendingPanel"
          tabindex="-1"
          :class="(currentTab=='gaming')?'selectedTab':''"
          @click="changeTab('gaming')"
          @keydown="changeTab('gaming', $event)"
        >
          {{ $t("Trending.Gaming").toUpperCase() }}
        </div>
        <div
          id="moviesTab"
          class="tab"
          role="tab"
          aria-selected="false"
          aria-controls="trendingPanel"
          tabindex="-1"
          :class="(currentTab=='movies')?'selectedTab':''"
          @click="changeTab('movies')"
          @keydown="changeTab('movies', $event)"
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
