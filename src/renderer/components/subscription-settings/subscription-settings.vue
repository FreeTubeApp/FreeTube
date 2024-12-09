<template>
  <ft-settings-section
    :title="$t('Settings.Subscription Settings.Subscription Settings')"
  >
    <div class="switchColumnGrid">
      <div class="switchColumn">
        <ft-toggle-switch
          :label="$t('Settings.Subscription Settings.Fetch Automatically')"
          :default-value="fetchSubscriptionsAutomatically"
          :tooltip="$t('Tooltips.Subscription Settings.Fetch Automatically')"
          :compact="true"
          @change="updateFetchSubscriptionsAutomatically"
        />
        <ft-toggle-switch
          :label="$t('Settings.Subscription Settings.Fetch Feeds from RSS')"
          :default-value="useRssFeeds"
          :tooltip="$t('Tooltips.Subscription Settings.Fetch Feeds from RSS')"
          :compact="true"
          @change="updateUseRssFeeds"
        />
        <ft-toggle-switch
          :label="$t('Settings.Subscription Settings.Confirm Before Unsubscribing')"
          :default-value="unsubscriptionPopupStatus"
          :compact="true"
          @change="updateUnsubscriptionPopupStatus"
        />
      </div>
      <div class="switchColumn">
        <ft-toggle-switch
          :label="$t('Settings.Subscription Settings.Hide Videos on Watch')"
          :default-value="hideWatchedSubs"
          :compact="true"
          @change="updateHideWatchedSubs"
        />
        <ft-toggle-switch
          :label="$t('Settings.Subscription Settings.Limit the number of videos displayed for each channel')"
          :default-value="onlyShowLatestFromChannel"
          :compact="true"
          @change="updateOnlyShowLatestFromChannel"
        />
        <div class="onlyShowLatestFromChannelNumber">
          <ft-slider
            :label="$t('Settings.Subscription Settings.To')"
            :default-value="onlyShowLatestFromChannelNumber"
            :disabled="!onlyShowLatestFromChannel"
            :min-value="1"
            :max-value="30"
            :step="1"
            @change="updateOnlyShowLatestFromChannelNumber"
          />
        </div>
      </div>
    </div>
  </ft-settings-section>
</template>

<script src="./subscription-settings.js" />
<style src="./subscription-settings.css" scoped />
