<template>
  <div
    class="ft-list-video ft-list-item"
    :class="{
      list: effectiveListTypeIsList,
      grid: !effectiveListTypeIsList,
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
        :to="watchVideoRouterLink"
        @click.native="handleWatchPageLinkClick"
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
        v-if="externalPlayer !== '' && !externalPlayerIsDefaultViewingMode"
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
          :icon="isInQuickBookmarkPlaylist ? ['fas', 'check'] : ['fas', 'bookmark']"
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
          :icon="effectiveListTypeIsList ? ['fas', 'arrow-up'] : ['fas', 'arrow-left']"
          class="upArrowIcon"
          :padding="appearance === `watchPlaylistItem` ? 5 : 6"
          :size="appearance === `watchPlaylistItem` ? 14 : 18"
          @click="moveVideoUp"
        />
        <ft-icon-button
          v-if="inUserPlaylist && canMoveVideoDown"
          :title="$t('User Playlists.Move Video Down')"
          :icon="effectiveListTypeIsList ? ['fas', 'arrow-down'] : ['fas', 'arrow-right']"
          class="downArrowIcon"
          :padding="appearance === `watchPlaylistItem` ? 5 : 6"
          :size="appearance === `watchPlaylistItem` ? 14 : 18"
          @click="moveVideoDown"
        />
        <ft-icon-button
          v-if="inUserPlaylist && canRemoveFromPlaylist"
          :title="$t('User Playlists.Remove from Playlist')"
          :icon="['fas', 'trash']"
          class="trashIcon"
          :padding="appearance === `watchPlaylistItem` ? 5 : 6"
          :size="appearance === `watchPlaylistItem` ? 14 : 18"
          @click="removeFromPlaylist"
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
        :to="watchVideoRouterLink"
        @click.native="handleWatchPageLinkClick"
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
      <div
        v-if="is4k || hasCaptions || is8k || isNew || isVr180 || isVr360 || is3D"
        class="videoTagLine"
      >
        <div
          v-if="isNew"
          class="videoTag"
          :aria-label="$t('Search Listing.Label.New')"
          role="img"
        >
          {{ $t('Search Listing.Label.New') }}
        </div>
        <div
          v-if="is4k"
          class="videoTag"
          :aria-label="$t('Search Listing.Label.4K')"
          role="img"
        >
          {{ $t('Search Listing.Label.4K') }}
        </div>
        <div
          v-if="is8k"
          class="videoTag"
          :aria-label="$t('Search Listing.Label.8K')"
          role="img"
        >
          {{ $t('Search Listing.Label.8K') }}
        </div>
        <div
          v-if="isVr180"
          class="videoTag"
          :aria-label="$t('Search Listing.Label.VR180')"
          role="img"
        >
          {{ $t('Search Listing.Label.VR180') }}
        </div>
        <div
          v-if="isVr360"
          class="videoTag"
          :aria-label="$t('Search Listing.Label.360 Video')"
          role="img"
        >
          {{ $t('Search Listing.Label.360 Video') }}
        </div>
        <div
          v-if="is3D"
          class="videoTag"
          :aria-label="$t('Search Listing.Label.3D')"
          role="img"
        >
          {{ $t('Search Listing.Label.3D') }}
        </div>
        <div
          v-if="hasCaptions"
          class="videoTag"
          :aria-label="$t('Search Listing.Label.Closed Captions')"
          role="img"
        >
          {{ $t('Search Listing.Label.Subtitles') }}
        </div>
      </div>
      <div class="buttonStack">
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
        <font-awesome-icon
          v-if="deArrowChangedContent || deArrowTogglePinned"
          :title="deArrowToggleTitle"
          :icon="['far', 'dot-circle']"
          class="optionsButton deArrowToggleButton"
          :class="{ alwaysVisible: deArrowTogglePinned }"
          tabindex="0"
          role="button"
          @click="toggleDeArrow"
          @keydown.enter.prevent="toggleDeArrow"
          @keydown.space.prevent="toggleDeArrow"
        />
      </div>
      <p
        v-if="description && effectiveListTypeIsList && appearance === 'result'"
        class="description"
        v-html="description"
      />
    </div>
  </div>
</template>

<script src="./ft-list-video.js" />
<style scoped src="./ft-list-video.scss" lang="scss" />
