<template>
  <ft-prompt
    @click="handleAddToPlaylistPrompt"
  >
    <h2 class="center">
      Select a Playlist to add your video(s) to
    </h2>
    <p class="center">
      {{ selectedPlaylistIdSetCount }} Selected
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
        label="Save"
        @click="addSelectedToPlaylists"
      />
      <ft-button
        label="Create New Playlist"
        @click="createNewPlaylist"
      />
      <ft-button
        label="Cancel"
        @click="handleAddToPlaylistPrompt(null)"
      />
    </ft-flex-box>
  </ft-prompt>
</template>

<script src="./ft-playlist-add-video-prompt.js" />
<style scoped src="./ft-playlist-add-video-prompt.css" />
