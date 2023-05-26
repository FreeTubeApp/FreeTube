<template>
  <div>
    <ft-loader
      v-show="isLoading"
      :fullscreen="true"
    />
    <ft-card
      v-show="!isLoading"
      class="card"
    >
      <div class="heading">
        <h3 class="headingText">
          {{ $t("User Playlists.Your Playlists") }}
        </h3>
        <ft-icon-button
          title="Create New Playlist"
          :icon="['fas', 'plus']"
          theme="secondary"
          class="newPlaylistButton"
          @click="createNewPlaylist"
        />
        <ft-input
          v-show="fullData.length > 0"
          ref="searchBar"
          :placeholder="$t('User Playlists.Search bar placeholder')"
          :show-clear-text-button="true"
          :show-action-button="false"
          @input="(input) => query = input"
          @clear="query = ''"
        />
      </div>
      <ft-flex-box
        v-show="fullData.length === 0"
      >
        <p class="message">
          {{ $t("User Playlists['Your saved videos are empty. Click on the save button on the corner of a video to have it listed here']") }}
        </p>
      </ft-flex-box>
      <ft-flex-box
        v-show="activeData.length === 0 && fullData.length > 0"
      >
        <p class="message">
          {{ $t("User Playlists['Empty Search Message']") }}
        </p>
      </ft-flex-box>
      <ft-element-list
        v-if="activeData.length > 0 && !isLoading"
        :data="activeData"
      />
      <ft-flex-box
        v-if="showLoadMoreButton"
      >
        <ft-button
          label="Load More"
          background-color="var(--primary-color)"
          text-color="var(--text-with-main-color)"
          @click="increaseLimit"
        />
      </ft-flex-box>
    </ft-card>
  </div>
</template>

<script src="./UserPlaylists.js" />
<style scoped src="./UserPlaylists.css" />
