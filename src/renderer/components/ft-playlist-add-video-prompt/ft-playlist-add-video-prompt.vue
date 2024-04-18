<template>
  <ft-prompt
    theme="flex-column"
    :label="title"
    @click="hide"
  >
    <h2 class="heading">
      {{ title }}
    </h2>
    <p class="selected-count">
      {{ $tc('User Playlists.AddVideoPrompt.N playlists selected', selectedPlaylistCount, {
        playlistCount: selectedPlaylistCount,
      }) }}
    </p>
    <div
      class="searchInputsRow"
    >
      <ft-input
        ref="searchBar"
        :placeholder="$t('User Playlists.AddVideoPrompt.Search in Playlists')"
        :show-clear-text-button="true"
        :show-action-button="false"
        @input="(input) => updateQueryDebounce(input)"
        @clear="updateQueryDebounce('')"
      />
    </div>
    <div
      class="optionsRow"
    >
      <ft-toggle-switch
        :label="$t('User Playlists.Playlists with Matching Videos')"
        :compact="true"
        :default-value="doSearchPlaylistsWithMatchingVideos"
        @change="doSearchPlaylistsWithMatchingVideos = !doSearchPlaylistsWithMatchingVideos"
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
    </div>
    <div class="playlists-container">
      <ft-flex-box>
        <div
          v-for="(playlist, index) in activePlaylists"
          :key="playlist._id"
          class="playlist-selector-container"
        >
          <ft-playlist-selector
            tabindex="0"
            :playlist="playlist"
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
          @click="openCreatePlaylistPrompt"
        />
        <ft-button
          :label="$t('User Playlists.AddVideoPrompt.Save')"
          @click="addSelectedToPlaylists"
        />
        <ft-button
          :label="$t('User Playlists.Cancel')"
          @click="hide"
        />
      </ft-flex-box>
    </div>
  </ft-prompt>
</template>

<script src="./ft-playlist-add-video-prompt.js" />
<style scoped src="./ft-playlist-add-video-prompt.css" />
