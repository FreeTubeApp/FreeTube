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
                v-if="subCount !== null && !hideChannelSubscriptions"
                class="channelSubCount"
              >
                {{ $tc('Global.Counts.Subscriber Count', subCount, { count: formattedSubCount }) }}
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
            <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
            <div
              v-if="tabInfoValues.includes('videos')"
              id="videosTab"
              class="tab"
              :class="(currentTab==='videos')?'selectedTab':''"
              role="tab"
              :aria-selected="String(currentTab === 'videos')"
              aria-controls="videoPanel"
              :tabindex="(currentTab === 'videos' || currentTab === 'search') ? 0 : -1"
              @click="changeTab('videos')"
              @keydown.left.right.enter.space="changeTab('videos', $event)"
            >
              {{ $t("Channel.Videos.Videos").toUpperCase() }}
            </div>
            <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
            <div
              v-if="tabInfoValues.includes('shorts') && !hideChannelShorts"
              id="shortsTab"
              class="tab"
              :class="(currentTab==='shorts')?'selectedTab':''"
              role="tab"
              :aria-selected="String(currentTab === 'shorts')"
              aria-controls="shortPanel"
              :tabindex="currentTab === 'shorts' ? 0 : -1"
              @click="changeTab('shorts')"
              @keydown.left.right.enter.space="changeTab('shorts', $event)"
            >
              {{ $t("Global.Shorts").toUpperCase() }}
            </div>
            <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
            <div
              v-if="tabInfoValues.includes('live') && !hideLiveStreams"
              id="liveTab"
              class="tab"
              :class="(currentTab==='live')?'selectedTab':''"
              role="tab"
              :aria-selected="String(currentTab === 'live')"
              aria-controls="livePanel"
              :tabindex="currentTab === 'live' ? 0 : -1"
              @click="changeTab('live')"
              @keydown.left.right.enter.space="changeTab('live', $event)"
            >
              {{ $t("Channel.Live.Live").toUpperCase() }}
            </div>
            <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
            <div
              v-if="tabInfoValues.includes('releases') && !hideChannelReleases"
              id="releasesTab"
              class="tab"
              role="tab"
              :aria-selected="String(currentTab === 'releases')"
              aria-controls="releasePanel"
              :tabindex="currentTab === 'releases' ? 0 : -1"
              :class="(currentTab==='releases')?'selectedTab':''"
              @click="changeTab('releases')"
              @keydown.left.right.enter.space="changeTab('releases', $event)"
            >
              {{ $t("Channel.Releases.Releases").toUpperCase() }}
            </div>
            <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
            <div
              v-if="tabInfoValues.includes('podcasts') && !hideChannelPodcasts"
              id="podcastsTab"
              class="tab"
              role="tab"
              :aria-selected="String(currentTab === 'podcasts')"
              aria-controls="podcastPanel"
              :tabindex="currentTab === 'podcasts' ? 0 : -1"
              :class="(currentTab==='podcasts')?'selectedTab':''"
              @click="changeTab('podcasts')"
              @keydown.left.right.enter.space="changeTab('podcasts', $event)"
            >
              {{ $t("Channel.Podcasts.Podcasts").toUpperCase() }}
            </div>
            <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
            <div
              v-if="tabInfoValues.includes('playlists') && !hideChannelPlaylists"
              id="playlistsTab"
              class="tab"
              role="tab"
              :aria-selected="String(currentTab === 'playlists')"
              aria-controls="playlistPanel"
              :tabindex="currentTab === 'playlists' ? 0 : -1"
              :class="(currentTab==='playlists')?'selectedTab':''"
              @click="changeTab('playlists')"
              @keydown.left.right.enter.space="changeTab('playlists', $event)"
            >
              {{ $t("Channel.Playlists.Playlists").toUpperCase() }}
            </div>
            <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
            <div
              v-if="tabInfoValues.includes('community') && !hideChannelCommunity"
              id="communityTab"
              class="tab"
              role="tab"
              :aria-selected="String(currentTab === 'community')"
              aria-controls="communityPanel"
              :tabindex="currentTab === 'community' ? 0 : -1"
              :class="(currentTab==='community')?'selectedTab':''"
              @click="changeTab('community')"
              @keydown.left.right.enter.space="changeTab('community', $event)"
            >
              {{ $t("Global.Community").toUpperCase() }}
            </div>
            <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
            <div
              id="aboutTab"
              class="tab"
              role="tab"
              :aria-selected="String(currentTab === 'about')"
              aria-controls="aboutPanel"
              :tabindex="currentTab === 'about' ? 0 : -1"
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
          :value="videoLiveSelectValues[0]"
          :select-names="videoLiveSelectNames"
          :select-values="videoLiveSelectValues"
          :placeholder="$t('Search Filters.Sort By.Sort By')"
          @change="videoSortBy = $event"
        />
        <ft-select
          v-if="!hideChannelShorts && showShortSortBy"
          v-show="currentTab === 'shorts' && latestShorts.length > 0"
          :value="shortSelectValues[0]"
          :select-names="shortSelectNames"
          :select-values="shortSelectValues"
          :placeholder="$t('Search Filters.Sort By.Sort By')"
          @change="shortSortBy = $event"
        />
        <ft-select
          v-if="!hideLiveStreams && showLiveSortBy"
          v-show="currentTab === 'live' && latestLive.length > 0"
          :value="videoLiveSelectValues[0]"
          :select-names="videoLiveSelectNames"
          :select-values="videoLiveSelectValues"
          :placeholder="$t('Search Filters.Sort By.Sort By')"
          @change="liveSortBy = $event"
        />
        <ft-select
          v-if="!hideChannelPlaylists && showPlaylistSortBy"
          v-show="currentTab === 'playlists' && latestPlaylists.length > 0"
          :value="playlistSelectValues[0]"
          :select-names="playlistSelectNames"
          :select-values="playlistSelectValues"
          :placeholder="$t('Search Filters.Sort By.Sort By')"
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
