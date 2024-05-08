<template>
  <ft-playlist-selection-prompt
    :title="title"
    :can-submit-selected-playlists="true"
    :close-button-text="$t('User Playlists.Cancel')"
    @selected-playlists-submitted="(playlistIds) => addSelectedToPlaylists(playlistIds)"
    @close="hide"
  />
</template>

<script src="./ft-playlist-add-video-prompt.js" />
