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
    <ft-flex-box
      v-if="!isLoading"
      class="playlistItems"
    >
      <ft-list-video
        v-for="(item, index) in playlistItems"
        :key="index"
        :data="item"
        force-list-type="list"
        class="playlistItem"
      />
    </ft-flex-box>
  </div>
</template>

<script src="./Playlist.js" />
<style scoped src="./Playlist.css" />
