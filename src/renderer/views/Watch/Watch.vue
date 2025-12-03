<template>
  <div
    class="videoLayout"
    :class="{
      isLoading,
      useTheatreMode: useTheatreMode && !isLoading,
      noSidebar: !theatrePossible
    }"
  >
    <ft-loader
      v-if="isLoading"
      :fullscreen="true"
    />
    <div
      v-if="(isFamilyFriendly || !showFamilyFriendlyOnly)"
      class="videoArea"
    >
      <div class="videoAreaMargin">
        <ft-shaka-video-player
          v-if="!isLoading && (!isUpcoming || playabilityStatus === 'OK') && !errorMessage"
          ref="player"
          :manifest-src="manifestSrc"
          :manifest-mime-type="manifestMimeType"
          :legacy-formats="legacyFormats"
          :start-time="startTimeSeconds"
          :captions="captions"
          :storyboard-src="videoStoryboardSrc"
          :format="activeFormat"
          :thumbnail="thumbnail"
          :video-id="videoId"
          :chapters="videoChapters"
          :current-chapter-index="videoCurrentChapterIndex"
          :title="videoTitle"
          :theatre-possible="theatrePossible"
          :use-theatre-mode="useTheatreMode"
          :autoplay-possible="autoplayPossible"
          :autoplay-enabled="autoplayEnabled"
          :watching-playlist="watchingPlaylist"
          :vr-projection="vrProjection"
          :start-in-fullscreen="startNextVideoInFullscreen"
          :start-in-fullwindow="startNextVideoInFullwindow"
          :start-in-pip="startNextVideoInPip"
          :current-playback-rate="currentPlaybackRate"
          class="videoPlayer"
          @error="handlePlayerError"
          @loaded="handleVideoLoaded"
          @timeupdate="updateCurrentChapter"
          @ended="handleVideoEnded"
          @toggle-theatre-mode="useTheatreMode = !useTheatreMode"
          @toggle-autoplay="toggleAutoplay"
          @playback-rate-updated="updatePlaybackRate"
          @skip-to-next="handleSkipToNext"
          @skip-to-prev="handleSkipToPrev"
        />
        <div
          v-if="!isLoading && (isUpcoming || errorMessage)"
          class="videoPlayer"
        >
          <img
            v-if="!isUpcoming || playabilityStatus !== 'OK'"
            :src="thumbnail"
            class="videoThumbnail"
            alt=""
          >
          <div
            v-if="isUpcoming"
            class="premiereDate"
            :class="{trailer: isUpcoming && playabilityStatus === 'OK'}"
          >
            <font-awesome-icon
              :icon="['fas', 'satellite-dish']"
              class="premiereIcon"
            />
            <p
              v-if="upcomingTimestamp !== null"
              class="premiereText"
            >
              <span
                class="premiereTextTimeLeft"
              >
                {{ $t("Video.Premieres") }} {{ upcomingTimeLeft }}
              </span>
              <br>
              <span
                class="premiereTextTimestamp"
              >
                {{ upcomingTimestamp }}
              </span>
            </p>
            <p
              v-else
              class="premiereText"
            >
              {{ $t("Video.Starting soon, please refresh the page to check again") }}
            </p>
          </div>
          <div
            v-else-if="errorMessage"
            class="errorContainer"
          >
            <div
              class="errorWrapper"
            >
              <font-awesome-icon
                :icon="customErrorIcon || ['fas', 'exclamation-circle']"
                aria-hidden="true"
                class="errorIcon"
              />
              <p
                class="errorMessage"
              >
                {{ errorMessage }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <ft-age-restricted
      v-if="(!isLoading && !isFamilyFriendly && showFamilyFriendlyOnly)"
      class="ageRestricted"
    />
    <div
      v-if="(isFamilyFriendly || !showFamilyFriendlyOnly)"
      ref="infoArea"
      class="infoArea"
      :class="{ infoAreaSticky }"
    >
      <watch-video-info
        v-if="!isLoading"
        :id="videoId"
        :title="videoTitle"
        :channel-id="channelId"
        :channel-name="channelName"
        :channel-thumbnail="channelThumbnail"
        :published="videoPublished"
        :premiere-date="premiereDate"
        :subscription-count-text="channelSubscriptionCountText"
        :like-count="videoLikeCount"
        :dislike-count="videoDislikeCount"
        :view-count="videoViewCount"
        :get-timestamp="getTimestamp"
        :is-live-content="isLiveContent"
        :is-live="isLive"
        :is-upcoming="isUpcoming"
        :download-links="downloadLinks"
        :playlist-id="playlistId"
        :get-playlist-index="getPlaylistIndex"
        :get-playlist-reverse="getPlaylistReverse"
        :get-playlist-shuffle="getPlaylistShuffle"
        :get-playlist-loop="getPlaylistLoop"
        :length-seconds="videoLengthSeconds"
        :video-thumbnail="thumbnail"
        :in-user-playlist="!!selectedUserPlaylist"
        :is-unlisted="isUnlisted"
        :can-save-watched-progress="canSaveWatchProgress"
        class="watchVideo"
        :class="{ theatreWatchVideo: useTheatreMode }"
        @change-format="handleFormatChange"
        @pause-player="pausePlayer"
        @set-info-area-sticky="infoAreaSticky = $event"
        @scroll-to-info-area="$refs.infoArea.scrollIntoView()"
        @save-watched-progress="handleWatchProgressManualSave"
      />
      <watch-video-chapters
        v-if="!hideChapters && !isLoading && videoChapters.length > 0"
        :chapters="videoChapters"
        :current-chapter-index="videoCurrentChapterIndex"
        :kind="videoChaptersKind"
        class="watchVideo"
        :class="{ theatreWatchVideo: useTheatreMode }"
        @timestamp-event="changeTimestamp"
      />
      <watch-video-description
        v-if="!isLoading && !hideVideoDescription"
        :description="videoDescription"
        :description-html="videoDescriptionHtml"
        :license="license"
        class="watchVideo"
        :class="{ theatreWatchVideo: useTheatreMode }"
        @timestamp-event="changeTimestamp"
      />
      <CommentSection
        v-if="!isLoading && !isLive && !hideComments"
        :id="videoId"
        class="watchVideo"
        :class="{ theatreWatchVideo: useTheatreMode }"
        :channel-thumbnail="channelThumbnail"
        :channel-name="channelName"
        :video-player-ready="videoPlayerLoaded"
        @timestamp-event="changeTimestamp"
      />
    </div>
    <div
      v-if="(isFamilyFriendly || !showFamilyFriendlyOnly)"
      class="sidebarArea"
    >
      <watch-video-live-chat
        v-if="!isLoading && !hideLiveChat && (isLive || isUpcoming)"
        :live-chat="liveChat"
        :video-id="videoId"
        :channel-id="channelId"
        class="watchVideoSideBar watchVideoPlaylist"
        :class="{ theatrePlaylist: useTheatreMode }"
      />
      <watch-video-playlist
        v-if="watchingPlaylist"
        v-show="!isLoading"
        ref="watchVideoPlaylist"
        :watch-view-loading="isLoading"
        :playlist-id="playlistId"
        :playlist-type="playlistType"
        :video-id="videoId"
        :playlist-item-id="playlistItemId"
        class="watchVideoSideBar watchVideoPlaylist"
        :class="{ theatrePlaylist: useTheatreMode }"
        @pause-player="pausePlayer"
      />
      <watch-video-recommendations
        v-if="!isLoading && !hideRecommendedVideos"
        :data="recommendedVideos"
        class="watchVideoSideBar watchVideoRecommendations"
        :class="{
          theatreRecommendations: useTheatreMode,
          watchVideoRecommendationsLowerCard: watchingPlaylist || isLive,
          watchVideoRecommendationsNoCard: !watchingPlaylist || !isLive
        }"
        @pause-player="pausePlayer"
      />
    </div>
  </div>
</template>

<script src="./Watch.js" />
<style scoped src="./Watch.scss" lang="scss" />
