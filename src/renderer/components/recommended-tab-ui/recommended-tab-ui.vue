<template>
  <div>
    <ft-loader
      v-if="isLoading"
    />
    <ft-flex-box
      v-if="!isLoading && activeVideoList.length === 0"
    >
      <p
        v-if="searchHistory.length === 0"
        class="message"
      >
        {{ $t("Your search history is currently empty. Start with some search to see recommendations.") }}
      </p>
    </ft-flex-box>
    <ft-element-list
      v-if="!isLoading && activeVideoList.length > 0"
      :data="activeVideoList"
      :use-channels-hidden-preference="false"
    />
    <ft-auto-load-next-page-wrapper
      v-if="!isLoading && videoList.length > dataLimit"
      @load-next-page="increaseLimit"
    >
      <ft-flex-box>
        <ft-button
          :label="$t('Subscriptions.Load More Videos')"
          background-color="var(--primary-color)"
          text-color="var(--text-with-main-color)"
          @click="increaseLimit"
        />
      </ft-flex-box>
    </ft-auto-load-next-page-wrapper>

    <ft-refresh-widget
      :disable-refresh="isLoading || activeVideoList.length === 0"
      :last-refresh-timestamp="lastRefreshTimestamp"
      :title="title"
      @click="refresh"
    />
  </div>
</template>

<script src="./recommended-tab-ui.js" />
<style scoped src="./recommended-tab-ui.css" />
