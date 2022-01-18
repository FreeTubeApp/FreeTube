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
      <h3>{{ $t("History.History") }}</h3>
      <ft-input
        ref="searchBar"
        :placeholder="$t('History.Search bar placeholder')"
        :show-clear-text-button="true"
        :show-action-button="false"
        @input="filterHistory"
      />
      <ft-flex-box
        v-if="activeData.length === 0"
      >
        <p class="message">
          {{ $t("History['Your history list is currently empty.']") }}
        </p>
      </ft-flex-box>
      <ft-element-list
        v-else
        :data="activeData"
      />
      <ft-flex-box
        v-if="activeData.length < historyCache.length"
      >
        <ft-button
          label="Load More"
          background-color="var(--primary-color)"
          text-color="var(--text-with-main-color)"
          @click="increaseLimit"
        />
      </ft-flex-box>
    </ft-card>
  </div>
</template>

<script src="./History.js" />
<style scoped src="./History.css" />
