<template>
  <div>
    <ft-loader
      v-if="isLoading"
    />
    <div
      v-if="!isLoading && errorChannels.length !== 0"
    >
      <h3> {{ $t("Subscriptions.Error Channels") }}</h3>
      <ft-flex-box>
        <ft-channel-bubble
          v-for="(channel, index) in errorChannels"
          :key="index"
          :channel-name="channel.name"
          :channel-id="channel.id"
          :channel-thumbnail="channel.thumbnail"
        />
      </ft-flex-box>
    </div>
    <ft-flex-box
      v-if="!isLoading && activeVideoList.length === 0"
    >
      <p
        v-if="activeSubscriptionList.length === 0"
        class="message"
      >
        {{ $t("Subscriptions['Your Subscription list is currently empty. Start adding subscriptions to see them here.']") }}
      </p>
      <p
        v-else-if="!fetchSubscriptionsAutomatically && !attemptedFetch"
        class="message"
      >
        {{ $t("Subscriptions.Disabled Automatic Fetching") }}
      </p>
      <p
        v-else
        class="message"
      >
        {{ isCommunity ? $t("Subscriptions.Empty Posts") : $t("Subscriptions.Empty Channels") }}
      </p>
    </ft-flex-box>
    <ft-element-list
      v-if="!isLoading && activeVideoList.length > 0"
      :data="activeVideoList"
      :use-channels-hidden-preference="false"
      :display="isCommunity ? 'list' : ''"
    />
    <ft-auto-load-next-page-wrapper
      v-if="!isLoading && videoList.length > dataLimit"
      @load-next-page="increaseLimit"
    >
      <ft-flex-box>
        <ft-button
          :label="isCommunity ? $t('Subscriptions.Load More Posts') : $t('Subscriptions.Load More Videos')"
          background-color="var(--primary-color)"
          text-color="var(--text-with-main-color)"
          @click="increaseLimit"
        />
      </ft-flex-box>
    </ft-auto-load-next-page-wrapper>

    <ft-refresh-widget
      :disable-refresh="isLoading || activeSubscriptionList.length === 0"
      :last-refresh-timestamp="lastRefreshTimestamp"
      :title="title"
      @click="refresh"
    />
  </div>
</template>

<script src="./subscriptions-tab-ui.js" />
<style scoped src="./subscriptions-tab-ui.css" />
