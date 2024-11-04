<template>
  <div
    class="playlistInfo"
    :class="{ [theme]: true }"
  >
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
      <template
        v-if="editMode"
      >
        <ft-input
          ref="playlistTitleInput"
          class="inputElement"
          :placeholder="$t('User Playlists.Playlist Name')"
          :show-action-button="false"
          :show-label="false"
          :value="newTitle"
          :maxlength="255"
          @input="handlePlaylistNameInput"
          @keydown.enter.native="savePlaylistInfo"
        />
        <ft-flex-box v-if="inputPlaylistNameEmpty || inputPlaylistNameBlank">
          <p>
            {{ $t('User Playlists.SinglePlaylistView.Toast["Playlist name cannot be empty. Please input a name."]') }}
          </p>
        </ft-flex-box>
        <ft-flex-box v-if="inputPlaylistWithNameExists">
          <p>
            {{ $t('User Playlists.CreatePlaylistPrompt.Toast["There is already a playlist with this name. Please pick a different name."]') }}
          </p>
        </ft-flex-box>
      </template>
      <template
        v-else
      >
        <h2
          class="playlistTitle"
        >
          {{ title }}
        </h2>
        <p>
          {{ $tc('Global.Counts.Video Count', videoCount, {count: parsedVideoCount}) }}
          <span v-if="!hideViews && !isUserPlaylist">
            - {{ $tc('Global.Counts.View Count', viewCount, {count: parsedViewCount}) }}
          </span>
          <span>- </span>
          <span v-if="infoSource !== 'local'">
            {{ $t("Playlist.Last Updated On") }}
          </span>
          {{ lastUpdated }}
        </p>
      </template>
    </div>

    <ft-input
      v-if="editMode"
      class="inputElement descriptionInput"
      :placeholder="$t('User Playlists.Playlist Description')"
      :show-action-button="false"
      :show-label="false"
      :value="newDescription"
      @input="(input) => newDescription = input"
      @keydown.enter.native="savePlaylistInfo"
    />
    <p
      v-else
      class="playlistDescription"
      v-text="description"
    />

    <hr class="playlistInfoSeparator">

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

      <div class="playlistOptionsAndSearch">
        <div class="playlistOptions">
          <ft-icon-button
            v-if="editMode"
            :title="$t('User Playlists.Save Changes')"
            :disabled="playlistPersistenceDisabled"
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
            :title="markedAsQuickBookmarkTarget ? $t('User Playlists.Quick Bookmark Enabled') : $t('User Playlists.Enable Quick Bookmark With This Playlist')"
            :icon="markedAsQuickBookmarkTarget ? ['fas', 'bookmark'] : ['far', 'bookmark']"
            :disabled="markedAsQuickBookmarkTarget"
            :theme="markedAsQuickBookmarkTarget ? 'secondary' : 'base-no-default'"
            @disabled-click="handleQuickBookmarkEnabledDisabledClick"
            @click="enableQuickBookmarkForThisPlaylist"
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
            v-if="exportPlaylistButtonVisible"
            :title="$t('User Playlists.Export Playlist')"
            :icon="['fas', 'file-arrow-down']"
            theme="secondary"
            @click="handlePlaylistExport"
          />
          <ft-icon-button
            v-if="!editMode && userPlaylistDuplicateItemCount > 0"
            :title="$t('User Playlists.Remove Duplicate Videos')"
            :icon="['fas', 'users-slash']"
            theme="destructive"
            @click="showRemoveDuplicateVideosPrompt = true"
          />
          <ft-icon-button
            v-if="!editMode && userPlaylistAnyVideoWatched"
            :title="$t('User Playlists.Remove Watched Videos')"
            :icon="['fas', 'eye-slash']"
            theme="destructive"
            @click="showRemoveVideosOnWatchPrompt = true"
          />
          <ft-icon-button
            v-if="deletePlaylistButtonVisible"
            :disabled="markedAsQuickBookmarkTarget"
            :title="!markedAsQuickBookmarkTarget ? $t('User Playlists.Delete Playlist') : playlistDeletionDisabledLabel"
            :icon="['fas', 'trash']"
            theme="destructive"
            @disabled-click="handlePlaylistDeleteDisabledClick"
            @click="showDeletePlaylistPrompt = true"
          />
          <ft-share-button
            v-if="sharePlaylistButtonVisible"
            :id="id"
            class="sharePlaylistIcon"
            :dropdown-position-y="description ? 'top' : 'bottom'"
            share-target-type="Playlist"
          />
        </div>
        <div
          v-if="searchVideoModeAllowed"
          class="searchInputsRow"
        >
          <ft-input
            ref="searchInput"
            class="inputElement"
            :placeholder="$t('User Playlists.SinglePlaylistView.Search for Videos')"
            :show-clear-text-button="true"
            :show-action-button="false"
            :value="query"
            :maxlength="255"
            @input="(input) => updateQueryDebounce(input)"
            @clear="updateQueryDebounce('')"
          />
        </div>
      </div>
      <ft-prompt
        v-if="showDeletePlaylistPrompt"
        :label="$t('User Playlists.Are you sure you want to delete this playlist? This cannot be undone')"
        :option-names="deletePlaylistPromptNames"
        :option-values="deletePlaylistPromptValues"
        :is-first-option-destructive="true"
        @click="handleDeletePlaylistPromptAnswer"
      />
      <ft-prompt
        v-if="showRemoveVideosOnWatchPrompt"
        :label="removeVideosOnWatchPromptLabelText"
        :option-names="deletePlaylistPromptNames"
        :option-values="deletePlaylistPromptValues"
        :is-first-option-destructive="true"
        @click="handleRemoveVideosOnWatchPromptAnswer"
      />
      <ft-prompt
        v-if="showRemoveDuplicateVideosPrompt"
        :label="removeDuplicateVideosPromptLabelText"
        :option-names="deletePlaylistPromptNames"
        :option-values="deletePlaylistPromptValues"
        :is-first-option-destructive="true"
        @click="handleRemoveDuplicateVideosPromptAnswer"
      />
    </div>
  </div>
</template>

<script src="./playlist-info.js" />
<style scoped lang="scss" src="./playlist-info.scss" />
