<template>
  <ft-card class="transcriptContainer">
    <div class="header">
      <div class="titleContainer">
        <h2>{{ $t('Transcript.Transcript') }}</h2>
      </div>
      <ft-icon-button
        class="menuButton"
        :icon="['fas', 'ellipsis-v']"
        theme="base-no-default"
        :size="16"
        :use-shadow="false"
        dropdown-position-x="middle"
        :dropdown-options="menuOptions"
        @click="handleMenuClick"
      />
      <ft-icon-button
        class="closeButton"
        :icon="['fas', 'xmark']"
        @click="$emit('hide-transcript')"
      />
    </div>
  </ft-card>
</template>

<script src="./watch-video-transcript.js" />
<style scoped lang="scss" src="./watch-video-transcript.scss" />
