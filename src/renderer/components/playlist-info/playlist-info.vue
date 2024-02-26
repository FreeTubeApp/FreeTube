<template>
  <div class="playlistInfo">
    <div
      class="playlistThumbnail"
    >
      <router-link
        v-if="firstVideoIdExists"
        class="firstVideoLink"
        :to="{
          path: `/watch/${firstVideoId}`,
          query: {
            playlistId: id,
            playlistType: videoPlaylistType,
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
      <img
        v-else
        :src="thumbnail"
        alt=""
        :style="{filter: blurThumbnailsStyle}"
      >
    </div>

    <div class="playlistStats">
      <ft-input
        v-if="editMode"
        ref="playlistTitleInput"
        :placeholder="$t('User Playlists.Playlist Name')"
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
        {{ $tc('Global.Counts.Video Count', videoCount, {count: parsedVideoCount}) }}
        <span v-if="!hideViews && viewCount != null && !isUserPlaylist">
          - {{ $tc('Global.Counts.View Count', viewCount, {count: parsedViewCount}) }}
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
      :placeholder="$t('User Playlists.Playlist Description')"
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
        v-if="!isUserPlaylist && channelId"
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
          :title="$t('User Playlists.Save Changes')"
          :icon="['fas', 'save']"
          theme="secondary"
          @click="savePlaylistInfo"
        />
        <ft-icon-button
          v-if="editMode"
          :title="$t('User Playlists.Cancel')"
          :icon="['fas', 'times']"
          theme="secondary"
          @click="exitEditMode"
        />

        <ft-icon-button
          v-if="!editMode && isUserPlaylist"
          :title="$t('User Playlists.Edit Playlist Info')"
          :icon="['fas', 'edit']"
          theme="secondary"
          @click="enterEditMode"
        />
        <ft-icon-button
          v-if="videoCount > 0 && showPlaylists && !editMode"
          :title="$t('User Playlists.Copy Playlist')"
          :icon="['fas', 'copy']"
          theme="secondary"
          @click="toggleCopyVideosPrompt"
        />
        <ft-icon-button
          v-if="!editMode && isUserPlaylist && !markedAsQuickBookmarkTarget"
          :title="$t('User Playlists.Enable Quick Bookmark With This Playlist')"
          :icon="['fas', 'link']"
          theme="secondary"
          @click="enableQuickBookmarkForThisPlaylist"
        />
        <ft-icon-button
          v-if="!editMode && isUserPlaylist && markedAsQuickBookmarkTarget"
          :title="$t('User Playlists.Disable Quick Bookmark')"
          :icon="['fas', 'link-slash']"
          theme="secondary"
          @click="disableQuickBookmark"
        />
        <ft-icon-button
          v-if="!editMode && isUserPlaylist && videoCount > 0"
          :title="$t('User Playlists.Remove Watched Videos')"
          :icon="['fas', 'eye-slash']"
          theme="primary"
          @click="showRemoveVideosOnWatchPrompt = true"
        />
        <ft-icon-button
          v-if="deletePlaylistButtonVisible"
          :title="$t('User Playlists.Delete Playlist')"
          :icon="['fas', 'trash']"
          theme="primary"
          @click="showDeletePlaylistPrompt = true"
        />
        <ft-share-button
          v-if="sharePlaylistButtonVisible"
          :id="id"
          class="sharePlaylistIcon"
          :dropdown-position-y="description ? 'top' : 'bottom'"
          :share-target-type="isInvidiousPlaylist ? 'IVPlaylist' : 'Playlist'"
          :invidious-instance="origin"
        />
      </div>

      <ft-prompt
        v-if="showDeletePlaylistPrompt"
        :label="$t('User Playlists.Are you sure you want to delete this playlist? This cannot be undone')"
        :option-names="deletePlaylistPromptNames"
        :option-values="deletePlaylistPromptValues"
        @click="handleDeletePlaylistPromptAnswer"
      />
      <ft-prompt
        v-if="showRemoveVideosOnWatchPrompt"
        :label="$t('User Playlists.Are you sure you want to remove all watched videos from this playlist? This cannot be undone')"
        :option-names="deletePlaylistPromptNames"
        :option-values="deletePlaylistPromptValues"
        @click="handleRemoveVideosOnWatchPromptAnswer"
      />
    </div>
  </div>
</template>

<script src="./playlist-info.js" />
<style scoped lang="scss" src="./playlist-info.scss" />
