<template>
  <ft-card class="watchVideoInfo">
    <div>
      <p
        class="videoTitle"
      >
        {{ title }}
      </p>
      <div
        class="channelInformation"
      >
        <div
          class="profileRow"
        >
          <div>
            <img
              :src="channelThumbnail"
              class="channelThumbnail"
              @click="goToChannel"
            >
          </div>
          <div>
            <div
              class="channelName"
              @click="goToChannel"
            >
              {{ channelName }}
            </div>
            <ft-button
              :label="subscribedText"
              class="subscribeButton"
              background-color="var(--primary-color)"
              @click="handleSubscription"
            />
          </div>
        </div>
      </div>
    </div>
    <div>
      <p class="viewCount">
        {{ parsedViewCount }}
      </p>
      <div class="likeBarContainer">
        <div
          class="likeSection"
        >
          <div
            class="likeBar"
            :style="{ background: `linear-gradient(to right, var(--accent-color) ${likePercentageRatio}%, #9E9E9E ${likePercentageRatio}%` }"
          ></div>
          <div class="likeCount">👍 {{ likeCount }}</div>
          <div class="dislikeCount">{{ dislikeCount }} 👎</div>
        </div>
      </div>
      <div class="videoOptions">
        <ft-icon-button
          title="Toggle Theatre Mode"
          class="theatreModeButton option"
          icon="expand-alt"
          theme="secondary"
          @click="$emit('theatreMode')"
        />
        <ft-icon-button
          title="Change Video Formats"
          class="option"
          theme="secondary"
          icon="file-video"
          :dropdown-names="formatTypeNames"
          :dropdown-values="formatTypeValues"
          @click="handleFormatChange"
        />
        <ft-icon-button
          title="Share Video"
          class="option"
          theme="secondary"
          icon="share-alt"
          :dropdown-names="shareNames"
          :dropdown-values="shareValues"
          @click="handleShare"
        />
      </div>
    </div>
  </ft-card>
</template>

<script src="./watch-video-info.js" />
<style scoped src="./watch-video-info.sass" lang="sass" />
