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
          :to="`/channel/${channelId}`"
        >
          {{ channelName }} -
        </router-link>
        <span
          v-else
          class="channelName"
        >
          {{ channelName }} -
        </span>
      </template>
      <span
        class="playlistIndex"
      >
        <label for="playlistProgressBar">
          {{ currentVideoIndexOneBased }} / {{ playlistVideoCount }}
        </label>
        <progress
          v-if="!shuffleEnabled && !reversePlaylist"
          id="playlistProgressBar"
          class="playlistProgressBar"
          :value="currentVideoIndexOneBased"
          :max="playlistVideoCount"
        />
      </span>
      <p>
        <font-awesome-icon
          class="playlistIcon"
          :class="{ playlistIconActive: loopEnabled }"
          :icon="['fas', 'retweet']"
          :title="$t('Video.Loop Playlist')"
          role="button"
          tabindex="0"
          :aria-pressed="loopEnabled"
          @click="toggleLoop"
          @keydown.enter.prevent="toggleLoop"
          @keydown.space.prevent="toggleLoop"
        />
        <font-awesome-icon
          class="playlistIcon"
          :class="{ playlistIconActive: shuffleEnabled }"
          :icon="['fas', 'random']"
          :title="$t('Video.Shuffle Playlist')"
          role="button"
          tabindex="0"
          :aria-pressed="shuffleEnabled"
          @click="toggleShuffle"
          @keydown.enter.prevent="toggleShuffle"
          @keydown.space.prevent="toggleShuffle"
        />
        <font-awesome-icon
          class="playlistIcon"
          :class="{ playlistIconActive: reversePlaylist }"
          :icon="['fas', 'exchange-alt']"
          :title="$t('Video.Reverse Playlist')"
          role="button"
          tabindex="0"
          :aria-pressed="reversePlaylist"
          @click="toggleReversePlaylist"
          @keydown.enter.prevent="toggleReversePlaylist"
          @keydown.space.prevent="toggleReversePlaylist"
        />
        <font-awesome-icon
          class="playlistIcon"
          :icon="['fas', 'step-backward']"
          :title="$t('Video.Play Previous Video')"
          role="button"
          tabindex="0"
          @click="playPreviousVideo"
          @keydown.enter.prevent="playPreviousVideo"
          @keydown.space.prevent="playPreviousVideo"
        />
        <font-awesome-icon
          class="playlistIcon"
          :icon="['fas', 'step-forward']"
          :title="$t('Video.Play Next Video')"
          role="button"
          tabindex="0"
          @click="playNextVideo"
          @keydown.enter.prevent="playNextVideo"
          @keydown.space.prevent="playNextVideo"
        />
      </p>
      <div
        v-if="!isLoading"
        ref="playlistItems"
        class="playlistItems"
      >
        <ft-list-video-numbered
          v-for="(item, index) in playlistItems"
          :key="item.playlistItemId || item.videoId"
          :ref="currentVideoIndexZeroBased === index ? 'currentVideoItem' : null"
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
