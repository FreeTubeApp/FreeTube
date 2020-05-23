<template>
  <div>
    <ft-loader
      v-if="isLoading"
      :fullscreen="true"
    />
    <ft-video-player
      v-if="!isLoading && !hidePlayer"
      :dash-src="dashSrc"
      :source-list="videoSourceList"
      :caption-list="captionSourceList"
      :storyboard-src="videoStoryboardSrc"
      :format="activeFormat"
      class="videoPlayer"
      :class="{ theatrePlayer: useTheatreMode }"
      ref="videoPlayer"
      @ended="handleVideoEnded"
      @error="handleVideoError"
    />
    <watch-video-info
      v-if="!isLoading"
      :id="videoId"
      :title="videoTitle"
      :channel-id="channelId"
      :channel-name="channelName"
      :channel-thumbnail="channelThumbnail"
      :subscription-count-text="channelSubscriptionCountText"
      :like-count="videoLikeCount"
      :dislike-count="videoDislikeCount"
      :view-count="videoViewCount"
      @theatreMode="toggleTheatreMode"
      class="watchVideo"
      :class="{ theatreWatchVideo: useTheatreMode }"
    />
    <watch-video-description
      v-if="!isLoading"
      :published="videoPublished"
      :description="videoDescription"
      :description-html="videoDescriptionHtml"
      class="watchVideo"
      :class="{ theatreWatchVideo: useTheatreMode }"
    />
    <watch-video-comments
      v-if="!isLoading && !isLive"
      :id="videoId"
      class="watchVideo"
      :class="{ theatreWatchVideo: useTheatreMode }"
    />
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
      :playlist-id="playlistId"
      :video-id="videoId"
      ref="watchVideoPlaylist"
      class="watchVideoSideBar watchVideoPlaylist"
      :class="{ theatrePlaylist: useTheatreMode }"
    />
    <watch-video-recommendations
      v-if="!isLoading"
      :data="recommendedVideos"
      class="watchVideoSideBar watchVideoRecommendations"
      :class="{
        theatreRecommendations: useTheatreMode,
        watchVideoRecommendationsLowerCard: watchingPlaylist || isLive,
        watchVideoRecommendationsNoCard: !watchingPlaylist || !isLive
      }"
    />
  </div>
</template>

<script src="./Watch.js" />
<style scoped src="./Watch.css" />
