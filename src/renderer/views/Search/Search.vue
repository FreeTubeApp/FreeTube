<template>
  <div
    ref="search"
  >
    <ft-loader
      v-if="isLoading"
      :fullscreen="true"
    />
    <ft-card
      v-else
      class="card"
    >
      <h2>{{ $t("Search Filters.Search Results") }}</h2>
      <ft-element-list
        :data="shownResults"
      />
      <div
        class="getNextPage"
        role="button"
        tabindex="0"
        @click="nextPage"
        @keydown.enter.prevent="nextPage"
        @keydown.space.prevent="nextPage"
      >
        <div
          v-observe-visibility="observeVisibilityOptions"
        >
          <!--
            Dummy element to be observed by Intersection Observer
          -->
        </div>
        <font-awesome-icon :icon="['fas', 'search']" /> {{ $t("Search Filters.Fetch more results") }}
      </div>
    </ft-card>
  </div>
</template>

<script src="./Search.js" />
<style scoped src="./Search.css" />
