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
      :input-tabindex="0"
      @input="(input) => updateQueryDebounce(input)"
      @clear="updateQueryDebounce('')"
    />
    <ft-flex-box>
      <ft-playlist-selector
        v-for="(playlist, index) in activePlaylists"
        :key="`${playlist._id}-${index}`"
        :tabindex="0"
        :data="playlist"
        :index="index"
        :selected="selectedPlaylistIdList.includes(playlist._id)"
        @selected="countSelected(playlist._id)"
      />
    </ft-flex-box>
    <ft-flex-box>
      <ft-button
        label="Create New Playlist"
        :tabindex="0"
        @click="createNewPlaylist"
      />
      <ft-button
        label="Save"
        :tabindex="0"
        @click="addSelectedToPlaylists"
      />
      <ft-button
        label="Cancel"
        :tabindex="0"
        @click="hide"
      />
    </ft-flex-box>
  </ft-prompt>
</template>

<script src="./ft-playlist-add-video-prompt.js" />
<style scoped src="./ft-playlist-add-video-prompt.css" />
