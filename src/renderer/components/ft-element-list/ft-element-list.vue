<template>
  <ft-auto-grid
    :grid="listType !== 'list'"
  >
    <ft-list-lazy-wrapper
      v-for="(result, index) in data"
      :key="index"
      appearance="result"
      :data="result"
      :first-screen="index < 16"
      :layout="listType"
      :channel-blocked="_checkChannelBlocked(result)"
      :channel-temp-unblocked="_checkChannelTempUnblocked(result)"
      :avoid-channel-blocker="_avoidChannelBlockerByURI"
      :show-blocked-items="showBlockedItems"
      @toggle-blocked-channel="_toggleBlockedChannel"
    />
  </ft-auto-grid>
</template>

<script src="./ft-element-list.js" />
<style scoped src="./ft-element-list.css" />
