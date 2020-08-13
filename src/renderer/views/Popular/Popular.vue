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
      :size="10"
      @click="refreshTrendingInfo"
    />
  </div>
</template>

<script src="./Popular.js" />
<style scoped src="./Popular.css" />
