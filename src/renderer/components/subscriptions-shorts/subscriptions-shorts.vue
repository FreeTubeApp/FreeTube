<template>
  <subscriptions-tab-ui
    :is-loading="isLoading"
    :video-list="videoList"
    :error-channels="errorChannels"
    :attempted-fetch="attemptedFetch"
    :last-refresh-timestamp="lastShortRefreshTimestamp"
    :title="$t('Global.Shorts')"
    @refresh="loadVideosForSubscriptionsFromRemote"
  />
</template>

<script src="./subscriptions-shorts.js" />
