<template>
  <ft-prompt
    theme="flex-column"
    :label="title"
    @click="hide"
  >
    <h2 class="heading">
      {{ title }}
    </h2>
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
        :icon="getIconForSortPreference(sortBy)"
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
            :selected="false"
            @selected="handlePlaylistSelected(playlist._id)"
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
          :label="$t('User Playlists.SelectQuickBookmarkTargetPrompt.Later')"
          :text-color="null"
          :background-color="null"
          @click="hide"
        />
      </ft-flex-box>
    </div>
  </ft-prompt>
</template>

<script src="./ft-playlist-select-quick-bookmark-target-prompt.js" />
<style scoped src="./ft-playlist-select-quick-bookmark-target-prompt.css" />
