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
      <ft-list-video
        v-for="(item, index) in playlistItems"
        :key="index"
        :data="item"
        :playlist-id="playlistId"
        :playlist-index="index"
        appearance="result"
        force-list-type="list"
      />
    </ft-card>
  </div>
</template>

<script src="./Playlist.js" />
<style scoped src="./Playlist.css" />
