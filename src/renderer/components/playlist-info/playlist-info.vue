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
      {{ videoCount }} videos - {{ viewCount }} views - Last updated on {{ lastUpdated }}
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
