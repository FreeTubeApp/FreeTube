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
      {{ $t('Subscriptions.Feed last updated', { date: lastRefreshTimestamp }) }}
    </p>
    <ft-icon-button
      :icon="['fas', 'sync']"
      class="refreshButton"
      :title="title"
      :size="12"
      theme="primary"
      @click="$emit('click')"
    />
  </div>
</template>

<script src="./ft-refresh-widget.js" />
<style scoped src="./ft-refresh-widget.css" />
