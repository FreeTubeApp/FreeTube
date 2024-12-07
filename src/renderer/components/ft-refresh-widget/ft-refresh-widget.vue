<template>
  <div
    class="floatingRefreshSection"
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
      :title="refreshFeedButtonTitle"
      :size="12"
      theme="primary"
      @click="click"
    />
  </div>
</template>

<script src="./ft-refresh-widget.js" />
<style scoped lang="scss" src="./ft-refresh-widget.scss" />
