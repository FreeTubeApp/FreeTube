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
        :input-tabindex="0"
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
        :tabindex="0"
        @click="createNewPlaylist"
      />
      <ft-button
        :label="$t('User Playlists.Cancel')"
        :tabindex="0"
        @click="hideCreatePlaylistPrompt"
      />
    </ft-flex-box>
  </ft-prompt>
</template>

<script src="./ft-create-playlist-prompt.js" />
<style scoped src="./ft-create-playlist-prompt.css" />
