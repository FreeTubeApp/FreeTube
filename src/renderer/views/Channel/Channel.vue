<template>
  <div
    ref="search"
  >
    <ft-loader
      v-if="isLoading"
      :fullscreen="true"
    />
    <ft-card
      v-else
      class="card"
    >
      <img
        v-if="bannerUrl !== null"
        class="channelBanner"
        :src="bannerUrl"
      >
      <img
        v-else
        class="defaultChannelBanner"
      >
      <div class="channelInfoContainer">
        <div class="channelInfo">
          <img
            class="channelThumbnail"
            :src="thumbnailUrl"
          >
          <span
            class="channelName"
          >
            {{ channelName }}
          </span>
          <br>
          <span
            class="channelSubCount"
          >
            {{ formattedSubCount }} Subscribers
          </span>
        </div>
        <ft-button
          label="SUBSCRIBE"
          background-color="var(--primary-color)"
          text-color="var(--text-with-main-color)"
          class="subscribeButton"
          @click="handleSubscription"
        />
        <ft-flex-box
          class="channelInfoTabs"
        >
          <div
            class="tab"
            @click="changeTab('videos')"
          >
            VIDEOS
          </div>
          <div
            class="tab"
            @click="changeTab('playlists')"
          >
            PLAYLISTS
          </div>
          <div
            class="tab"
            @click="changeTab('about')"
          >
            ABOUT
          </div>
          <ft-input
            placeholder="Search Channel"
            class="channelSearch"
            @click="newSearch"
          />
          <ft-select
            v-show="currentTab === 'videos'"
            class="sortSelect"
            :value="videoSelectValues[0]"
            :select-names="videoSelectNames"
            :select-values="videoSelectValues"
            placeholder="Sort By"
            @change="videoSortBy = $event"
          />
          <ft-select
            v-show="currentTab === 'playlists'"
            class="sortSelect"
            :value="playlistSelectValues[0]"
            :select-names="playlistSelectNames"
            :select-values="playlistSelectValues"
            placeholder="Sort By"
            @change="playlistSortBy = $event"
          />
        </ft-flex-box>
      </div>
    </ft-card>
    <ft-card
      v-if="!isLoading"
      class="card"
    >
      <div
        v-if="currentTab === 'about'"
        class="aboutTab"
      >
        <h2>
          Channel Description
        </h2>
        <div
          class="aboutInfo"
          v-html="channelDescription"
        />
        <br>
        <h2
          v-if="relatedChannels.length > 0"
        >
          Featured Channels
        </h2>
        <ft-flex-box
          v-if="relatedChannels.length > 0"
        >
          <ft-channel-bubble
            v-for="(channel, index) in relatedChannels"
            :key="index"
            :channel-name="channel.author"
            :channel-id="channel.authorId"
            :channel-thumbnail="channel.authorThumbnails[channel.authorThumbnails.length - 1].url"
          />
        </ft-flex-box>
      </div>
      <ft-loader
        v-if="isElementListLoading"
      />
      <div
        v-if="currentTab !== 'about' && !isElementListLoading"
        class="elementList"
      >
        <ft-element-list
          v-show="currentTab === 'videos'"
          :data="latestVideos"
        />
        <ft-flex-box
          v-if="currentTab === 'videos' && latestVideos.length === 0"
        >
          <p class="message">
            This channel does not currently have any videos
          </p>
        </ft-flex-box>
        <ft-element-list
          v-show="currentTab === 'playlists'"
          :data="latestPlaylists"
        />
        <ft-flex-box
          v-if="currentTab === 'playlists' && latestPlaylists.length === 0"
        >
          <p class="message">
            This channel does not currently have any playlists
          </p>
        </ft-flex-box>
        <ft-element-list
          v-show="currentTab === 'search'"
          :data="searchResults"
        />
        <ft-flex-box
          v-if="currentTab === 'search' && searchResults.length === 0"
        >
          <p class="message">
            Your search results have returned 0 results
          </p>
        </ft-flex-box>
        <div
          v-if="showFetchMoreButton"
          class="getNextPage"
          @click="handleFetchMore"
        >
          <font-awesome-icon icon="search" /> Fetch more results…
        </div>
      </div>
    </ft-card>
  </div>
</template>

<script src="./Channel.js" />
<style scoped src="./Channel.css" />
