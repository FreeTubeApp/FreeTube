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
  </details>
</template>

<script src="./subscription-settings.js" />
<style scoped lang="sass" src="./subscription-settings.sass" />
