<template>
  <ft-icon-button
    :title="$t('User Playlists.Add to Playlist')"
    :icon="['fas', 'plus']"
    :padding="padding"
    :size="size"
    @click="togglePlaylistPrompt"
  />
</template>

<script src="./ft-playlist-add-video-button.js" />
<style scoped lang="scss" src="./ft-playlist-add-video-button.scss" />
