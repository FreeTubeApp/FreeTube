<template>
  <details>
    <summary>
      <h3>
        {{ $t("Settings.Subscription Settings.Subscription Settings") }}
      </h3>
    </summary>
    <hr>
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
  </details>
</template>

<script src="./subscription-settings.js" />
<style scoped lang="sass" src="./subscription-settings.sass" />
