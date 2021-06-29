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
      >
        <div
          class="tab"
          @click="changeTab('default')"
        >
          {{ $t("Trending.Default").toUpperCase() }}
        </div>
        <div
          class="tab"
          @click="changeTab('music')"
        >
          {{ $t("Trending.Music").toUpperCase() }}
        </div>
        <div
          class="tab"
          @click="changeTab('gaming')"
        >
          {{ $t("Trending.Gaming").toUpperCase() }}
        </div>
        <div
          class="tab"
          @click="changeTab('movies')"
        >
          {{ $t("Trending.Movies").toUpperCase() }}
        </div>
      </ft-flex-box>
      <ft-element-list
        :data="shownResults"
      />
    </ft-card>
    <ft-icon-button
      v-if="!isLoading"
      icon="sync"
      class="floatingTopButton"
      :size="12"
      theme="primary"
      @click="getTrendingInfo"
    />
  </div>
</template>

<script src="./Trending.js" />
<style scoped src="./Trending.css" />
