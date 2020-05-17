<template>
  <div class="playlistInfo">
    <div
      class="playlistThumbnail"
    >
      <img
        :src="thumbnail"
      >
    </div>
    <h2>
      {{ title }}
    </h2>
    <p>
      {{ videoCount }} videos - {{ viewCount }} views -
      <span v-if="infoSource !== 'local'">
        Last updated on
      </span>
      {{ lastUpdated }}
    </p>
    <p>
      {{ description }}
    </p>
    <hr>
    <div
      class="playlistChannel"
    >
      <img :src="channelThumbnail">
      <h3>
        {{ channelName }}
      </h3>
    </div>
    <br>
    <ft-list-dropdown
      title="SHARE PLAYLIST"
      :label-names="shareHeaders"
      :label-values="shareValues"
      @click="sharePlaylist"
    />
  </div>
</template>

<script src="./playlist-info.js" />
<style scoped src="./playlist-info.css" />
