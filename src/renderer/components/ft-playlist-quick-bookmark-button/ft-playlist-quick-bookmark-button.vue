<template>
  <ft-icon-button
    :title="quickBookmarkIconText"
    :icon="isInQuickBookmarkPlaylist ? ['fas', 'check'] : ['fas', 'bookmark']"
    class="quickBookmarkVideoIcon"
    :class="{
      bookmarked: isInQuickBookmarkPlaylist,
      alwaysVisible: alwaysVisible,
    }"
    :theme="quickBookmarkIconTheme"
    :padding="padding"
    :size="size"
    @click="toggleQuickBookmarked"
  />
</template>

<script src="./ft-playlist-quick-bookmark-button.js" />
