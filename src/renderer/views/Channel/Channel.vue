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

            <ft-button
              v-if="!hideUnsubscribeButton && (!errorMessage || isSubscribed)"
              :label="subscribedText"
              background-color="var(--primary-color)"
              text-color="var(--text-with-main-color)"
              class="subscribeButton"
              @click="handleSubscription"
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
      <div
        v-if="currentTab === 'about'"
        id="aboutPanel"
        class="aboutTab"
      >
        <h2
          v-if="description"
        >
          {{ $t("Channel.About.Channel Description") }}
        </h2>
        <div
          v-if="description"
          class="aboutInfo"
          v-html="description"
        />
        <h2
          v-if="joined || views !== null || location"
        >
          {{ $t('Channel.About.Details') }}
        </h2>
        <table
          v-if="joined || views !== null || location"
          class="aboutDetails"
        >
          <tr
            v-if="joined"
          >
            <th
              scope="row"
            >
              {{ $t('Channel.About.Joined') }}
            </th>
            <td>{{ formattedJoined }}</td>
          </tr>
          <tr
            v-if="views !== null"
          >
            <th
              scope="row"
            >
              {{ $t('Video.Views') }}
            </th>
            <td>{{ formattedViews }}</td>
          </tr>
          <tr
            v-if="location"
          >
            <th
              scope="row"
            >
              {{ $t('Channel.About.Location') }}
            </th>
            <td>{{ location }}</td>
          </tr>
        </table>
        <h2
          v-if="tags.length > 0"
        >
          {{ $t('Channel.About.Tags.Tags') }}
        </h2>
        <ul
          v-if="tags.length > 0"
          class="aboutTags"
        >
          <li
            v-for="tag in tags"
            :key="tag"
            class="aboutTag"
          >
            <router-link
              v-if="!hideSearchBar"
              class="aboutTagLink"
              :title="$t('Channel.About.Tags.Search for', { tag })"
              :to="{
                path: `/search/${encodeURIComponent(tag)}`,
                query: searchSettings
              }"
            >
              {{ tag }}
            </router-link>
            <span
              v-else
              class="aboutTagLink"
            >
              {{ tag }}
            </span>
          </li>
        </ul>
        <h2
          v-if="relatedChannels.length > 0"
        >
          {{ $t("Channel.About.Featured Channels") }}
        </h2>
        <ft-flex-box
          v-if="relatedChannels.length > 0"
        >
          <ft-channel-bubble
            v-for="(channel, index) in relatedChannels"
            :key="index"
            :channel-name="channel.name"
            :channel-id="channel.id"
            :channel-thumbnail="channel.thumbnailUrl"
            role="link"
            @click="goToChannel(channel.id)"
          />
        </ft-flex-box>
      </div>
      <ft-select
        v-show="currentTab === 'videos' && latestVideos.length > 0"
        class="sortSelect"
        :value="videoSelectValues[0]"
        :select-names="videoSelectNames"
        :select-values="videoSelectValues"
        :placeholder="$t('Search Filters.Sort By.Sort By')"
        @change="videoSortBy = $event"
      />
      <ft-select
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
          v-show="currentTab === 'playlists'"
          id="playlistPanel"
          :data="latestPlaylists"
          role="tabpanel"
          aria-labelledby="playlistsTab"
        />
        <ft-flex-box
          v-if="currentTab === 'playlists' && latestPlaylists.length === 0"
        >
          <p class="message">
            {{ $t("Channel.Playlists.This channel does not currently have any playlists") }}
          </p>
        </ft-flex-box>
        <ft-element-list
          v-show="currentTab === 'community'"
          id="communityPanel"
          :data="latestCommunityPosts"
          role="tabpanel"
          aria-labelledby="communityTab"
          display="list"
        />
        <ft-flex-box
          v-if="currentTab === 'community' && latestCommunityPosts.length === 0"
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
