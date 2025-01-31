<template>
  <div>
    <ft-loader
      v-if="isLoading"
      :fullscreen="true"
    />
    <ft-card
      v-if="!isLoading"
      class="card"
    >
      <div class="heading">
        <h2 class="headingText">
          {{ $t("User Playlists.Your Playlists") }}
        </h2>
        <ft-icon-button
          :title="$t('User Playlists.Create New Playlist')"
          :icon="['fas', 'plus']"
          theme="secondary"
          class="newPlaylistButton"
          @click="createNewPlaylist"
        />
        <div
          v-if="fullData.length > 1"
          class="searchInputsRow"
        >
          <ft-input
            ref="searchBar"
            :placeholder="$t('User Playlists.Search bar placeholder')"
            :value="query"
            :show-clear-text-button="true"
            :show-action-button="false"
            :maxlength="255"
            @input="(input) => handleQueryChange(input)"
            @clear="() => handleQueryChange('')"
          />
        </div>
        <div
          class="optionsRow"
        >
          <ft-toggle-switch
            v-if="fullData.length > 1"
            :label="$t('User Playlists.Playlists with Matching Videos')"
            :compact="true"
            :default-value="doSearchPlaylistsWithMatchingVideos"
            @change="doSearchPlaylistsWithMatchingVideos = !doSearchPlaylistsWithMatchingVideos"
          />
          <ft-select
            v-if="fullData.length > 1"
            class="sortSelect"
            :value="sortBy"
            :select-names="sortBySelectNames"
            :select-values="sortBySelectValues"
            :placeholder="$t('Global.Sort By')"
            :icon="getIconForSortPreference(sortBy)"
            @change="sortBy = $event"
          />
        </div>
      </div>
      <ft-flex-box
        v-if="fullData.length === 0"
      >
        <p class="message">
          {{ $t("User Playlists['You have no playlists. Click on the create new playlist button to create a new one.']") }}
        </p>
      </ft-flex-box>
      <ft-flex-box
        v-else-if="activeData.length === 0 && fullData.length > 0"
      >
        <p class="message">
          {{ $t("User Playlists['Empty Search Message']") }}
        </p>
      </ft-flex-box>
      <ft-element-list
        v-else-if="activeData.length > 0 && !isLoading"
        :data="activeData"
        :data-type="'playlist'"
        :search-query-text="doSearchPlaylistsWithMatchingVideos ? lowerCaseQuery : ''"
        :use-channels-hidden-preference="false"
        :hide-forbidden-titles="false"
      />
      <ft-auto-load-next-page-wrapper
        v-if="showLoadMoreButton"
        @load-next-page="increaseLimit"
      >
        <ft-flex-box>
          <ft-button
            label="Load More"
            background-color="var(--primary-color)"
            text-color="var(--text-with-main-color)"
            @click="increaseLimit"
          />
        </ft-flex-box>
      </ft-auto-load-next-page-wrapper>
    </ft-card>
  </div>
</template>

<script src="./UserPlaylists.js" />
<style scoped src="./UserPlaylists.css" />
