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
      <h3>{{ $t("Most Popular") }}</h3>
      <ft-element-list
        :data="shownResults"
      />
    </ft-card>
    <ft-icon-button
      icon="sync"
      class="floatingTopButton"
      :size="12"
      :theme="primary"
      @click="refreshTrendingInfo"
    />
  </div>
</template>

<script src="./Popular.js" />
<style scoped src="./Popular.css" />
