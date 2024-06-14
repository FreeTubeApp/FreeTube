<template>
  <ft-icon-button
    :title="title"
    :icon="['fas', 'plus']"
    :counter-value="videoAddedToPlaylistCount"
    :padding="padding"
    :size="size"
    @click="togglePlaylistPrompt"
  />
</template>

<script src="./ft-playlist-add-video-button.js" />
