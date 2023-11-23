<template>
  <ft-prompt
    @click="hide"
  >
    <h2 class="heading">
      {{ $tc('User Playlists.AddVideoPrompt.Select a playlist to add your N videos to', toBeAddedToPlaylistVideoCount, {
        videoCount: toBeAddedToPlaylistVideoCount,
      }) }}
    </h2>
    <p class="selected-count">
      {{ $tc('User Playlists.AddVideoPrompt.N playlists selected', selectedPlaylistCount, {
        playlistCount: selectedPlaylistCount,
      }) }}
    </p>
    <ft-input
      v-show="allPlaylists.length > 1"
      ref="searchBar"
      :placeholder="$t('User Playlists.AddVideoPrompt.Search in Playlists')"
      :show-clear-text-button="true"
      :show-action-button="false"
      @input="(input) => updateQueryDebounce(input)"
      @clear="updateQueryDebounce('')"
    />
    <ft-select
      v-if="allPlaylists.length > 1"
      class="sortSelect"
      :value="sortBy"
      :select-names="sortBySelectNames"
      :select-values="sortBySelectValues"
      :placeholder="$t('User Playlists.Sort By.Sort By')"
      @change="sortBy = $event"
    />
    <div class="playlists-container">
      <ft-flex-box>
        <div
          v-for="(playlist, index) in activePlaylists"
          :key="playlist._id"
          class="playlist-selector-container"
        >
          <ft-playlist-selector
            tabindex="0"
            :data="playlist"
            :index="index"
            :selected="selectedPlaylistIdList.includes(playlist._id)"
            @selected="countSelected(playlist._id)"
          />
        </div>
      </ft-flex-box>
    </div>
    <div class="actions-container">
      <ft-flex-box>
        <ft-button
          :label="$t('User Playlists.Create New Playlist')"
          :tabindex="0"
          @click="openCreatePlaylistPrompt"
        />
        <ft-button
          :label="$t('User Playlists.AddVideoPrompt.Save')"
          :tabindex="0"
          @click="addSelectedToPlaylists"
        />
        <ft-button
          :label="$t('User Playlists.Cancel')"
          :tabindex="0"
          @click="hide"
        />
      </ft-flex-box>
    </div>
  </ft-prompt>
</template>

<script src="./ft-playlist-add-video-prompt.js" />
<style scoped src="./ft-playlist-add-video-prompt.css" />
