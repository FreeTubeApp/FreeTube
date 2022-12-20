<template>
  <ft-card class="relative">
    <ft-loader
      v-if="isLoading"
    />
    <div
      v-else
    >
      <h3>
        <router-link
          class="playlistTitle"
          :to="`/playlist/${playlistId}`"
        >
          {{ playlistTitle }}
        </router-link>
      </h3>
      <router-link
        class="channelName"
        :to="`/channel/${channelId}`"
      >
        {{ channelName }}
      </router-link>
      <span
        class="playlistIndex"
      >
        - {{ currentVideoIndex }} / {{ playlistVideoCount }}
        <progress
          v-if="!shuffleEnabled && !reversePlaylist"
          class="playlistProgressBar"
          :value="currentVideoIndex"
          :max="playlistVideoCount"
        />
      </span>
      <p>
        <font-awesome-icon
          class="playlistIcon"
          :class="{ playlistIconActive: loopEnabled }"
          :icon="['fas', 'retweet']"
          :title="$t('Video.Loop Playlist')"
          @click="toggleLoop"
        />
        <font-awesome-icon
          class="playlistIcon"
          :class="{ playlistIconActive: shuffleEnabled }"
          :icon="['fas', 'random']"
          :title="$t('Video.Shuffle Playlist')"
          @click="toggleShuffle"
        />
        <font-awesome-icon
          class="playlistIcon"
          :class="{ playlistIconActive: reversePlaylist }"
          :icon="['fas', 'exchange-alt']"
          :title="$t('Video.Reverse Playlist')"
          @click="toggleReversePlaylist"
        />
        <font-awesome-icon
          class="playlistIcon"
          :icon="['fas', 'step-backward']"
          :title="$t('Video.Play Previous Video')"
          @click="playPreviousVideo"
        />
        <font-awesome-icon
          class="playlistIcon"
          :icon="['fas', 'step-forward']"
          :title="$t('Video.Play Next Video')"
          @click="playNextVideo"
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
              :icon="['fas', 'play']"
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
