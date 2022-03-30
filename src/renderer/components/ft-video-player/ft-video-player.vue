<template>
  <div class="relative">
    <transition
      name="fade-blocked-modal"
    >
      <div
        v-if="videoBlocked && !unblockTemporarily"
        class="blockedModal"
        :class="allowTempUnblock ? 'enabled' : 'disabled'"
        @click="handleUnblock"
      >
        <p class="blockedModalText">
          {{ $t('Video.ChannelBlocker.Title') }}
        </p>
        <div class="blockedModalCountDown">
          <p v-if="allowTempUnblock">
            {{ $t('Video.ChannelBlocker.Click to watch') }}
          </p>
          <p v-else>
            you cant unblock
          </p>
          <template v-if="skipBlockedVideo">
            <p
              v-if="skipBlockedVideoCountDown >= 0"
              :style="{visibility : skipBlockedVideoCountDown <= 60 ? 'visible' : 'hidden'}"
            >
              {{ $tc('Video.ChannelBlocker.Countdown Message', skipBlockedVideoCountDown, { countdown: skipBlockedVideoCountDown }) }}
            </p>
            <p v-else>
              {{ $t('The playlist has ended. Enable loop to continue playing') }}
            </p>
          </template>
        </div>
      </div>
    </transition>
    <video
      :id="id"
      class="ftVideoPlayer video-js vjs-16-9 vjs-default-skin dark"
      :poster="thumbnail"
      controls
      preload="auto"
      :data-setup="JSON.stringify(dataSetup)"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
    >
      <source
        v-for="(source, index) in activeSourceList"
        :key="index + '_source'"
        :src="source.url"
        :type="source.type || source.mimeType"
        :label="source.qualityLabel"
        :selected="source.qualityLabel === selectedDefaultQuality"
      >
    </video>
  </div>
</template>

<script src="./ft-video-player.js" />
<style scoped src="./ft-video-player.css" />
