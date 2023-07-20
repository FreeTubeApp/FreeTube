<template>
  <subscriptions-tab-ui
    :is-loading="isLoading"
    :video-list="videoList"
    :error-channels="errorChannels"
    :attempted-fetch="attemptedFetch"
    @refresh="loadVideosForSubscriptionsFromRemote"
  />
</template>

<script src="./subscriptions-shorts.js" />
