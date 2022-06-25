<template>
  <div class="playlistInfo">
    <div
      class="playlistThumbnail"
    >
      <img
        :src="thumbnail"
        :alt="$t('Playlist.Play First Video')"
        role="link"
        tabindex="0"
        @click="playFirstVideo"
        @keydown.enter.prevent="playFirstVideo"
        @keydown.space.prevent="playFirstVideo"
      >
    </div>

    <div class="playlistStats">
      <h2 class="playlistTitle">
        {{ title }}
      </h2>
      <p>
        {{ videoCount }} {{ $t("Playlist.Videos") }} - <span v-if="!hideViews">{{ viewCount }} {{ $t("Playlist.Views") }} -</span>
        <span v-if="infoSource !== 'local'">
          {{ $t("Playlist.Last Updated On") }}
        </span>
        {{ lastUpdated }}
      </p>
    </div>

    <p
      class="playlistDescription"
      v-text="description"
    />

    <hr>

    <div
      class="playlistChannel"
      :title="channelName"
      aria-labelledby="channelNameInfo"
      role="link"
      tabindex="0"
      @click="$goToChannel(channelId)"
      @keydown.enter.prevent="$goToChannel(channelId)"
    >
      <img
        class="channelThumbnail"
        :src="channelThumbnail"
        alt=""
      >
      <h3
        id="channelNameInfo"
        class="channelName"
      >
        {{ channelName }}
      </h3>
    </div>

    <br>

    <ft-list-dropdown
      v-if="!hideSharingActions"
      :title="$t('Playlist.Share Playlist.Share Playlist')"
      :label-names="shareHeaders"
      :label-values="shareValues"
      @click="sharePlaylist"
    />
  </div>
</template>

<script src="./playlist-info.js" />
<style scoped lang="sass" src="./playlist-info.sass" />
