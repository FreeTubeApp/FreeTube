<template>
  <div
    class="ft-list-video ft-list-item"
    :class="{
      list: (listType === 'list' || forceListType === 'list') && forceListType !== 'grid',
      grid: (listType === 'grid' || forceListType === 'list') && forceListType !== 'list',
      [appearance]: true,
      watched: addWatchedStyle
    }"
  >
    <div
      class="videoThumbnail"
    >
      <router-link
        class="thumbnailLink"
        tabindex="-1"
        :to="watchPageLinkTo"
      >
        <img
          :src="thumbnail"
          class="thumbnailImage"
          alt=""
          :style="{filter: blurThumbnailsStyle}"
        >
      </router-link>
      <div
        v-if="isLive || isUpcoming || (displayDuration !== '' && displayDuration !== '0:00')"
        class="videoDuration"
        :class="{
          live: isLive,
          upcoming: isUpcoming
        }"
      >
        {{ isLive ? $t("Video.Live") : (isUpcoming ? $t("Video.Upcoming") : displayDuration) }}
      </div>
      <ft-icon-button
        v-if="externalPlayer !== ''"
        :title="$t('Video.External Player.OpenInTemplate', { externalPlayer })"
        :icon="['fas', 'external-link-alt']"
        class="externalPlayerIcon"
        theme="base"
        :padding="appearance === `watchPlaylistItem` ? 6 : 7"
        :size="appearance === `watchPlaylistItem` ? 12 : 16"
        @click="handleExternalPlayer"
      />
      <span class="playlistIcons">
        <ft-icon-button
          v-if="showPlaylists"
          ref="addToPlaylistIcon"
          :title="$t('User Playlists.Add to Playlist')"
          :icon="['fas', 'plus']"
          class="addToPlaylistIcon"
          :class="alwaysShowAddToPlaylistButton ? 'alwaysVisible' : ''"
          :padding="appearance === `watchPlaylistItem` ? 5 : 6"
          :size="appearance === `watchPlaylistItem` ? 14 : 18"
          @click="togglePlaylistPrompt"
        />
        <ft-icon-button
          v-if="isQuickBookmarkEnabled && quickBookmarkButtonEnabled"
          :title="quickBookmarkIconText"
          :icon="['fas', 'star']"
          class="quickBookmarkVideoIcon"
          :class="{
            bookmarked: isInQuickBookmarkPlaylist,
            alwaysVisible: alwaysShowAddToPlaylistButton,
          }"
          :theme="quickBookmarkIconTheme"
          :padding="appearance === `watchPlaylistItem` ? 5 : 6"
          :size="appearance === `watchPlaylistItem` ? 14 : 18"
          @click="toggleQuickBookmarked"
        />
        <ft-icon-button
          v-if="inUserPlaylist && canMoveVideoUp"
          :title="$t('User Playlists.Move Video Up')"
          :icon="['fas', 'arrow-up']"
          class="upArrowIcon"
          :padding="appearance === `watchPlaylistItem` ? 5 : 6"
          :size="appearance === `watchPlaylistItem` ? 14 : 18"
          @click="$emit('move-video-up')"
        />
        <ft-icon-button
          v-if="inUserPlaylist && canMoveVideoDown"
          :title="$t('User Playlists.Move Video Down')"
          :icon="['fas', 'arrow-down']"
          class="downArrowIcon"
          :padding="appearance === `watchPlaylistItem` ? 5 : 6"
          :size="appearance === `watchPlaylistItem` ? 14 : 18"
          @click="$emit('move-video-down')"
        />
        <ft-icon-button
          v-if="inUserPlaylist && canRemoveFromPlaylist"
          :title="$t('User Playlists.Remove from Playlist')"
          :icon="['fas', 'trash']"
          class="trashIcon"
          :padding="appearance === `watchPlaylistItem` ? 5 : 6"
          :size="appearance === `watchPlaylistItem` ? 14 : 18"
          @click="$emit('remove-from-playlist')"
        />
      </span>
      <div
        v-if="addWatchedStyle"
        class="videoWatched"
      >
        {{ $t("Video.Watched") }}
      </div>
      <div
        v-if="historyEntryExists"
        class="watchedProgressBar"
        :style="{inlineSize: progressPercentage + '%'}"
      />
    </div>
    <div class="info">
      <router-link
        class="title"
        :to="watchPageLinkTo"
      >
        <h3 class="h3Title">
          {{ displayTitle }}
        </h3>
      </router-link>
      <div class="infoLine">
        <router-link
          v-if="channelId !== null"
          class="channelName"
          :to="`/channel/${channelId}`"
        >
          <span>{{ channelName }}</span>
        </router-link>
        <span v-else-if="channelName !== null">
          {{ channelName }}
        </span>
        <span
          v-if="!isLive && !isUpcoming && !isPremium && !hideViews && viewCount != null"
          class="viewCount"
        >
          <template v-if="channelId !== null || channelName !== null"> • </template>
          {{ $tc('Global.Counts.View Count', viewCount, {count: parsedViewCount}) }}
        </span>
        <span
          v-if="uploadedTime !== '' && !isLive"
          class="uploadedTime"
        > • {{ uploadedTime }}</span>
        <span
          v-if="isLive && !hideViews"
          class="viewCount"
        > • {{ $tc('Global.Counts.Watching Count', viewCount, {count: parsedViewCount}) }}</span>
      </div>
      <ft-icon-button
        class="optionsButton"
        :icon="['fas', 'ellipsis-v']"
        :title="$t('Video.More Options')"
        theme="base-no-default"
        :size="16"
        :use-shadow="false"
        dropdown-position-x="left"
        :dropdown-options="dropdownOptions"
        @click="handleOptionsClick"
      />
      <p
        v-if="description && ((listType === 'list' || forceListType === 'list') && forceListType !== 'grid') &&
          appearance === 'result'"
        class="description"
        v-html="description"
      />
    </div>
  </div>
</template>

<script src="./ft-list-video.js" />
<style scoped src="./ft-list-video.scss" lang="scss" />
