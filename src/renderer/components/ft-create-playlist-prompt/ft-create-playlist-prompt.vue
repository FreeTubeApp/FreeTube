<template>
  <ft-prompt
    :label="title"
    @click="hideCreatePlaylistPrompt"
  >
    <ft-flex-box>
      <ft-input
        ref="playlistNameInput"
        :placeholder="$t('User Playlists.Playlist Name')"
        :show-action-button="false"
        :show-label="false"
        :value="playlistName"
        :maxlength="255"
        class="playlistNameInput"
        @input="handlePlaylistNameInput"
        @click="createNewPlaylist"
      />
    </ft-flex-box>
    <ft-flex-box v-if="playlistNameBlank">
      <p>
        {{ $t('User Playlists.SinglePlaylistView.Toast["Playlist name cannot be empty. Please input a name."]') }}
      </p>
    </ft-flex-box>
    <ft-flex-box v-if="playlistWithNameExists">
      <p>
        {{ $t('User Playlists.CreatePlaylistPrompt.Toast["There is already a playlist with this name. Please pick a different name."]') }}
      </p>
    </ft-flex-box>
    <ft-flex-box>
      <ft-button
        :label="$t('User Playlists.CreatePlaylistPrompt.Create')"
        :disabled="playlistPersistenceDisabled"
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
