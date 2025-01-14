<template>
  <ft-settings-section
    :title="$t('Settings.Player Settings.Player Settings')"
  >
    <div class="switchColumnGrid">
      <div class="switchColumn">
        <ft-toggle-switch
          :label="$t('Settings.Player Settings.Proxy Videos Through Invidious')"
          :compact="true"
          :default-value="showProxyVideosAsDisabled ? false : proxyVideos"
          :disabled="showProxyVideosAsDisabled"
          :tooltip="$t('Tooltips.Player Settings.Proxy Videos Through Invidious')"
          @change="updateProxyVideos"
        />
        <ft-toggle-switch
          :label="$t('Settings.Player Settings.Turn on Subtitles by Default')"
          :compact="true"
          :default-value="enableSubtitlesByDefault"
          @change="updateEnableSubtitlesByDefault"
        />
        <ft-toggle-switch
          :label="$t('Settings.Player Settings.Enable Theatre Mode by Default')"
          :compact="true"
          :default-value="defaultTheatreMode"
          @change="updateDefaultTheatreMode"
        />
        <ft-toggle-switch
          :label="$t('Settings.Player Settings.Scroll Volume Over Video Player')"
          :compact="true"
          :disabled="videoSkipMouseScroll"
          :default-value="videoVolumeMouseScroll"
          @change="updateVideoVolumeMouseScroll"
        />
        <ft-toggle-switch
          :label="$t('Settings.Player Settings.Scroll Playback Rate Over Video Player')"
          :compact="true"
          :default-value="videoPlaybackRateMouseScroll"
          :tooltip="$t('Tooltips.Player Settings.Scroll Playback Rate Over Video Player')"
          @change="updateVideoPlaybackRateMouseScroll"
        />
        <ft-toggle-switch
          :label="$t('Settings.Player Settings.Skip by Scrolling Over Video Player')"
          :compact="true"
          :disabled="videoVolumeMouseScroll"
          :default-value="videoSkipMouseScroll"
          :tooltip="$t('Tooltips.Player Settings.Skip by Scrolling Over Video Player')"
          @change="updateVideoSkipMouseScroll"
        />
      </div>
      <div class="switchColumn">
        <ft-toggle-switch
          :label="$t('Settings.Player Settings.Play Next Video')"
          :compact="true"
          :disabled="hideRecommendedVideos"
          :default-value="playNextVideo"
          @change="updatePlayNextVideo"
        />
        <ft-toggle-switch
          :label="$t('Settings.Player Settings.Autoplay Playlists')"
          :compact="true"
          :default-value="autoplayPlaylists"
          @change="updateAutoplayPlaylists"
        />
        <ft-toggle-switch
          :label="$t('Settings.Player Settings.Autoplay Videos')"
          :compact="true"
          :default-value="autoplayVideos"
          @change="updateAutoplayVideos"
        />
        <ft-toggle-switch
          :label="$t('Settings.Player Settings.Display Play Button In Video Player')"
          :compact="true"
          :default-value="displayVideoPlayButton"
          @change="updateDisplayVideoPlayButton"
        />
        <ft-toggle-switch
          :label="$t('Settings.Player Settings.Enter Fullscreen on Display Rotate')"
          :compact="true"
          :default-value="enterFullscreenOnDisplayRotate"
          @change="updateEnterFullscreenOnDisplayRotate"
        />
      </div>
    </div>
    <ft-flex-box>
      <ft-slider
        :label="$t('Settings.Player Settings.Next Video Interval')"
        :default-value="defaultInterval"
        :min-value="0"
        :max-value="60"
        :step="1"
        value-extension="s"
        @change="updateDefaultInterval"
      />
      <ft-slider
        :label="$t('Settings.Player Settings.Autoplay Interruption Timer')"
        :default-value="defaultAutoplayInterruptionIntervalHours"
        :min-value="1"
        :max-value="12"
        :step="1"
        value-extension="h"
        @change="updateDefaultAutoplayInterruptionIntervalHours"
      />
      <ft-slider
        :label="$t('Settings.Player Settings.Fast-Forward / Rewind Interval')"
        :default-value="defaultSkipInterval"
        :min-value="1"
        :max-value="70"
        :step="1"
        value-extension="s"
        @change="updateDefaultSkipInterval"
      />
      <ft-slider
        :label="$t('Settings.Player Settings.Default Volume')"
        :default-value="defaultVolume"
        :min-value="0"
        :max-value="100"
        :step="1"
        value-extension="%"
        @change="updateDefaultVolume($event / 100)"
      />
      <ft-slider
        :label="$t('Settings.Player Settings.Default Playback Rate')"
        :default-value="defaultPlayback"
        :min-value="parseFloat(videoPlaybackRateInterval)"
        :max-value="8"
        :step="parseFloat(videoPlaybackRateInterval)"
        value-extension="x"
        @change="updateDefaultPlayback"
      />
      <ft-slider
        :label="$t('Settings.Player Settings.Max Video Playback Rate')"
        :default-value="maxVideoPlaybackRate"
        :min-value="2"
        :max-value="10"
        :step="1"
        value-extension="x"
        @change="updateMaxVideoPlaybackRate"
      />
      <ft-select
        :placeholder="$t('Settings.Player Settings.Video Playback Rate Interval')"
        :value="videoPlaybackRateInterval"
        :select-names="playbackRateIntervalValues"
        :select-values="playbackRateIntervalValues"
        :icon="['fas', 'gauge']"
        @change="updateVideoPlaybackRateInterval"
      />
    </ft-flex-box>
    <ft-flex-box>
      <ft-select
        :placeholder="$t('Settings.Player Settings.Default Video Format.Default Video Format')"
        :value="defaultVideoFormat"
        :select-names="formatNames"
        :select-values="formatValues"
        :tooltip="$t('Tooltips.Player Settings.Default Video Format')"
        :icon="['fas', 'file-video']"
        @change="updateDefaultVideoFormat"
      />
      <ft-select
        :placeholder="$t('Settings.Player Settings.Default Quality.Default Quality')"
        :value="defaultQuality"
        :select-names="qualityNames"
        :select-values="qualityValues"
        :icon="['fas', 'photo-film']"
        @change="updateDefaultQuality"
      />
    </ft-flex-box>
    <br>
    <ft-flex-box>
      <ft-toggle-switch
        :label="$t('Settings.Player Settings.Screenshot.Enable')"
        :default-value="enableScreenshot"
        @change="updateEnableScreenshot"
      />
    </ft-flex-box>
    <div v-if="enableScreenshot">
      <ft-flex-box>
        <ft-select
          :placeholder="$t('Settings.Player Settings.Screenshot.Format Label')"
          :value="screenshotFormat"
          :select-names="screenshotFormatNames"
          :select-values="screenshotFormatValues"
          :icon="['fas', 'file-image']"
          @change="handleUpdateScreenshotFormat"
        />
        <ft-slider
          :label="$t('Settings.Player Settings.Screenshot.Quality Label')"
          :default-value="screenshotQuality"
          :min-value="0"
          :max-value="100"
          :step="1"
          value-extension="%"
          :disabled="screenshotFormat === 'png'"
          @change="updateScreenshotQuality"
        />
      </ft-flex-box>
      <ft-flex-box v-if="usingElectron">
        <ft-toggle-switch
          :label="$t('Settings.Player Settings.Screenshot.Ask Path')"
          :default-value="screenshotAskPath"
          @change="updateScreenshotAskPath"
        />
      </ft-flex-box>
      <ft-flex-box
        v-if="usingElectron && !screenshotAskPath"
        class="screenshotFolderContainer"
      >
        <p class="screenshotFolderLabel">
          {{ $t('Settings.Player Settings.Screenshot.Folder Label') }}
        </p>
        <ft-input
          class="screenshotFolderPath"
          :placeholder="screenshotFolderPlaceholder"
          :show-action-button="false"
          :show-label="false"
          :disabled="true"
        />
        <ft-button
          :label="$t('Settings.Player Settings.Screenshot.Folder Button')"
          class="screenshotFolderButton"
          @click="chooseScreenshotFolder"
        />
      </ft-flex-box>
      <ft-flex-box
        class="screenshotFolderContainer"
      >
        <p class="screenshotFilenamePatternTitle">
          {{ $t('Settings.Player Settings.Screenshot.File Name Label') }}
          <ft-tooltip
            class="selectTooltip"
            position="bottom"
            :tooltip="$t('Settings.Player Settings.Screenshot.File Name Tooltip')"
          />
        </p>
        <ft-input
          class="screenshotFilenamePatternInput"
          placeholder=""
          :value="screenshotFilenamePattern"
          :spellcheck="false"
          :show-action-button="false"
          :show-label="false"
          @input="handleScreenshotFilenamePatternChanged"
        />
        <ft-input
          class="screenshotFilenamePatternExample"
          :placeholder="screenshotFilenameExample"
          :show-action-button="false"
          :show-label="false"
          :disabled="true"
        />
      </ft-flex-box>
      <br>
    </div>
  </ft-settings-section>
</template>

<script src="./player-settings.js" />
<style scoped src="./player-settings.css" />
