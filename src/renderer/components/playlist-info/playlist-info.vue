<template>
  <div class="playlistInfo">
    <div
      class="playlistThumbnail"
    >
      <img
        :src="thumbnail"
        :aria-label="$t('Playlist.Play First Video')"
        role="link"
        tabindex="0"
        @click="playFirstVideo"
        @keydown="playFirstVideo($event)"
      >
    </div>
    <h2>
      {{ title }}
    </h2>
    <p>
      {{ videoCount }} {{ $t("Playlist.Videos") }} - {{ viewCount }} {{ $t("Playlist.Views") }} -
      <span v-if="infoSource !== 'local'">
        {{ $t("Playlist.Last Updated On") }}
      </span>
      {{ lastUpdated }}
    </p>
    <p>
      {{ description }}
    </p>
    <hr>
    <div
      class="playlistChannel"
      :title="channelName"
      aria-labelledby="channelNameInfo"
      role="link"
      tabindex="0"
      @click="goToChannel"
      @keydown="goToChannel($event)"
    >
      <img :src="channelThumbnail">
      <h3 id="channelNameInfo">
        {{ channelName }}
      </h3>
    </div>
    <br>
    <ft-list-dropdown
      :title="$t('Playlist.Share Playlist.Share Playlist')"
      :label-names="shareHeaders"
      :label-values="shareValues"
      @click="sharePlaylist"
    />
  </div>
</template>

<script src="./playlist-info.js" />
<style scoped src="./playlist-info.css" />
