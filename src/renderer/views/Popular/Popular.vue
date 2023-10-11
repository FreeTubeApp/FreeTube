<template>
  <div>
    <ft-loader
      v-if="isLoading"
      :fullscreen="true"
    />
    <ft-card
      v-else
      class="card"
      :class="{ fullWidth: useFullWidthLayout }"
    >
      <h2>{{ $t("Most Popular") }}</h2>
      <ft-element-list
        :data="shownResults"
      />
    </ft-card>
    <ft-icon-button
      v-if="!isLoading"
      :icon="['fas', 'sync']"
      class="floatingTopButton"
      :size="12"
      theme="primary"
      @click="fetchPopularInfo"
    />
  </div>
</template>

<script src="./Popular.js" />
<style scoped src="./Popular.scss" lang="scss" />
