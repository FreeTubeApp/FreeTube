<template>
  <ft-settings-section
    :title="$t('Settings.Subscription Settings.Subscription Settings')"
  >
    <ft-flex-box class="settingsFlexStart500px">
      <ft-toggle-switch
        :label="$t('Settings.Subscription Settings.Hide Videos on Watch')"
        :default-value="hideWatchedSubs"
        @change="updateHideWatchedSubs"
      />
      <ft-toggle-switch
        :label="$t('Settings.Subscription Settings.Fetch Feeds from RSS')"
        :default-value="useRssFeeds"
        :tooltip="$t('Tooltips.Subscription Settings.Fetch Feeds from RSS')"
        @change="updateUseRssFeeds"
      />
      <ft-toggle-switch
        :label="$t('Settings.Subscription Settings.Fetch Automatically')"
        :default-value="fetchSubscriptionsAutomatically"
        :tooltip="$t('Tooltips.Subscription Settings.Fetch Automatically')"
        @change="updateFetchSubscriptionsAutomatically"
      />
    </ft-flex-box>
  </ft-settings-section>
</template>

<script src="./subscription-settings.js" />
