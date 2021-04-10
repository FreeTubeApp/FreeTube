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
    <div class="videoArea">
      <div class="videoAreaMargin">
        <ft-video-player
          v-if="!isLoading && !hidePlayer && !isUpcoming"
          ref="videoPlayer"
          :dash-src="dashSrc"
          :source-list="activeSourceList"
          :caption-hybrid-list="captionHybridList"
          :storyboard-src="videoStoryboardSrc"
          :format="activeFormat"
          :thumbnail="thumbnail"
          class="videoPlayer"
          :class="{ theatrePlayer: useTheatreMode }"
          @ready="checkIfWatched"
          @ended="handleVideoEnded"
          @error="handleVideoError"
          @store-caption-list="captionHybridList = $event"
        />
        <div
          v-if="!isLoading && isUpcoming"
          class="videoPlayer"
        >
          <img
            :src="thumbnail"
            class="upcomingThumbnail"
          >
          <div
            class="premiereDate"
          >
            <font-awesome-icon
              icon="satellite-dish"
              class="premiereIcon"
            />
            <p
              v-if="upcomingTimestamp !== null"
              class="premiereText"
            >
              Premieres on:
              <br>
              {{ upcomingTimestamp }}
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
    <div class="infoArea">
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
        :watching-playlist="watchingPlaylist"
        :theatre-possible="theatrePossible"
        :length-seconds="videoLengthSeconds"
        :video-thumbnail="thumbnail"
        class="watchVideo"
        :class="{ theatreWatchVideo: useTheatreMode }"
        @theatre-mode="toggleTheatreMode"
      />
      <watch-video-description
        v-if="!isLoading"
        :published="videoPublished"
        :description="videoDescription"
        :description-html="videoDescriptionHtml"
        class="watchVideo"
        :class="{ theatreWatchVideo: useTheatreMode }"
        @timestamp-event="changeTimestamp"
      />
      <watch-video-comments
        v-if="!isLoading && !isLive"
        :id="videoId"
        class="watchVideo"
        :class="{ theatreWatchVideo: useTheatreMode }"
        :channel-thumbnail="channelThumbnail"
        @timestamp-event="changeTimestamp"
      />
    </div>
    <div class="sidebarArea">
      <watch-video-live-chat
        v-if="!isLoading && isLive"
        :video-id="videoId"
        :channel-name="channelName"
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
<style scoped src="./Watch.sass" lang="sass" />
