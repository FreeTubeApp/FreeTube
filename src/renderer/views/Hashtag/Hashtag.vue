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

      <ft-auto-load-next-page-wrapper
        v-if="showFetchMoreButton"
        @load-next-page="handleFetchMore"
      >
        <div
          class="getNextPage"
          role="button"
          tabindex="0"
          @click="handleFetchMore"
          @keydown.space.prevent="handleFetchMore"
          @keydown.enter.prevent="handleFetchMore"
        >
          <font-awesome-icon :icon="['fas', 'search']" /> {{ $t("Search Filters.Fetch more results") }}
        </div>
      </ft-auto-load-next-page-wrapper>
    </ft-card>
  </div>
</template>
<script src="./Hashtag.js" />
<style scoped src="./Hashtag.css" />
