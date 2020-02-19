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
      v-if="!isLoading"
      :id="videoId"
      class="watchVideo"
      :class="{ theatreWatchVideo: useTheatreMode }"
    />
    <watch-video-recommendations
      v-if="!isLoading"
      :data="recommendedVideos"
      class="watchVideoRecommendations"
      :class="{ theatreRecommendations: useTheatreMode }"
    />
  </div>
</template>

<script src="./Watch.js" />
<style scoped src="./Watch.css" />
