<template>
  <ft-card
    class="relative card"
  >
    <h3
      class="videoTitle"
    >
      {{ $t("Settings.Distraction Free Settings.Distraction Free Settings") }}
    </h3>
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
        </div>
        <div class="switchColumn">
        <ft-toggle-switch
          :label="$t('Settings.Distraction Free Settings.Hide Recommended Videos')"
          :compact="true"
          :default-value="hideRecommendedVideos"
          @change="updateHideRecommendedVideos"
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
          :label="$t('Settings.Distraction Free Settings.Hide Live Chat')"
          :compact="true"
          :default-value="hideLiveChat"
          @change="updateHideLiveChat"
        />
        </div>
      </div>
      <br>
      <ft-flex-box>
        <ft-select
          v-if="false"
          placeholder="Distraction View Type"
          :value="viewValues[0]"
          :select-names="viewNames"
          :select-values="viewValues"
        />
      </ft-flex-box>
      <br>
      <ft-flex-box>
        <ft-button
          v-if="false"
          label="Manage My Distractions"
        />
      </ft-flex-box>
    </ft-card>
  </template>

<script src="./distraction-settings.js" />
<style scoped lang="sass" src="./distraction-settings.sass" />
