<template>
  <div
    class="ft-list-video"
    :class="{ list: listType === 'list', grid: listType === 'grid' }"
  >
    <div class="videoThumbnail">
      <img
        :src="thumbnail"
        @click="goToPlaylist(playlistId)"
      >
      <div
        class="videoCountContainer"
        @click="goToPlaylist(playlistId)"
      >
        <span>
          {{ videoCount }}
          <br>
          <font-awesome-icon icon="list" />
        </span>
      </div>
    </div>
    <p
      class="playlistTitle"
      @click="goToPlaylist(playlistId)"
    >
      {{ title }}
    </p>
    <p
      class="channelName"
      @click="goToChannel(channelId)"
    >
      {{ channelName }}
    </p>
  </div>
</template>

<script src="./ft-list-playlist.js" />
<style scoped src="./ft-list-playlist.css" />
