<template>
  <div class="playlistInfo">
    <div
      class="playlistThumbnail"
    >
      <img
        :src="thumbnail"
        @click="playFirstVideo"
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
    <p
      class="playlistDescription"
    >
      {{ description }}
    </p>
    <hr>
    <div
      class="playlistChannel"
      @click="goToChannel"
    >
      <img
        class="channelThumbnail"
        :src="channelThumbnail"
      >
      <h3
        class="channelName"
      >
        {{ channelName }}
        <font-awesome-icon
          v-if="channelVerified"
          icon="check-circle"
        />
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
<style scoped lang="sass" src="./playlist-info.sass" />
