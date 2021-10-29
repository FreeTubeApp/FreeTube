<template>
  <div class="playlistInfo">
    <div
      class="playlistThumbnail"
    >
      <img
        :src="thumbnail"
        @click="playFirstVideo"
      >
    </div>
    <h2 v-if="!editMode">
      {{ title }}
    </h2>
    <ft-input
      v-if="editMode"
      placeholder="Playlist Name"
      :show-action-button="false"
      :show-label="false"
      :value="newTitle"
      @input="(input) => newTitle = input"
    />
    <p>
      {{ videoCount }} {{ $t("Playlist.Videos") }}
      <span v-if="infoSource !== 'user'">
        - {{ viewCount }} {{ $t("Playlist.Views") }} -
      </span>
      <span v-if="infoSource === 'invidious'">
        {{ $t("Playlist.Last Updated On") }}
      </span>
      <span v-if="infoSource !== 'user'">
        {{ lastUpdated }}
      </span>
    </p>
    <p
      v-if="!editMode"
      class="playlistDescription"
    >
      {{ description }}
    </p>
    <ft-input
      v-if="editMode"
      placeholder="Playlist Description"
      :show-action-button="false"
      :show-label="false"
      :value="newDescription"
      @input="(input) => newDescription = input"
    />
    <hr>
    <div
      v-if="infoSource !== 'user'"
      class="playlistChannel"
      @click="goToChannel"
    >
      <img
        class="channelThumbnail"
        :src="channelThumbnail"
      >
      <h3
        class="channelName"
      >
        {{ channelName }}
      </h3>
    </div>
    <br />
    <ft-flex-box
      v-if="!editMode"
    >
      <ft-icon-button
        title="Play All"
        icon="play"
        theme="primary"
        @click="playFirstVideo"
      />
      <ft-icon-button
        title="Copy Playlist"
        icon="copy"
        theme="primary"
        @click="copyPlaylist"
      />
      <ft-icon-button
        v-if="infoSource === 'user'"
        title="Edit Playlist"
        icon="edit"
        theme="primary"
        @click="enableEditMode"
      />
      <ft-icon-button
        v-if="infoSource === 'user'"
        title="Remove Watched Videos"
        icon="eye-slash"
        theme="primary"
        @click="showRemoveVideosOnWatchPrompt = true"
      />
      <ft-icon-button
        v-if="infoSource === 'user'"
        title="Delete Playlist"
        icon="trash"
        theme="primary"
        @click="showDeletePlaylistPrompt = true"
      />
    </ft-flex-box>
    <ft-flex-box
      v-if="editMode"
    >
      <ft-icon-button
        title="Save Changes"
        icon="save"
        theme="primary"
        @click="savePlaylistInfo"
      />
      <ft-icon-button
        title="Cancel"
        icon="times"
        theme="primary"
        @click="cancelEditMode"
      />
    </ft-flex-box>
    <br />
    <ft-list-dropdown
      v-if="infoSource !== 'user'"
      :title="$t('Playlist.Share Playlist.Share Playlist')"
      :label-names="shareHeaders"
      :label-values="shareValues"
      @click="sharePlaylist"
    />
    <ft-prompt
      v-if="showDeletePlaylistPrompt"
      label="Are you sure you want to delete this playlist? This cannot be undone."
      :option-names="deletePlaylistPromptNames"
      :option-values="deletePlaylistPromptValues"
      @click="handleDeletePlaylistPromptAnswer"
    />
    <ft-prompt
      v-if="showRemoveVideosOnWatchPrompt"
      label="Are you sure you want to remove all watched videos from this playlist? This cannot be undone."
      :option-names="deletePlaylistPromptNames"
      :option-values="deletePlaylistPromptValues"
      @click="handleRemoveVideosOnWatchPromptAnswer"
    />
  </div>
</template>

<script src="./playlist-info.js" />
<style scoped lang="sass" src="./playlist-info.sass" />
