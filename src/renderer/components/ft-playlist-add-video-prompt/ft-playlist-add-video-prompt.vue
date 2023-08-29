<template>
  <ft-prompt
    @click="hide"
  >
    <h2 class="center">
      Select a Playlist to add your {{ toBeAddedToPlaylistVideoCount }} video(s) to
    </h2>
    <p class="center">
      {{ selectedPlaylistCount }} Selected
    </p>
    <ft-input
      v-show="allPlaylists.length > 1"
      ref="searchBar"
      placeholder="Search in Playlist"
      :show-clear-text-button="true"
      :show-action-button="false"
      :input-tabindex="tabindex"
      @input="(input) => updateQueryDebounce(input)"
      @clear="updateQueryDebounce('')"
    />
    <ft-select
      v-if="allPlaylists.length > 1"
      class="sortSelect"
      :value="sortBy"
      :select-names="sortBySelectNames"
      :select-values="sortBySelectValues"
      :placeholder="'Sort By'"
      @change="sortBy = $event"
    />
    <ft-flex-box>
      <ft-playlist-selector
        v-for="(playlist, index) in activePlaylists"
        :key="`${playlist._id}-${index}`"
        :tabindex="tabindex"
        :data="playlist"
        :index="index"
        :selected="selectedPlaylistIdList.includes(playlist._id)"
        @selected="countSelected(playlist._id)"
      />
    </ft-flex-box>
    <ft-flex-box>
      <ft-button
        label="Create New Playlist"
        :tabindex="tabindex"
        @click="openCreatePlaylistPrompt"
      />
      <ft-button
        label="Save"
        :tabindex="tabindex"
        @click="addSelectedToPlaylists"
      />
      <ft-button
        label="Cancel"
        :tabindex="tabindex"
        @click="hide"
      />
    </ft-flex-box>
  </ft-prompt>
</template>

<script src="./ft-playlist-add-video-prompt.js" />
<style scoped lang="scss" src="./ft-playlist-add-video-prompt.scss" />
