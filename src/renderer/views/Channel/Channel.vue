<template>
  <div
    ref="search"
  >
    <ft-loader
      v-if="isLoading && !errorMessage"
      :fullscreen="true"
    />
    <ft-card
      v-else-if="(isFamilyFriendly || !showFamilyFriendlyOnly)"
      class="card channelDetails"
    >
      <div
        class="channelBannerContainer"
        :class="{
          default: !bannerUrl
        }"
        :style="{ '--banner-url': `url('${bannerUrl}')` }"
      />

      <div
        class="channelInfoContainer"
      >
        <div
          class="channelInfo"
          :class="{ channelInfoHasError: errorMessage }"
        >
          <div
            class="thumbnailContainer"
          >
            <img
              v-if="thumbnailUrl"
              class="channelThumbnail"
              :src="thumbnailUrl"
              alt=""
            >
            <font-awesome-icon
              v-else
              class="channelThumbnail"
              :icon="['fas', 'circle-user']"
            />
            <div
              class="channelLineContainer"
            >
              <h1
                class="channelName"
              >
                {{ channelName }}
              </h1>

              <p
                v-if="subCount !== null"
                class="channelSubCount"
              >
                {{ formattedSubCount }}
                <span v-if="subCount === 1">{{ $t("Channel.Subscriber") }}</span>
                <span v-else>{{ $t("Channel.Subscribers") }}</span>
              </p>
            </div>
          </div>

          <div class="channelInfoActionsContainer">
            <ft-share-button
              v-if="!hideSharingActions && showShareMenu"
              :id="id"
              share-target-type="Channel"
              class="shareIcon"
            />

            <ft-subscribe-button
              v-if="!hideUnsubscribeButton && (!errorMessage || isSubscribed)"
              :channel-id="id"
              :channel-name="channelName"
              :channel-thumbnail="thumbnailUrl"
            />
          </div>
        </div>

        <ft-flex-box
          v-if="!errorMessage"
          class="channelInfoTabs"
        >
          <div
            class="tabs"
            role="tablist"
            :aria-label="$t('Channel.Channel Tabs')"
          >
            <div
              id="videosTab"
              class="tab"
              :class="(currentTab==='videos')?'selectedTab':''"
              role="tab"
              aria-selected="true"
              aria-controls="videoPanel"
              tabindex="0"
              @click="changeTab('videos')"
              @keydown.left.right.enter.space="changeTab('videos', $event)"
            >
              {{ $t("Channel.Videos.Videos").toUpperCase() }}
            </div>
            <div
              id="shortsTab"
              class="tab"
              :class="(currentTab==='shorts')?'selectedTab':''"
              role="tab"
              aria-selected="true"
              aria-controls="shortPanel"
              tabindex="0"
              @click="changeTab('shorts')"
              @keydown.left.right.enter.space="changeTab('shorts', $event)"
            >
              {{ $t("Channel.Shorts.Shorts").toUpperCase() }}
            </div>
            <div
              v-if="!hideLiveStreams"
              id="liveTab"
              class="tab"
              :class="(currentTab==='live')?'selectedTab':''"
              role="tab"
              aria-selected="true"
              aria-controls="livePanel"
              tabindex="0"
              @click="changeTab('live')"
              @keydown.left.right.enter.space="changeTab('live', $event)"
            >
              {{ $t("Channel.Live.Live").toUpperCase() }}
            </div>
            <div
              v-if="!hideChannelPlaylists"
              id="playlistsTab"
              class="tab"
              role="tab"
              aria-selected="false"
              aria-controls="playlistPanel"
              tabindex="-1"
              :class="(currentTab==='playlists')?'selectedTab':''"
              @click="changeTab('playlists')"
              @keydown.left.right.enter.space="changeTab('playlists', $event)"
            >
              {{ $t("Channel.Playlists.Playlists").toUpperCase() }}
            </div>
            <div
              v-if="!hideChannelCommunity"
              id="communityTab"
              class="tab"
              role="tab"
              aria-selected="false"
              aria-controls="communityPanel"
              tabindex="-1"
              :class="(currentTab==='community')?'selectedTab':''"
              @click="changeTab('community')"
              @keydown.left.right.enter.space="changeTab('community', $event)"
            >
              {{ $t("Channel.Community.Community").toUpperCase() }}
            </div>
            <div
              id="aboutTab"
              class="tab"
              role="tab"
              aria-selected="false"
              aria-controls="aboutPanel"
              tabindex="-1"
              :class="(currentTab==='about')?'selectedTab':''"
              @click="changeTab('about')"
              @keydown.left.right.enter.space="changeTab('about', $event)"
            >
              {{ $t("Channel.About.About").toUpperCase() }}
            </div>
          </div>

          <ft-input
            v-if="showSearchBar"
            :placeholder="$t('Channel.Search Channel')"
            :show-clear-text-button="true"
            class="channelSearch"
            @click="newSearch"
          />
        </ft-flex-box>
      </div>
    </ft-card>
    <ft-card
      v-if="!isLoading && !errorMessage && (isFamilyFriendly || !showFamilyFriendlyOnly)"
      class="card"
    >
      <channel-about
        v-if="currentTab === 'about'"
        id="aboutPanel"
        :description="description"
        :joined="joined"
        :views="views"
        :location="location"
        :tags="tags"
        :related-channels="relatedChannels"
      />
      <ft-select
        v-if="showVideoSortBy"
        v-show="currentTab === 'videos' && latestVideos.length > 0"
        class="sortSelect"
        :value="videoShortLiveSelectValues[0]"
        :select-names="videoShortLiveSelectNames"
        :select-values="videoShortLiveSelectValues"
        :placeholder="$t('Search Filters.Sort By.Sort By')"
        @change="videoSortBy = $event"
      />
      <ft-select
        v-if="showShortSortBy"
        v-show="currentTab === 'shorts' && latestShorts.length > 0"
        class="sortSelect"
        :value="videoShortLiveSelectValues[0]"
        :select-names="videoShortLiveSelectNames"
        :select-values="videoShortLiveSelectValues"
        :placeholder="$t('Search Filters.Sort By.Sort By')"
        @change="shortSortBy = $event"
      />
      <ft-select
        v-if="!hideLiveStreams && showLiveSortBy"
        v-show="currentTab === 'live' && latestLive.length > 0"
        class="sortSelect"
        :value="videoShortLiveSelectValues[0]"
        :select-names="videoShortLiveSelectNames"
        :select-values="videoShortLiveSelectValues"
        :placeholder="$t('Search Filters.Sort By.Sort By')"
        @change="liveSortBy = $event"
      />
      <ft-select
        v-if="!hideChannelPlaylists && showPlaylistSortBy"
        v-show="currentTab === 'playlists' && latestPlaylists.length > 0"
        class="sortSelect"
        :value="playlistSelectValues[0]"
        :select-names="playlistSelectNames"
        :select-values="playlistSelectValues"
        :placeholder="$t('Search Filters.Sort By.Sort By')"
        @change="playlistSortBy = $event"
      />
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
          v-if="currentTab === 'shorts'"
          id="shortPanel"
          :data="latestShorts"
          role="tabpanel"
          aria-labelledby="shortsTab"
        />
        <ft-flex-box
          v-if="currentTab === 'shorts' && latestShorts.length === 0"
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
          v-if="!hideChannelPlaylists && currentTab === 'playlists'"
          id="playlistPanel"
          :data="latestPlaylists"
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
          :data="latestCommunityPosts"
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
        />
        <ft-flex-box
          v-if="currentTab === 'search' && searchResults.length === 0"
        >
          <p class="message">
            {{ $t("Channel.Your search results have returned 0 results") }}
          </p>
        </ft-flex-box>
        <div
          v-if="showFetchMoreButton"
          class="getNextPage"
          role="button"
          tabindex="0"
          @click="handleFetchMore"
          @keydown.space.prevent="handleFetchMore"
          @keydown.enter.prevent="handleFetchMore"
        >
          <font-awesome-icon :icon="['fas', 'search']" /> {{ $t("Search Filters.Fetch more results") }}
        </div>
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
      :content-type-string="'Channel'"
    />
  </div>
</template>

<script src="./Channel.js" />
<style scoped src="./Channel.css" />
