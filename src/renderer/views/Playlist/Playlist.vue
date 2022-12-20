<template>
  <div>
    <ft-loader
      v-if="isLoading"
      :fullscreen="true"
    />

    <playlist-info
      v-if="!isLoading"
      :data="infoData"
      class="playlistInfo"
    />

    <ft-card
      v-if="!isLoading"
      class="playlistItems"
    >
      <div
        v-for="(item, index) in playlistItems"
        :key="index"
        class="playlistItem"
      >
        <p
          class="videoIndex"
        >
          {{ index + 1 }}
        </p>
        <ft-list-video
          :data="item"
          :playlist-id="playlistId"
          :playlist-index="index"
          appearance="result"
          force-list-type="list"
        />
      </div>
      <ft-flex-box
        v-if="continuationData !== null && !isLoadingMore"
      >
        <ft-button
          :label="$t('Subscriptions.Load More Videos')"
          background-color="var(--primary-color)"
          text-color="var(--text-with-main-color)"
          @click="getNextPage"
        />
      </ft-flex-box>
      <div
        v-if="isLoadingMore"
        class="loadNextPageWrapper"
      >
        <ft-loader />
      </div>
    </ft-card>
  </div>
</template>

<script src="./Playlist.js" />
<style scoped src="./Playlist.css" />
