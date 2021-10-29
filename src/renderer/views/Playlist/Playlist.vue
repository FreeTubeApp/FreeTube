<template>
  <div>
    <ft-loader
      v-if="isLoading"
      :fullscreen="true"
    />
    <playlist-info
      v-if="!isLoading"
      :id="playlistId"
      :firstVideoId="firstVideoId"
      :title="playlistTitle"
      :channelName="channelName"
      :channelThumbnail="channelThumbnail"
      :channelId="channelId"
      :lastUpdated="lastUpdated"
      :description="playlistDescription"
      :videoCount="videoCount"
      :videos="playlistItems"
      :viewCount="viewCount"
      :infoSource="infoSource"
      class="playlistInfo"
    />
    <ft-card
      v-if="!isLoading"
      class="playlistItems"
    >
      <span
        v-if="playlistItems.length > 0"
      >
        <ft-list-video
          v-for="(item, index) in playlistItems"
          :key="index"
          :data="item"
          :playlist-id="playlistId"
          :playlist-type="infoSource"
          :playlist-index="index"
          appearance="result"
          force-list-type="list"
          @move-video-up="moveVideoUp"
          @move-video-down="moveVideoDown"
        />
      </span>
      <ft-flex-box
        v-else
      >
        <p class="message">
          This playlist currently has no videos.
        </p>
      </ft-flex-box>
    </ft-card>
  </div>
</template>

<script src="./Playlist.js" />
<style scoped src="./Playlist.css" />
