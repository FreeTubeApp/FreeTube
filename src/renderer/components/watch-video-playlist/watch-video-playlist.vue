<template>
  <ft-card class="relative">
    <ft-loader
      v-if="isLoading"
    />
    <div
      v-else
    >
      <h3
        class="pointer"
        role="link"
        tabindex="0"
        @click="goToPlaylist"
        @keydown="goToPlaylist($event)"
      >
        {{ playlistTitle }}
      </h3>
      <span
        class="channelName"
        role="link"
        tabindex="0"
        @click="goToChannel"
        @keydown="goToChannel($event)"
      >
        {{ channelName }}
      </span>
      <span
        class="playlistIndex"
      >
        - {{ currentVideoIndex }} / {{ playlistVideoCount }}
      </span>
      <p>
        <font-awesome-icon
          class="playlistIcon"
          :class="{ playlistIconActive: loopEnabled }"
          icon="retweet"
          :title="$t('Video.Loop Playlist')"
          role="button"
          tabindex="0"
          :aria-label="$t('Video.Loop Playlist')"
          @click="toggleLoop"
          @keydown="toggleLoop($event)"
        />
        <font-awesome-icon
          class="playlistIcon"
          :class="{ playlistIconActive: shuffleEnabled }"
          icon="random"
          :title="$t('Video.Shuffle Playlist')"
          role="button"
          tabindex="0"
          :aria-label="$t('Video.Shuffle Playlist')"
          @click="toggleShuffle"
          @keydown="toggleShuffle($event)"
        />
        <font-awesome-icon
          class="playlistIcon"
          :class="{ playlistIconActive: reversePlaylist }"
          icon="exchange-alt"
          :title="$t('Video.Reverse Playlist')"
          role="button"
          tabindex="0"
          :aria-label="$t('Video.Reverse Playlist')"
          @click="toggleReversePlaylist"
          @keydown="toggleReversePlaylist($event)"
        />
        <font-awesome-icon
          class="playlistIcon"
          icon="step-backward"
          :title="$t('Video.Play Previous Video')"
          role="link"
          tabindex="0"
          :aria-label="$t('Video.Play Previous Video')"
          @click="playPreviousVideo"
          @keydown="playPreviousVideo($event)"
        />
        <font-awesome-icon
          class="playlistIcon"
          icon="step-forward"
          :title="$t('Video.Play Next Video')"
          role="link"
          tabindex="0"
          :aria-label="$t('Video.Play Next Video')"
          @click="playNextVideo"
          @keydown="playNextVideo($event)"
        />
      </p>
      <div
        v-if="!isLoading"
        class="playlistItems"
      >
        <div
          v-for="(item, index) in playlistItems"
          :key="index"
          class="playlistItem"
        >
          <div class="videoIndexContainer">
            <font-awesome-icon
              v-if="currentVideoIndex === (index + 1)"
              class="videoIndexIcon"
              icon="play"
            />
            <p
              v-else
              class="videoIndex"
            >
              {{ index + 1 }}
            </p>
          </div>
          <ft-list-video
            :data="item"
            :playlist-id="playlistId"
            :playlist-index="reversePlaylist ? playlistItems.length - index - 1 : index"
            :playlist-reverse="reversePlaylist"
            :playlist-shuffle="shuffleEnabled"
            :playlist-loop="loopEnabled"
            appearance="watchPlaylistItem"
            force-list-type="list"
            @pause-player="$emit('pause-player')"
          />
        </div>
      </div>
    </div>
  </ft-card>
</template>

<script src="./watch-video-playlist.js" />
<style scoped src="./watch-video-playlist.css" />
