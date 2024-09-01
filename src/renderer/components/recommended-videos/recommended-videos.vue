<template>
  <recommended-tab-ui
    :is-loading="isLoading"
    :video-list="videoList"
    :last-refresh-timestamp="lastVideoRefreshTimestamp"
    :attempted-fetch="attemptedFetch"
    :title="$t('Global.Videos')"
    @refresh="loadVideosForSubscriptionsFromRemote"
  />
</template>

<script src="./recommended-videos.js" />
