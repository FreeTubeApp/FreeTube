<template>
  <ft-prompt
    theme="flex-column"
    :label="title"
    :inert="showingCreatePlaylistPrompt"
    @click="hide"
  >
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
        :maxlength="255"
        @input="(input) => updateQueryDebounce(input)"
        @clear="updateQueryDebounce('')"
      />
    </div>
    <div
      class="optionsRow"
    >
      <div
        class="tightOptions"
      >
        <ft-toggle-switch
          class="matchingVideoToggle"
          :label="$t('User Playlists.Playlists with Matching Videos')"
          :compact="true"
          :default-value="doSearchPlaylistsWithMatchingVideos"
          @change="doSearchPlaylistsWithMatchingVideos = !doSearchPlaylistsWithMatchingVideos"
        />
        <ft-toggle-switch
          v-if="anyPlaylistContainsVideosToBeAdded"
          class="allowDuplicateToggle"
          :label="$t('User Playlists.AddVideoPrompt.Allow Adding Duplicate Video(s)')"
          :compact="true"
          :default-value="addingDuplicateVideosEnabled"
          @change="addingDuplicateVideosEnabled = !addingDuplicateVideosEnabled"
        />
      </div>
      <ft-select
        v-if="allPlaylists.length > 1"
        class="sortSelect"
        :value="sortBy"
        :select-names="sortBySelectNames"
        :select-values="sortBySelectValues"
        :placeholder="$t('Global.Sort By')"
        :icon="getIconForSortPreference(sortBy)"
        @change="sortBy = $event"
      />
    </div>
    <div class="playlists-container">
      <ft-flex-box>
        <div
          v-for="(playlist, index) in activePlaylists"
          :key="`${playlist._id}-${playlistDisabled(playlist._id)}`"
          class="playlist-selector-container"
          :class="{
            disabled: playlistDisabled(playlist._id),
          }"
          :aria-disabled="playlistDisabled(playlist._id)"
        >
          <ft-playlist-selector
            :tabindex="playlistDisabled(playlist._id) ? -1 : 0"
            :playlist="playlist"
            :index="index"
            :selected="selectedPlaylistIdList.includes(playlist._id)"
            :disabled="playlistDisabled(playlist._id)"
            :adding-duplicate-videos-enabled="addingDuplicateVideosEnabled"
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
          :text-color="null"
          :background-color="null"
          @click="hide"
        />
      </ft-flex-box>
    </div>
  </ft-prompt>
</template>

<script src="./ft-playlist-add-video-prompt.js" />
<style scoped src="./ft-playlist-add-video-prompt.css" />
