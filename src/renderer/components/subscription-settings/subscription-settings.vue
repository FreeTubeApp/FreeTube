<template>
  <ft-card
    class="relative card"
  >
    <h3
      class="videoTitle"
    >
      {{ $t("Settings.Subscription Settings.Subscription Settings") }}
    </h3>
    <ft-flex-box class="subscriptionSettingsFlexBox">
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
    </ft-flex-box>
    <br>
    <ft-flex-box>
      <ft-select
        v-if="false"
        placeholder="Subscription View Type"
        :value="viewValues[0]"
        :select-names="viewNames"
        :select-values="viewValues"
      />
    </ft-flex-box>
    <br>
    <ft-flex-box>
      <ft-button
        v-if="false"
        label="Manage My Subscriptions"
      />
    </ft-flex-box>
  </ft-card>
</template>

<script src="./subscription-settings.js" />
<style scoped src="./subscription-settings.css" />
