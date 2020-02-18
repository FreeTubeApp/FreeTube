<template>
  <ft-card class="relative">
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
      <ft-button
        label="Toggle Theatre Mode"
        class="theatreModeButton"
        @click="$emit('theatreMode')"
      />
      <ft-list-dropdown
        :title="formatTypeLabel"
        :label-names="formatTypeNames"
        :label-values="formatTypeValues"
        class="formatTypeDropdown"
      />
      <ft-list-dropdown
        :title="shareLabel"
        :label-names="shareNames"
        :label-values="shareValues"
        class="shareDropdown"
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
