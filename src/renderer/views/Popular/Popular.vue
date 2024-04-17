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
      <h2>{{ $t("Most Popular") }}</h2>
      <ft-element-list
        :data="shownResults"
      />
    </ft-card>
    <ft-refresh-widget
      :disable-refresh="isLoading"
      :last-refresh-timestamp="lastPopularRefreshTimestamp"
      :title="$t('Most Popular')"
      @click="fetchPopularInfo"
    />
  </div>
</template>

<script src="./Popular.js" />
<style scoped src="./Popular.css" />
