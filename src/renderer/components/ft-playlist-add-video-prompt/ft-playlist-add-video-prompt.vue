<template>
  <ft-prompt
    @click="hide"
  >
    <h2 class="center">
      Select a Playlist to add your {{ toBeAddedToPlaylistVideoCount }} video(s) to
    </h2>
    <p class="center">
      {{ selectedPlaylistCount }} Selected
    </p>
    <ft-input
      v-show="allPlaylists.length > 0"
      ref="searchBar"
      placeholder="Search in Playlist"
      :show-clear-text-button="true"
      :show-action-button="false"
      @input="(input) => updateQueryDebounce(input)"
      @clear="updateQueryDebounce('')"
    />
    <ft-flex-box>
      <ft-playlist-selector
        v-for="(playlist, index) in activePlaylists"
        :key="`${playlist._id}-${index}`"
        :data="playlist"
        :index="index"
        @selected="countSelected(playlist._id)"
      />
    </ft-flex-box>
    <ft-flex-box>
      <ft-button
        label="Create New Playlist"
        @click="createNewPlaylist"
      />
      <ft-button
        label="Save"
        @click="addSelectedToPlaylists"
      />
      <ft-button
        label="Cancel"
        @click="hide"
      />
    </ft-flex-box>
  </ft-prompt>
</template>

<script src="./ft-playlist-add-video-prompt.js" />
<style scoped src="./ft-playlist-add-video-prompt.css" />
