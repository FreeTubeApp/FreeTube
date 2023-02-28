<template>
  <div
    class="videoLayout"
    :class="{
      isLoading,
      useTheatreMode,
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
        <ft-video-player
          v-if="!isLoading && !hidePlayer && !isUpcoming"
          ref="videoPlayer"
          :dash-src="dashSrc"
          :source-list="activeSourceList"
          :adaptive-formats="adaptiveFormats"
          :caption-hybrid-list="captionHybridList"
          :storyboard-src="videoStoryboardSrc"
          :format="activeFormat"
          :thumbnail="thumbnail"
          :video-id="videoId"
          :length-seconds="videoLengthSeconds"
          :chapters="videoChapters"
          class="videoPlayer"
          :class="{ theatrePlayer: useTheatreMode }"
          @ready="checkIfWatched"
          @ended="handleVideoEnded"
          @error="handleVideoError"
          @store-caption-list="captionHybridList = $event"
          v-on="!hideChapters && videoChapters.length > 0 ? { timeupdate: updateCurrentChapter } : {}"
        />
        <div
          v-if="!isLoading && isUpcoming"
          class="videoPlayer"
        >
          <img
            :src="thumbnail"
            class="upcomingThumbnail"
            alt=""
          >
          <div
            class="premiereDate"
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
        </div>
      </div>
    </div>
    <ft-age-restricted
      v-if="(!isLoading && !isFamilyFriendly && showFamilyFriendlyOnly)"
      class="ageRestricted"
      :content-type-string="'Video'"
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
        :watching-playlist="watchingPlaylist"
        :get-playlist-index="getPlaylistIndex"
        :get-playlist-reverse="getPlaylistReverse"
        :get-playlist-shuffle="getPlaylistShuffle"
        :get-playlist-loop="getPlaylistLoop"
        :theatre-possible="theatrePossible"
        :length-seconds="videoLengthSeconds"
        :video-thumbnail="thumbnail"
        class="watchVideo"
        :class="{ theatreWatchVideo: useTheatreMode }"
        @pause-player="pausePlayer"
      />
      <watch-video-chapters
        v-if="!hideChapters && !isLoading && videoChapters.length > 0"
        :chapters="videoChapters"
        :current-chapter-index="videoCurrentChapterIndex"
        class="watchVideo"
        :class="{ theatreWatchVideo: useTheatreMode }"
        @timestamp-event="changeTimestamp"
      />
      <watch-video-description
        v-if="!isLoading && !hideVideoDescription"
        :published="videoPublished"
        :description="videoDescription"
        :description-html="videoDescriptionHtml"
        class="watchVideo"
        :class="{ theatreWatchVideo: useTheatreMode }"
        @timestamp-event="changeTimestamp"
      />
      <watch-video-comments
        v-if="!isLoading && !isLive && !hideComments"
        :id="videoId"
        class="watchVideo"
        :class="{ theatreWatchVideo: useTheatreMode }"
        :channel-thumbnail="channelThumbnail"
        :channel-name="channelName"
        @timestamp-event="changeTimestamp"
      />
    </div>
    <div
      v-if="(isFamilyFriendly || !showFamilyFriendlyOnly)"
      class="sidebarArea"
    >
      <watch-video-live-chat
        v-if="!isLoading && !hideLiveChat && isLive"
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
        :playlist-id="playlistId"
        :video-id="videoId"
        class="watchVideoSideBar watchVideoPlaylist"
        :class="{ theatrePlaylist: useTheatreMode }"
        @pause-player="pausePlayer"
      />
      <watch-video-recommendations
        v-if="!isLoading"
        :show-autoplay="!watchingPlaylist"
        :data="recommendedVideos"
        class="watchVideoSideBar watchVideoRecommendations"
        :class="{
          theatreRecommendations: useTheatreMode,
          watchVideoRecommendationsLowerCard: watchingPlaylist || isLive,
          watchVideoRecommendationsNoCard: !watchingPlaylist || !isLive
        }"
      />
    </div>
  </div>
</template>

<script src="./Watch.js" />
<style scoped src="./Watch.scss" lang="scss" />
