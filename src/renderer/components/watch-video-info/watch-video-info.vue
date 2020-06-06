<template>
  <ft-card class="relative watchVideoInfo">
    <p
      class="videoTitle"
    >
      {{ title }}
    </p>
    <div
      class="channelInformation"
    >
      <img
        :src="channelThumbnail"
        class="channelThumbnail"
        @click="goToChannel"
      >
      <span
        class="channelName"
        @click="goToChannel"
      >
        {{ channelName }}
      </span>
      <ft-button
        :label="subscribedText"
        class="subscribeButton"
        background-color="var(--primary-color)"
        @click="handleSubscription"
      />
    </div>
    <ft-flex-box class="videoOptions">
      <ft-icon-button
        title="Toggle Theatre Mode"
        class="theatreModeButton"
        icon="expand-alt"
        theme="secondary"
        @click="$emit('theatreMode')"
      />
      <ft-icon-button
        title="Change Video Formats"
        theme="secondary"
        icon="file-video"
        :dropdown-names="formatTypeNames"
        :dropdown-values="formatTypeValues"
        @click="handleFormatChange"
      />
      <ft-icon-button
        title="Share Video"
        theme="secondary"
        icon="share-alt"
        :dropdown-names="shareNames"
        :dropdown-values="shareValues"
        @click="handleShare"
      />
    </ft-flex-box>
    <p class="viewCount">
      {{ parsedViewCount }}
    </p>
    <div class="likeBarContainer">
      <div
        class="likeBar"
        :style="{ width: likePercentageRatio + '%' }"
      />
      <div class="dislikeBar" />
    </div>
    <p class="likeCountContainer">
      <font-awesome-icon
        icon="thumbs-up"
      />
      {{ likeCount }}
      &nbsp;
      <font-awesome-icon
        icon="thumbs-down"
      />
      {{ dislikeCount }}
    </p>
  </ft-card>
</template>

<script src="./watch-video-info.js" />
<style scoped src="./watch-video-info.css" />
