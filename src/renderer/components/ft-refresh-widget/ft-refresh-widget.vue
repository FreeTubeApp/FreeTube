<template>
  <div
    class="floatingRefreshSection"
    :class="{
      sideNavOpen: isSideNavOpen
    }"
  >
    <p
      v-if="lastRefreshTimestamp"
      class="lastRefreshTimestamp"
    >
      {{ $t('Feed.Feed Last Updated', { feedName: title, date: lastRefreshTimestamp }) }}
    </p>
    <ft-icon-button
      :disabled="disableRefresh"
      :icon="['fas', 'sync']"
      class="refreshButton"
      :title="$t('Feed.Refresh Feed', { subscriptionName: title })"
      :size="12"
      theme="primary"
      @click="$emit('click')"
    />
  </div>
</template>

<script src="./ft-refresh-widget.js" />
<style scoped src="./ft-refresh-widget.css" />
