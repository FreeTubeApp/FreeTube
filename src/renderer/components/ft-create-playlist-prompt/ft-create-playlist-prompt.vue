<template>
  <ft-prompt
    @click="handleCreatePlaylistPrompt"
  >
    <h2 class="center">
      New Playlist Name
    </h2>
    <ft-flex-box>
      <ft-input
        placeholder="Playlist Name"
        :show-action-button="false"
        :show-label="false"
        :value="playlistName"
        @input="(input) => playlistName = input"
        @click="createNewPlaylist"
        class="playlistNameInput"
      />
    </ft-flex-box>
    <p
      v-if="videoImportLength > 0"
      class="center"
    >
      {{ videoImportLength }} video(s) will also be imported when created
    </p>
    <ft-flex-box>
      <ft-button
        label="Create"
        @click="createNewPlaylist"
      />
      <ft-button
        label="Cancel"
        @click="handleCreatePlaylistPrompt(null)"
      />
    </ft-flex-box>
  </ft-prompt>
</template>

<script src="./ft-create-playlist-prompt.js" />
<style scoped src="./ft-create-playlist-prompt.css" />
