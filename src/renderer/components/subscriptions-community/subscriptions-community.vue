<template>
  <subscriptions-tab-ui
    :is-loading="isLoading"
    :video-list="videoList"
    :error-channels="errorChannels"
    :attempted-fetch="attemptedFetch"
    :display-list="true"
    @refresh="loadPostsForSubscriptionsFromRemote"
  />
</template>

<script src="./subscriptions-community.js" />
