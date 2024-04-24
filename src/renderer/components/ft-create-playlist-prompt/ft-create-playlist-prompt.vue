<template>
  <ft-prompt
    @click="hideCreatePlaylistPrompt"
  >
    <h2 class="center">
      {{ $t('User Playlists.CreatePlaylistPrompt.New Playlist Name') }}
    </h2>
    <ft-flex-box>
      <ft-input
        ref="playlistNameInput"
        :placeholder="$t('User Playlists.Playlist Name')"
        :show-action-button="false"
        :show-label="false"
        :value="playlistName"
        class="playlistNameInput"
        @input="(input) => playlistName = input"
        @click="createNewPlaylist"
      />
    </ft-flex-box>
    <ft-flex-box>
      <ft-button
        :label="$t('User Playlists.CreatePlaylistPrompt.Create')"
        @click="createNewPlaylist"
      />
      <ft-button
        :label="$t('User Playlists.Cancel')"
        :text-color="null"
        :background-color="null"
        @click="hideCreatePlaylistPrompt"
      />
    </ft-flex-box>
  </ft-prompt>
</template>

<script src="./ft-create-playlist-prompt.js" />
<style scoped src="./ft-create-playlist-prompt.css" />
