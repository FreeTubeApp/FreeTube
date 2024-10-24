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
        <div class="onlyShowLatestFromChannel">
          <ft-toggle-switch
            :id="'onlyShowLatestFromChannel'"
            :label="onlyShowLatestFromChannel ? $t('Settings.Subscription Settings.Limit the number of videos displayed for each channel to') : $t('Settings.Subscription Settings.Limit the number of videos displayed for each channel')"
            :default-value="onlyShowLatestFromChannel"
            :compact="true"
            @change="updateOnlyShowLatestFromChannel"
          />
          <ft-input
            v-if="onlyShowLatestFromChannel"
            :placeholder="'1'"
            :show-action-button="false"
            input-type="number"
            :value="onlyShowLatestFromChannelNumber"
            :aria-labelledby="'onlyShowLatestFromChannel'"
            @input="updateOnlyShowLatestFromChannelNumber"
          />
        </div>
      </div>
    </div>
  </ft-settings-section>
</template>

<script src="./subscription-settings.js" />
<style lang="scss" src="./subscription-settings.scss"  />
