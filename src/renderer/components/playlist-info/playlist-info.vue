<template>
  <div class="playlistInfo">
    <div
      class="playlistThumbnail"
    >
      <router-link
        :to="{
          path: `/watch/${firstVideoId}`,
          query: { playlistId: id }
        }"
        tabindex="-1"
      >
        <img
          :src="thumbnail"
          alt=""
        >
      </router-link>
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
      class="channelShareWrapper"
    >
      <router-link
        class="playlistChannel"
        :to="`/channel/${channelId}`"
      >
        <img
          class="channelThumbnail"
          :src="channelThumbnail"
          alt=""
        >
        <h3
          class="channelName"
        >
          {{ channelName }}
        </h3>
      </router-link>

      <ft-share-button
        v-if="!hideSharingActions"
        :id="id"
        :dropdown-position-y="description ? 'top' : 'bottom'"
        share-target-type="Playlist"
      />
    </div>
  </div>
</template>

<script src="./playlist-info.js" />
<style scoped lang="scss" src="./playlist-info.scss" />
