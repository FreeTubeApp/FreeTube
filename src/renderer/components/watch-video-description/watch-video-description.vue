<template>
  <ft-card
    v-if="shownDescription.length > 0"
    class="videoDescription"
  >
    <ft-timestamp-catcher
      class="description"
      :input-html="shownDescription"
      @timestamp-event="onTimestamp"
    />
    <div v-if="hasTranscripts">
      <h3 class="transcriptHeader">
        {{ $t('Description.Transcript') }}
      </h3>
      <p class="transcriptSubtext">
        {{ $t('Description.Follow along using the transcript') }}
      </p>
      <ft-button
        :label="$t('Description.Show Transcript')"
        @click="$emit('show-transcript')"
      />
    </div>
  </ft-card>
</template>

<script src="./watch-video-description.js" />
<style scoped src="./watch-video-description.scss" lang="scss" />
