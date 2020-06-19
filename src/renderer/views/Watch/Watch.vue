<template>
  <div
    class="videoLayout"
    :class="{
      isLoading,
      useTheatreMode
    }"
  >
    <ft-loader
      v-if="isLoading"
      :fullscreen="true"
    />
    <div class="videoArea">
      <div class="videoAreaMargin">
        <ft-video-player
          v-if="!isLoading && !hidePlayer"
          ref="videoPlayer"
          :dash-src="dashSrc"
          :source-list="activeSourceList"
          :caption-list="captionSourceList"
          :storyboard-src="videoStoryboardSrc"
          :format="activeFormat"
          :thumbnail="thumbnail"
          class="videoPlayer"
          :class="{ theatrePlayer: useTheatreMode }"
          @ended="handleVideoEnded"
          @error="handleVideoError"
        />
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
        class="watchVideo"
        :class="{ theatreWatchVideo: useTheatreMode }"
        @theatreMode="toggleTheatreMode"
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
