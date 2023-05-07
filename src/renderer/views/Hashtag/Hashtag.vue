<template>
  <div>
    <ft-loader
      v-if="isLoading"
      :fullscreen="true"
    />
    <div v-else>
      <ft-card>
        <h3>{{ hashtag }}</h3>
        <div
          class="elementList"
        >
          <ft-element-list
            v-if="backendFallback || backendPreference === 'local' && videos.length > 0"
            :data="videos"
          />
          <ft-flex-box
            v-else-if="backendFallback || backendPreference === 'local' && videos.length === 0"
          >
            <p
              class="message"
            >
              {{ $t("Hashtag.This hashtag does not currently have any videos") }}
            </p>
          </ft-flex-box>
          <ft-flex-box
            v-else
          >
            <p
              class="message"
            >
              {{ $t("Hashtag.You can only view hashtag pages through the Local API") }}
            </p>
          </ft-flex-box>
        </div>
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
  </div>
</template>
<script src="./Hashtag.js" />
<style scoped src="./Hashtag.css" />
