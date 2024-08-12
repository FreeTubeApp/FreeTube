<template>
  <div>
    <ft-loader
      v-if="isLoading && !errorMessage"
      :fullscreen="true"
    />
    <ChannelDetails
      v-else-if="(isFamilyFriendly || !showFamilyFriendlyOnly)"
      :id="id"
      :name="channelName"
      :banner-url="bannerUrl"
      :has-error-message="!!errorMessage"
      :thumbnail-url="thumbnailUrl"
      :sub-count="subCount"
      :show-share-menu="showShareMenu"
      :show-search-bar="showSearchBar"
      :is-subscribed="isSubscribed"
      :visible-tabs="tabInfoValues"
      :current-tab="currentTab"
      class="card channelDetails"
      @change-tab="changeTab"
      @search="newSearch"
    />
    <ft-card
      v-if="!isLoading && !errorMessage && (isFamilyFriendly || !showFamilyFriendlyOnly)"
      class="card"
    >
      <channel-about
        v-if="currentTab === 'about'"
        id="aboutPanel"
        :description="description"
        :joined="joined"
        :views="viewCount"
        :videos="videoCount"
        :location="location"
        :tags="tags"
        :related-channels="relatedChannels"
      />
      <div class="select-container">
        <ft-select
          v-if="showVideoSortBy"
          v-show="currentTab === 'videos' && latestVideos.length > 0"
          :value="videoSortBy"
          :select-names="videoLiveShortSelectNames"
          :select-values="videoLiveShortSelectValues"
          :placeholder="$t('Search Filters.Sort By.Sort By')"
          :icon="getIconForSortPreference(videoSortBy)"
          @change="videoSortBy = $event"
        />
        <ft-select
          v-if="!hideChannelShorts && showShortSortBy"
          v-show="currentTab === 'shorts' && latestShorts.length > 0"
          :value="shortSortBy"
          :select-names="videoLiveShortSelectNames"
          :select-values="videoLiveShortSelectValues"
          :placeholder="$t('Search Filters.Sort By.Sort By')"
          :icon="getIconForSortPreference(shortSortBy)"
          @change="shortSortBy = $event"
        />
        <ft-select
          v-if="!hideLiveStreams && showLiveSortBy"
          v-show="currentTab === 'live' && latestLive.length > 0"
          :value="liveSortBy"
          :select-names="videoLiveShortSelectNames"
          :select-values="videoLiveShortSelectValues"
          :placeholder="$t('Search Filters.Sort By.Sort By')"
          :icon="getIconForSortPreference(liveSortBy)"
          @change="liveSortBy = $event"
        />
        <ft-select
          v-if="!hideChannelPlaylists && showPlaylistSortBy"
          v-show="currentTab === 'playlists' && latestPlaylists.length > 0"
          :value="playlistSortBy"
          :select-names="playlistSelectNames"
          :select-values="playlistSelectValues"
          :placeholder="$t('Search Filters.Sort By.Sort By')"
          :icon="getIconForSortPreference(playlistSortBy)"
          @change="playlistSortBy = $event"
        />
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
          id="videoPanel"
          :data="latestVideos"
          :use-channels-hidden-preference="false"
          role="tabpanel"
          aria-labelledby="videosTab"
        />
        <ft-flex-box
          v-if="currentTab === 'videos' && latestVideos.length === 0"
        >
          <p class="message">
            {{ $t("Channel.Videos.This channel does not currently have any videos") }}
          </p>
        </ft-flex-box>
        <ft-element-list
          v-if="!hideChannelShorts && currentTab === 'shorts'"
          id="shortPanel"
          :data="latestShorts"
          :use-channels-hidden-preference="false"
          role="tabpanel"
          aria-labelledby="shortsTab"
        />
        <ft-flex-box
          v-if="!hideChannelShorts && currentTab === 'shorts' && latestShorts.length === 0"
        >
          <p class="message">
            {{ $t("Channel.Shorts.This channel does not currently have any shorts") }}
          </p>
        </ft-flex-box>
        <ft-element-list
          v-if="!hideLiveStreams"
          v-show="currentTab === 'live'"
          id="livePanel"
          :data="latestLive"
          :use-channels-hidden-preference="false"
          role="tabpanel"
          aria-labelledby="liveTab"
        />
        <ft-flex-box
          v-if="!hideLiveStreams && currentTab === 'live' && latestLive.length === 0"
        >
          <p class="message">
            {{ $t("Channel.Live.This channel does not currently have any live streams") }}
          </p>
        </ft-flex-box>
        <ft-element-list
          v-if="!hideChannelPodcasts && currentTab === 'podcasts'"
          id="podcastPanel"
          :data="latestPodcasts"
          :use-channels-hidden-preference="false"
          role="tabpanel"
          aria-labelledby="podcastsTab"
        />
        <ft-flex-box
          v-if="!hideChannelPodcasts && currentTab === 'podcasts' && latestPodcasts.length === 0"
        >
          <p class="message">
            {{ $t("Channel.Podcasts.This channel does not currently have any podcasts") }}
          </p>
        </ft-flex-box>
        <ft-element-list
          v-if="!hideChannelReleases && currentTab === 'releases'"
          id="releasePanel"
          :data="latestReleases"
          :use-channels-hidden-preference="false"
          role="tabpanel"
          aria-labelledby="releasesTab"
        />
        <ft-flex-box
          v-if="!hideChannelReleases && currentTab === 'releases' && latestReleases.length === 0"
        >
          <p class="message">
            {{ $t("Channel.Releases.This channel does not currently have any releases") }}
          </p>
        </ft-flex-box>
        <ft-element-list
          v-if="!hideChannelPlaylists && currentTab === 'playlists'"
          id="playlistPanel"
          :data="latestPlaylists"
          :use-channels-hidden-preference="false"
          role="tabpanel"
          aria-labelledby="playlistsTab"
        />
        <ft-flex-box
          v-if="!hideChannelPlaylists && currentTab === 'playlists' && latestPlaylists.length === 0"
        >
          <p class="message">
            {{ $t("Channel.Playlists.This channel does not currently have any playlists") }}
          </p>
        </ft-flex-box>
        <ft-element-list
          v-if="!hideChannelCommunity && currentTab === 'community'"
          id="communityPanel"
          class="communityPanel"
          :data="latestCommunityPosts"
          :use-channels-hidden-preference="false"
          role="tabpanel"
          aria-labelledby="communityTab"
          display="list"
        />
        <ft-flex-box
          v-if="!hideChannelCommunity && currentTab === 'community' && latestCommunityPosts.length === 0"
        >
          <p class="message">
            {{ $t("Channel.Community.This channel currently does not have any posts") }}
          </p>
        </ft-flex-box>
        <ft-element-list
          v-show="currentTab === 'search'"
          :data="searchResults"
          :use-channels-hidden-preference="false"
        />
        <ft-flex-box
          v-if="currentTab === 'search' && searchResults.length === 0"
        >
          <p class="message">
            {{ $t("Channel.Your search results have returned 0 results") }}
          </p>
        </ft-flex-box>
        <ft-auto-load-next-page-wrapper
          v-if="showFetchMoreButton"
          @load-next-page="handleFetchMore"
        >
          <div
            class="getNextPage"
            role="button"
            tabindex="0"
            @click="handleFetchMore"
            @keydown.space.prevent="handleFetchMore"
            @keydown.enter.prevent="handleFetchMore"
          >
            <font-awesome-icon :icon="['fas', 'search']" /> {{ $t("Search Filters.Fetch more results") }}
          </div>
        </ft-auto-load-next-page-wrapper>
      </div>
    </ft-card>
    <ft-card
      v-if="errorMessage"
      class="card"
    >
      <p>
        {{ errorMessage }}
      </p>
    </ft-card>
    <ft-age-restricted
      v-else-if="!isLoading && (!isFamilyFriendly && showFamilyFriendlyOnly)"
      class="ageRestricted"
      :is-channel="true"
    />
  </div>
</template>

<script src="./Channel.js" />
<style scoped src="./Channel.css" />
