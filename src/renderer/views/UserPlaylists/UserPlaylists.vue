<template>
  <div>
    <ft-loader
      v-if="isLoading"
      :fullscreen="true"
    />
    <ft-card
      v-else
      class="card"
    >
      <h3>
        {{ $t("User Playlists.Your Playlists") }}
      </h3>
      <ft-icon-button
        title="Add New Playlist"
        icon="plus"
        theme="primary"
        class="newPlaylistButton"
        @click="createNewPlaylist"
      />
      <ft-flex-box
        v-if="activeData.length === 0"
      >
        <p class="message">
          {{ $t("User Playlists['Your saved videos are empty. Click on the save button on the corner of a video to have it listed here']") }}
        </p>
      </ft-flex-box>
      <ft-element-list
        v-else
        :data="activeData"
      />
      <ft-flex-box
        v-if="activeData.length < allPlaylists.length"
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
