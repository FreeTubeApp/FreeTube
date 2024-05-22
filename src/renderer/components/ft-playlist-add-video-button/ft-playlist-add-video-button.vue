<template>
  <ft-icon-button
    :title="$t('User Playlists.Add to Playlist')"
    :icon="['fas', 'plus']"
    :counter-value="videoAddedToPlaylistCount"
    :padding="padding"
    :size="size"
    @click="togglePlaylistPrompt"
  />
</template>

<script src="./ft-playlist-add-video-button.js" />
