<template>
  <div class="playlistInfo">
    <div
      class="playlistThumbnail"
    >
      <router-link
        :to="{
          path: `/watch/${firstVideoId}`,
          query: {
            playlistId: id,
            playlistItemId: firstVideoPlaylistItemId,
          },
        }"
        tabindex="-1"
      >
        <img
          :src="thumbnail"
          alt=""
          :style="{filter: blurThumbnailsStyle}"
        >
      </router-link>
    </div>

    <div class="playlistStats">
      <ft-input
        v-if="editMode"
        ref="playlistTitleInput"
        placeholder="Playlist Name"
        :input-tabindex="0"
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
        <span>- </span>
        <span v-if="infoSource !== 'local'">
          {{ $t("Playlist.Last Updated On") }}
        </span>
        {{ lastUpdated }}
      </p>
    </div>

    <ft-input
      v-if="editMode"
      placeholder="Playlist Description"
      :input-tabindex="0"
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
        v-if="infoSource !== 'user' && channelId"
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
      <div
        v-else
        class="playlistChannel"
      >
        <h3
          class="channelName"
        >
          {{ channelName }}
        </h3>
      </div>

      <div class="playlistOptions">
        <ft-icon-button
          v-if="editMode"
          title="Save Changes"
          :icon="['fas', 'save']"
          theme="secondary"
          @click="savePlaylistInfo"
        />
        <ft-icon-button
          v-if="editMode"
          title="Cancel"
          :icon="['fas', 'times']"
          theme="secondary"
          @click="exitEditMode"
        />

        <ft-icon-button
          v-if="!editMode && infoSource === 'user'"
          title="Edit Playlist Info"
          :icon="['fas', 'edit']"
          theme="secondary"
          @click="enterEditMode"
        />
        <ft-icon-button
          v-if="videoCount > 0 && showPlaylists && !editMode"
          title="Copy Playlist"
          :icon="['fas', 'copy']"
          theme="secondary"
          @click="toggleCopyVideosPrompt"
        />
        <ft-icon-button
          v-if="!editMode && infoSource === 'user' && videoCount > 0"
          title="Remove Watched Videos"
          :icon="['fas', 'eye-slash']"
          theme="secondary"
          @click="showRemoveVideosOnWatchPrompt = true"
        />
        <ft-icon-button
          v-if="deletePlaylistButtonVisible"
          title="Delete Playlist"
          :icon="['fas', 'trash']"
          theme="secondary"
          @click="showDeletePlaylistPrompt = true"
        />
        <ft-share-button
          v-if="sharePlaylistButtonVisible"
          :id="id"
          :dropdown-position-y="description ? 'top' : 'bottom'"
          share-target-type="Playlist"
        />
      </div>

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
