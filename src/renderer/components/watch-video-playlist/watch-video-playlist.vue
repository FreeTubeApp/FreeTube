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
          :to="`/playlist/${playlistId}`"
        >
          {{ playlistTitle }}
        </router-link>
      </h3>
      <span
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
      </span>
      <span
        class="playlistIndex"
      >
        {{ currentVideoIndexOneBased }} / {{ playlistVideoCount }}
        <progress
          v-if="!shuffleEnabled && !reversePlaylist"
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
        <font-awesome-icon
          class="playlistIcon"
          :class="{ playlistIconActive: pauseOnCurrentVideo }"
          :icon="['fas', 'pause']"
          :title="$t('Video.Pause on Current Video')"
          role="button"
          tabindex="0"
          @click="togglePauseOnCurrentVideo"
          @keydown.enter.prevent="togglePauseOnCurrentVideo"
          @keydown.space.prevent="togglePauseOnCurrentVideo"
        />
      </p>
      <div
        v-if="!isLoading"
        ref="playlistItems"
        class="playlistItems"
      >
        <div
          v-for="(item, index) in playlistItems"
          :key="item.playlistItemId || item.videoId"
          :ref="currentVideoIndexZeroBased === index ? 'currentVideoItem' : null"
          class="playlistItem"
        >
          <div class="videoIndexContainer">
            <font-awesome-icon
              v-if="currentVideoIndexZeroBased === index"
              class="videoIndexIcon"
              :icon="['fas', 'play']"
            />
            <p
              v-else
              class="videoIndex"
            >
              {{ index + 1 }}
            </p>
          </div>
          <ft-list-video-lazy
            :data="item"
            :playlist-id="playlistId"
            :playlist-type="playlistType"
            :playlist-index="reversePlaylist ? playlistItems.length - index - 1 : index"
            :playlist-item-id="item.playlistItemId"
            :playlist-reverse="reversePlaylist"
            :playlist-shuffle="shuffleEnabled"
            :playlist-loop="loopEnabled"
            appearance="watchPlaylistItem"
            force-list-type="list"
            :initial-visible-state="index < (currentVideoIndexZeroBased + 4) && index > (currentVideoIndexZeroBased - 4)"
            @pause-player="$emit('pause-player')"
          />
        </div>
      </div>
    </div>
  </ft-card>
</template>

<script src="./watch-video-playlist.js" />
<style scoped src="./watch-video-playlist.css" />
