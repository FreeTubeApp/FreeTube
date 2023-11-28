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

    <div
      v-if="activeCaption"
      ref="cueBody"
      class="body"
      @scroll="disableAutoScroll"
    >
      <div
        v-for="(cue, index) in activeCaption.cues"
        :key="index"
        class="cue"
        :class="{ active: index === activeCueIndex }"
        @click="$emit('timestamp-event', cue.startTime)"
        @keydown.enter="$emit('timestamp-event', cue.startTime)"
      >
        <div
          v-if="timestampShown"
          class="timeContainer"
        >
          <div class="time">
            {{ cue.startTimeFormatted }}
          </div>
        </div>
        <div class="text">
          {{ cue.text }}
        </div>
      </div>
    </div>
    <div class="footer">
      <ft-select
        class="languageSelect"
        :value="activeLanguage"
        :select-names="captionLanguages"
        :select-values="captionLanguages"
        :placeholder="$t('Transcript.Transcript Language')"
        @change="handleLanguageChange"
      />
    </div>
  </ft-card>
</template>

<script src="./watch-video-transcript.js" />
<style scoped lang="scss" src="./watch-video-transcript.scss" />
