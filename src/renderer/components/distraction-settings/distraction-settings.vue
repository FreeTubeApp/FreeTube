<template>
  <ft-card
    class="relative card"
  >
    <h3
      class="videoTitle"
    >
      {{ $t("Settings.Distraction Settings.Distraction Settings") }}
    </h3>
    <div class="switchColumnGrid">
      <div class="switchColumn">
      <ft-toggle-switch
        :label="$t('Settings.Distraction Settings.Hide Video Views')"
        :default-value="hideVideoViews"
        @change="updateHideVideoViews"
      />
      <ft-toggle-switch
        :label="$t('Settings.Distraction Settings.Hide Video Likes And Dislikes')"
        :default-value="hideVideoLikesAndDislikes"
        @change="updateHideVideoLikesAndDislikes"
      />
      <ft-toggle-switch
        :label="$t('Settings.Distraction Settings.Hide Channel Subscribers')"
        :default-value="hideChannelSubscriptions"
        @change="updateHideChannelSubscriptions"
      />
      <ft-toggle-switch
        :label="$t('Settings.Distraction Settings.Hide Comment Likes')"
        :default-value="hideCommentLikes"
        @change="updateHideCommentLikes"
      />
      </div>
      <div class="switchColumn">
      <ft-toggle-switch
        :label="$t('Settings.Distraction Settings.Hide Recommended Videos')"
        :default-value="hideRecommendedVideos"
        @change="updateHideRecommendedVideos"
      />
      <ft-toggle-switch
        :label="$t('Settings.Distraction Settings.Hide Trending Videos')"
        :default-value="hideTrendingVideos"
        @change="updateHideTrendingVideos"
      />
      <ft-toggle-switch
        :label="$t('Settings.Distraction Settings.Hide Popular Videos')"
        :default-value="hidePopularVideos"
        @change="updateHidePopularVideos"
      />
      <ft-toggle-switch
        :label="$t('Settings.Distraction Settings.Hide Live Chat')"
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
