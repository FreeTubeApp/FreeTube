<template>
  <subscriptions-tab-ui
    :is-loading="isLoading"
    :video-list="videoList"
    :error-channels="errorChannels"
    :last-refresh-timestamp="lastVideoRefreshTimestamp"
    :attempted-fetch="attemptedFetch"
    @refresh="loadVideosForSubscriptionsFromRemote"
  />
</template>

<script src="./subscriptions-videos.js" />
