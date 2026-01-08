<template>
  <ft-card class="relative">
    <ft-loader
      v-if="isLoading"
    />
    <div
      v-else
    >
      <h3
        class="playlistTitle"
        :title="playlistTitle"
      >
        <router-link
          class="playlistTitleLink"
          dir="auto"
          :to="playlistPageLinkTo"
        >
          {{ playlistTitle }}
        </router-link>
      </h3>
      <template
        v-if="channelName !== ''"
      >
        <router-link
          v-if="channelId"
          class="channelName"
          dir="auto"
          :to="`/channel/${channelId}`"
        >
          {{ channelName }} -
        </router-link>
        <bdi
          v-else
          class="channelName"
        >
          {{ channelName }} -
        </bdi>
      </template>
      <span
        class="playlistIndex"
      >
        <label for="playlistProgressBar">
          {{ currentVideoIndexOneBased }} / {{ playlistVideoCount }}
        </label>

        <!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events, vuejs-accessibility/click-events-have-key-events -->
        <div
          v-if="!shuffleEnabled && !reversePlaylist"
          class="playlistProgressBarContainer"
          @mouseenter="showProgressBarPreview = true"
          @mouseleave="showProgressBarPreview = false"
          @mousemove="updateProgressBarPreview"
        >
          <div
            ref="playlistProgressBar"
            class="playlistProgressBar"
            :class="{ expanded: showProgressBarPreview }"
            @click="handleProgressBarClick"
          >
            <div
              class="playlistProgressBarFill"
              :style="{ width: (currentVideoIndexOneBased / playlistVideoCount) * 100 + '%' }"
            />
            <div
              v-if="showProgressBarPreview"
              class="progressBarPreview"
              :style="{ left: previewPosition + '%', transform: `translateX(${ previewTransformXPercentage }%)` }"
            >
              <div class="previewTooltip">
                <img
                  v-if="previewVideoThumbnail"
                  :src="previewVideoThumbnail"
                  alt=""
                  class="previewThumbnail"
                >
                <div class="previewText">
                  {{ previewVideoIndex }} / {{ playlistVideoCount }}
                </div>
                <div
                  class="previewVideoTitle"
                  dir="auto"
                >{{ previewVideoTitle }}</div>
              </div>
            </div>
          </div>
        </div>
      </span>
      <div class="playlistButtons">
        <button
          class="playlistButton"
          :class="{ playlistButtonActive: loopEnabled }"
          :aria-label="$t('Video.Loop Playlist')"
          :aria-pressed="loopEnabled"
          :title="$t('Video.Loop Playlist')"
          @click="toggleLoop"
        >
          <font-awesome-icon
            class="playlistIcon"
            :icon="['fas', 'retweet']"
          />
        </button>
        <button
          class="playlistButton"
          :class="{ playlistButtonActive: shuffleEnabled }"
          :aria-label="$t('Video.Shuffle Playlist')"
          :aria-pressed="shuffleEnabled"
          :title="$t('Video.Shuffle Playlist')"
          @click="toggleShuffle"
        >
          <font-awesome-icon
            class="playlistIcon"
            :icon="['fas', 'random']"
          />
        </button>
        <button
          class="playlistButton"
          :class="{ playlistButtonActive: reversePlaylist }"
          :aria-label="$t('Video.Reverse Playlist')"
          :aria-pressed="reversePlaylist"
          :title="$t('Video.Reverse Playlist')"
          @click="toggleReversePlaylist"
        >
          <font-awesome-icon
            class="playlistIcon"
            :icon="['fas', 'exchange-alt']"
          />
        </button>
      </div>
      <div
        v-if="!isLoading"
        ref="playlistItemsWrapper"
        class="playlistItemsWrapper"
      >
        <ft-list-video-numbered
          v-for="(item, index) in playlistItems"
          :key="item.playlistItemId || item.videoId"
          ref="playlistItem"
          class="playlistItem"
          :data="item"
          :playlist-id="playlistId"
          :playlist-type="playlistType"
          :playlist-index="reversePlaylist ? playlistItems.length - index - 1 : index"
          :playlist-item-id="item.playlistItemId"
          :playlist-reverse="reversePlaylist"
          :playlist-shuffle="shuffleEnabled"
          :playlist-loop="loopEnabled"
          :video-index="index"
          :is-current-video="currentVideoIndexZeroBased === index"
          appearance="watchPlaylistItem"
          :initial-visible-state="index < (currentVideoIndexZeroBased + 4) && index > (currentVideoIndexZeroBased - 4)"
          @pause-player="pausePlayer"
        />
      </div>
    </div>
  </ft-card>
</template>

<script src="./watch-video-playlist.js" />
<style scoped src="./watch-video-playlist.css" />
