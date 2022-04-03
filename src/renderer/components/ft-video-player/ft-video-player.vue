<template>
  <div class="relative">
    <transition
      name="fade-blocked-modal"
    >
      <div
        v-if="videoBlocked && !videoTempUnblocked"
        class="blockedModal"
        :class="allowTempUnblock ? 'enabled' : 'disabled'"
        @click="handleUnblock"
      >
        <p class="blockedModalText">
          {{ $t('Video.ChannelBlocker.Title') }}
        </p>
        <div class="blockedModalCountDown">
          <p v-if="allowTempUnblock">
            {{ $t('Video.ChannelBlocker.Message Watch') }}
          </p>
          <p
            v-else
            :style="{visibility : skipBlockedVideoCountDown <= 60 ? 'visible' : 'hidden'}"
          >
            {{ $t('Video.ChannelBlocker.Message Stop Countdown') }}
          </p>
          <template v-if="skipBlockedVideo">
            <p
              v-if="skipBlockedVideoCountDown >= 0"
              :style="{visibility : skipBlockedVideoCountDown <= 60 ? 'visible' : 'hidden'}"
            >
              {{ $tc('Video.ChannelBlocker.Countdown', skipBlockedVideoCountDown, { countdown: skipBlockedVideoCountDown }) }}
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
      class="ftVideoPlayer video-js vjs-default-skin dark"
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
