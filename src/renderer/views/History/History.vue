<template>
  <div>
    <ft-loader
      v-show="isLoading"
      :fullscreen="true"
    />
    <ft-card
      v-show="!isLoading"
      class="card"
    >
      <h3>{{ $t("History.History") }}</h3>
      <ft-input
        v-show="fullData.length > 0"
        ref="searchBar"
        :placeholder="$t('History.Search bar placeholder')"
        :show-clear-text-button="true"
        :show-action-button="false"
        @input="(input) => query = input"
      />
      <ft-flex-box
        v-show="fullData.length === 0"
      >
        <p class="message">
          {{ $t("History['Your history list is currently empty.']") }}
        </p>
      </ft-flex-box>
      <ft-flex-box
        v-show="activeData.length === 0 && fullData.length > 0"
      >
        <p class="message">
          {{ $t("History['Empty Search Message']") }}
        </p>
      </ft-flex-box>
      <ft-element-list
        v-if="activeData.length > 0 && !isLoading"
        :data="activeData"
      />
      <ft-flex-box
        v-if="showLoadMoreButton"
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
