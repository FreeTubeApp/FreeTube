<template>
  <ft-settings-section
    :title="$t('Settings.Distraction Free Settings.Distraction Free Settings')"
  >
    <div class="switchColumnGrid">
      <div class="switchColumn">
        <ft-toggle-switch
          :label="$t('Settings.Distraction Free Settings.Hide Video Views')"
          :compact="true"
          :default-value="hideVideoViews"
          @change="updateHideVideoViews"
        />
        <ft-toggle-switch
          :label="$t('Settings.Distraction Free Settings.Hide Video Likes And Dislikes')"
          :compact="true"
          :default-value="hideVideoLikesAndDislikes"
          @change="updateHideVideoLikesAndDislikes"
        />
        <ft-toggle-switch
          :label="$t('Settings.Distraction Free Settings.Hide Channel Subscribers')"
          :compact="true"
          :default-value="hideChannelSubscriptions"
          @change="updateHideChannelSubscriptions"
        />
        <ft-toggle-switch
          :label="$t('Settings.Distraction Free Settings.Hide Comment Likes')"
          :compact="true"
          :default-value="hideCommentLikes"
          @change="updateHideCommentLikes"
        />
        <ft-toggle-switch
          :label="$t('Settings.Distraction Free Settings.Hide Active Subscriptions')"
          :compact="true"
          :default-value="hideActiveSubscriptions"
          @change="updateHideActiveSubscriptions"
        />
        <ft-toggle-switch
          :label="$t('Settings.Distraction Free Settings.Hide Video Description')"
          :compact="true"
          :default-value="hideVideoDescription"
          @change="updateHideVideoDescription"
        />
        <ft-toggle-switch
          :label="$t('Settings.Distraction Free Settings.Hide Sharing Actions')"
          :compact="true"
          :default-value="hideSharingActions"
          @change="updateHideSharingActions"
        />
        <ft-toggle-switch
          :label="$t('Settings.Distraction Free Settings.Hide Chapters')"
          :compact="true"
          :default-value="hideChapters"
          @change="updateHideChapters"
        />
      </div>
      <div class="switchColumn">
        <ft-toggle-switch
          :label="$t('Settings.Distraction Free Settings.Hide Recommended Videos')"
          :compact="true"
          :default-value="hideRecommendedVideos"
          @change="handleHideRecommendedVideos"
        />
        <ft-toggle-switch
          :label="$t('Settings.Distraction Free Settings.Hide Trending Videos')"
          :compact="true"
          :default-value="hideTrendingVideos"
          @change="updateHideTrendingVideos"
        />
        <ft-toggle-switch
          :label="$t('Settings.Distraction Free Settings.Hide Popular Videos')"
          :compact="true"
          :default-value="hidePopularVideos"
          @change="updateHidePopularVideos"
        />
        <ft-toggle-switch
          :label="$t('Settings.Distraction Free Settings.Hide Playlists')"
          :compact="true"
          :default-value="hidePlaylists"
          @change="updateHidePlaylists"
        />
        <ft-toggle-switch
          :label="$t('Settings.Distraction Free Settings.Hide Live Chat')"
          :compact="true"
          :default-value="hideLiveChat"
          @change="updateHideLiveChat"
        />
        <ft-toggle-switch
          :label="$t('Settings.Distraction Free Settings.Hide Live Streams')"
          :compact="true"
          :default-value="hideLiveStreams"
          @change="updateHideLiveStreams"
        />
        <ft-toggle-switch
          :label="$t('Settings.Distraction Free Settings.Hide Upcoming Premieres')"
          :compact="true"
          :default-value="hideUpcomingPremieres"
          @change="updateHideUpcomingPremieres"
        />
        <ft-toggle-switch
          :label="$t('Settings.Distraction Free Settings.Hide Comments')"
          :compact="true"
          :default-value="hideComments"
          @change="updateHideComments"
        />
        <ft-toggle-switch
          :label="$t('Settings.Distraction Free Settings.Display Titles Without Excessive Capitalisation')"
          :compact="true"
          :default-value="showDistractionFreeTitles"
          @change="updateShowDistractionFreeTitles"
        />
      </div>
    </div>
    <br class="hide-on-mobile">
    <ft-flex-box>
      <ft-input-tags
        :label="$t('Settings.Distraction Free Settings.Hide Channels')"
        :placeholder="$t('Settings.Distraction Free Settings.Hide Channels Placeholder')"
        :show-action-button="true"
        :tag-list="channelsHidden"
        :tooltip="$t('Tooltips.Distraction Free Settings.Hide Channels')"
        @change="handleChannelsHidden"
      />
    </ft-flex-box>
  </ft-settings-section>
</template>

<script src="./distraction-settings.js" />
<style src="./distraction-settings.css" />
