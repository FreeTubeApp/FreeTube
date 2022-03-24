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
      <div class="titleArea">
        <h3>{{ $t("Search Filters.Search Results") }}</h3>
        <transition
          name="fade"
          mode="out-in"
        >
          <div
            v-show="channelBlockerCount > 0 && !unhide"
            class="hiddenItemsCount"
          >
            {{ `(${channelBlockerCountText})` }}
          </div>
        </transition>
      </div>
      <ft-element-list
        :data="shownResults"
        :show-blocked-items="unhide"
      />
      <div
        class="getNextPage"
        @click="nextPage"
      >
        <font-awesome-icon icon="search" /> {{ $t("Search Filters.Fetch more results") }}
      </div>
      <ft-icon-button
        v-show="!isLoading && channelBlockerCount > 0"
        ref="unhideButton"
        class="floatingTopButton"
        :icon="unhideIcons[unhide].icon"
        :title="unhideIcons[unhide].title"
        :size="20"
        :padding="6"
        theme="secondary"
        @click="toggleBlockedContents"
      />
    </ft-card>
  </div>
</template>

<script src="./Search.js" />
<style scoped src="./Search.css" />
