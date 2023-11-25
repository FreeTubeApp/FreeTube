<template>
  <div>
    <ft-loader
      v-if="isLoading"
      :fullscreen="true"
    />
    <ft-card
      v-else
      big
      class="card"
    >
      <h2>{{ hashtag }}</h2>
      <ft-element-list
        v-if="videos.length > 0"
        :data="videos"
      />
      <ft-flex-box
        v-else
      >
        <p
          class="message"
        >
          {{ $t("Hashtag.This hashtag does not currently have any videos") }}
        </p>
      </ft-flex-box>
      <div
        v-if="showFetchMoreButton"
        class="getNextPage"
        role="button"
        tabindex="0"
        @click="handleFetchMore"
        @keydown.space.prevent="handleFetchMore"
        @keydown.enter.prevent="handleFetchMore"
      >
        <font-awesome-icon :icon="['fas', 'search']" /> {{ $t("Search Filters.Fetch more results") }}
      </div>
    </ft-card>
  </div>
</template>
<script src="./Hashtag.js" />
<style scoped src="./Hashtag.scss" lang="scss" />
