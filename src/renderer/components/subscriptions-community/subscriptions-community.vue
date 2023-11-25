<template>
  <subscriptions-tab-ui
    :is-loading="isLoading"
    :video-list="postList"
    :error-channels="errorChannels"
    :attempted-fetch="attemptedFetch"
    :is-community="true"
    :initial-data-limit="20"
    :last-refresh-timestamp="lastCommunityRefreshTimestamp"
    :title="$t('Global.Community')"
    @refresh="loadPostsForSubscriptionsFromRemote"
  />
</template>

<script src="./subscriptions-community.js" />
