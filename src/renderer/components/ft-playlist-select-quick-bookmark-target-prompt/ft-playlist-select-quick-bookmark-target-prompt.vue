<template>
  <ft-playlist-selection-prompt
    :title="$t('User Playlists.SelectQuickBookmarkTargetPrompt.Select a playlist as quick bookmark target')"
    :can-submit-selected-playlists="false"
    :close-button-text="$t('User Playlists.SelectQuickBookmarkTargetPrompt.Later')"
    @playlist-selected="handlePlaylistSelected"
    @close="hide"
  />
</template>

<script src="./ft-playlist-select-quick-bookmark-target-prompt.js" />
