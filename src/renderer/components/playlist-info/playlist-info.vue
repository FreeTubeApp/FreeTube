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
          :style="{filter: blurThumbnailsStyle}"
        >
      </router-link>
    </div>

    <div class="playlistStats">
      <h2 class="playlistTitle">
        {{ title }}
      </h2>
      <p>
        {{ $tc('Global.Counts.Video Count', videoCount, {count: parsedVideoCount}) }} -
        <span v-if="!hideViews">{{ $tc('Global.Counts.View Count', viewCount, {count: parsedViewCount}) }} - </span>
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
        v-if="channelId"
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
      <div
        v-else
        class="playlistChannel"
      >
        <h3
          class="channelName"
        >
          {{ channelName }}
        </h3>
      </div>

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
