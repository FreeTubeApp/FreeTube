<template>
  <div
    ref="container"
    class="ftVideoPlayer shaka-video-container"
    :class="{
      fullWindow: fullWindowEnabled,
      sixteenByNine: forceAspectRatio && !fullWindowEnabled
    }"
  >
    <!-- eslint-disable-next-line vuejs-accessibility/media-has-caption -->
    <video
      ref="video"
      class="player"
      preload="auto"
      crossorigin="anonymous"
      playsinline
      :autoplay="autoplayVideos ? true : null"
      :poster="thumbnail"
      @play="handlePlay"
      @pause="handlePause"
      @ended="handleEnded"
      @canplay="handleCanPlay"
      @volumechange="updateVolume"
      @timeupdate="handleTimeupdate"
    />
    <!--
      VR playback is only possible for VR videos with "EQUIRECTANGULAR" projection
      This intentionally doesn't use the "useVrMode" computed prop,
      as that changes depending on the active format,
      but as we initialize the shaka-player UI once per watch page,
      the canvas has to exist even in audio-only mode, because the user may switch to DASH later.
    -->
    <canvas
      v-if="vrProjection === 'EQUIRECTANGULAR'"
      ref="vrCanvas"
      class="vrCanvas"
    />
    <div
      v-if="showStats"
      class="stats"
    >
      <span>{{ $t('Video.Player.Stats.Video ID', { videoId }) }}</span>
      <br>
      <span>{{ $t('Video.Player.Stats.Media Formats', { formats: format }) }}</span>
      <br>
      <span>{{ $t('Video.Player.Stats.Bitrate', { bitrate: stats.bitrate }) }}</span>
      <br>
      <span>{{ $t('Video.Player.Stats.Volume', { volumePercentage: stats.volume }) }}</span>
      <br>
      <template
        v-if="format !== 'legacy'"
      >
        <span>{{ $t('Video.Player.Stats.Bandwidth', { bandwidth: stats.bandwidth }) }}</span>
        <br>
      </template>
      <span>{{ $t('Video.Player.Stats.Buffered', { bufferedPercentage: stats.buffered }) }}</span>
      <br>
      <span
        v-if="format === 'audio'"
      >{{ $t('Video.Player.Stats.CodecAudio', stats.codecs) }}</span>
      <span
        v-else-if="stats.codecs.audioItag && stats.codecs.videoItag"
      >{{ $t('Video.Player.Stats.CodecsVideoAudio', stats.codecs) }}</span>
      <span
        v-else
      >{{ $t('Video.Player.Stats.CodecsVideoAudioNoItags', stats.codecs) }}</span>
      <br>
      <span>{{ $t('Video.Player.Stats.Player Dimensions', stats.playerDimensions) }}</span>
      <br>
      <template
        v-if="format !== 'audio'"
      >
        <span>{{ $t('Video.Player.Stats.Resolution', stats.resolution) }}</span>
        <br>
        <span>{{ $t('Video.Player.Stats.Dropped Frames / Total Frames', stats.frames) }}</span>
      </template>
    </div>
    <Transition name="fade">
      <div
        v-if="showValueChangePopup"
        class="valueChangePopup"
        :class="{ 'invert-content-order': invertValueChangeContentOrder }"
      >
        <font-awesome-icon
          v-if="valueChangeIcon"
          :icon="['fas', valueChangeIcon]"
        />
        <span>{{ valueChangeMessage }}</span>
      </div>
    </Transition>
    <div
      v-if="showOfflineMessage"
      class="offlineWrapper"
    >
      <font-awesome-layers
        class="offlineIcon"
        aria-hidden="true"
      >
        <font-awesome-icon :icon="['fas', 'wifi']" />
        <font-awesome-icon :icon="['fas', 'slash']" />
      </font-awesome-layers>
      <p class="offlineMessage">
        <span>
          {{ $t('Video.Player.You appear to be offline') }}
        </span>
        <br>
        <span class="offlineMessageSubtitle">
          {{ $t('Video.Player.Playback will resume automatically when your connection comes back') }}
        </span>
      </p>
    </div>
    <div
      v-if="sponsorBlockShowSkippedToast && skippedSponsorBlockSegments.length > 0"
      class="skippedSegmentsWrapper"
    >
      <p
        v-for="{ uuid, translatedCategory } in skippedSponsorBlockSegments"
        :key="uuid"
        class="skippedSegment"
      >
        {{ $t('Video.Player.Skipped segment', { segmentCategory: translatedCategory }) }}
      </p>
    </div>
  </div>
</template>

<script src="./ft-shaka-video-player.js" />

<style src="shaka-player/dist/controls.css" />
<style scoped src="./ft-shaka-video-player.css" />
