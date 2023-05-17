<template>
  <div class="playlistInfo">
    <div
      class="playlistThumbnail"
    >
      <router-link
        :to="{
          path: `/watch/${firstVideoId}`,
          query: { playlistId: id }
        }"
        tabindex="-1"
      >
        <img
          :src="thumbnail"
          alt=""
        >
      </router-link>
    </div>

    <div class="playlistStats">
      <ft-input
        v-if="editMode"
        placeholder="Playlist Name"
        :show-action-button="false"
        :show-label="false"
        :value="newTitle"
        @input="(input) => (newTitle = input)"
      />
      <h2
        v-else
        class="playlistTitle"
      >
        {{ title }}
      </h2>
      <p>
        {{ videoCount }} {{ $t("Playlist.Videos") }}
        <span v-if="!hideViews && infoSource !== 'user'">
          - {{ viewCount }} {{ $t("Playlist.Views") }}
        </span>
        <span v-if="infoSource !== 'user'">
          <span>- </span>
          <span v-if="infoSource !== 'local'">
            {{ $t("Playlist.Last Updated On") }}
          </span>
          {{ lastUpdated }}
        </span>
      </p>
    </div>

    <ft-input
      v-if="editMode"
      placeholder="Playlist Description"
      :show-action-button="false"
      :show-label="false"
      :value="newDescription"
      @input="(input) => newDescription = input"
    />
    <p
      v-else
      class="playlistDescription"
      v-text="description"
    />

    <hr>

    <div
      class="channelShareWrapper"
    >
      <router-link
        v-if="infoSource !== 'user'"
        class="playlistChannel"
        :to="`/channel/${channelId}`"
      >
        <img
          class="channelThumbnail"
          :src="channelThumbnail"
          alt=""
        >
        <h3
          class="channelName"
        >
          {{ channelName }}
        </h3>
      </router-link>

      <br>
      <ft-flex-box
        v-if="editMode"
      >
        <ft-icon-button
          title="Save Changes"
          :icon="['fas', 'save']"
          theme="primary"
          @click="savePlaylistInfo"
        />
        <ft-icon-button
          title="Cancel"
          :icon="['fas', 'times']"
          theme="primary"
          @click="exitEditMode"
        />
      </ft-flex-box>
      <ft-flex-box
        v-else
      >
        <ft-icon-button
          title="Copy Playlist"
          :icon="['fas', 'copy']"
          theme="primary"
          @click="copyPlaylist"
        />
        <ft-icon-button
          v-if="infoSource === 'user'"
          title="Edit Playlist"
          :icon="['fas', 'edit']"
          theme="primary"
          @click="enterEditMode"
        />
        <ft-icon-button
          v-if="infoSource === 'user'"
          title="Remove Watched Videos"
          :icon="['fas', 'eye-slash']"
          theme="primary"
          @click="showRemoveVideosOnWatchPrompt = true"
        />
        <ft-icon-button
          v-if="infoSource === 'user'"
          title="Delete Playlist"
          :icon="['fas', 'trash']"
          theme="primary"
          @click="showDeletePlaylistPrompt = true"
        />
      </ft-flex-box>

      <ft-share-button
        v-if="!hideSharingActions"
        :id="id"
        :dropdown-position-y="description ? 'top' : 'bottom'"
        share-target-type="Playlist"
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
  </div>
</template>

<script src="./playlist-info.js" />
<style scoped lang="scss" src="./playlist-info.scss" />
