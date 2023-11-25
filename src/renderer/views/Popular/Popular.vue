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
      v-if="!isLoading"
      :last-refresh-timestamp="lastPopularRefreshTimestamp"
      :title="$t('Refresh Most Popular')"
      @click="fetchPopularInfo"
    />
  </div>
</template>

<script src="./Popular.js" />
<style scoped src="./Popular.css" />
