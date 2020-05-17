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
        @click="goToPlaylist"
      >
        {{ playlistTitle }}
      </h3>
      <span
        class="channelName"
        @click="goToChannel"
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
          @click="toggleLoop"
        />
        <font-awesome-icon
          class="playlistIcon"
          :class="{ playlistIconActive: shuffleEnabled }"
          icon="random"
          @click="toggleShuffle"
        />
      </p>
      <ft-flex-box
        v-if="!isLoading"
        class="playlistItems"
      >
        <div
          v-for="(item, index) in playlistItems"
          :key="index"
          class="playlistItem"
        >
          <font-awesome-icon
            v-if="item.videoId === videoId"
            class="videoIndexIcon"
            icon="play"
          />
          <p
            v-else
            class="videoIndex"
          >
            {{ index + 1 }}
          </p>
          <ft-list-video
            :data="item"
            :playlist-id="playlistId"
            force-list-type="list"
            class="videoInfo"
          />
        </div>
      </ft-flex-box>
    </div>
  </ft-card>
</template>

<script src="./watch-video-playlist.js" />
<style scoped src="./watch-video-playlist.css" />
