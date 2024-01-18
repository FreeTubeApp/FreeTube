<template>
  <ft-card class="watchVideoInfo">
    <div>
      <h1
        class="videoTitle"
      >
        {{ title }}
      </h1>
      <div
        class="channelInformation"
      >
        <div
          class="profileRow"
        >
          <div>
            <router-link
              :to="`/channel/${channelId}`"
            >
              <img
                :src="channelThumbnail"
                class="channelThumbnail"
                alt=""
              >
            </router-link>
          </div>
          <div>
            <router-link
              :to="`/channel/${channelId}`"
              class="channelName"
            >
              {{ channelName }}
            </router-link>
            <ft-subscribe-button
              v-if="!hideUnsubscribeButton"
              :channel-id="channelId"
              :channel-name="channelName"
              :channel-thumbnail="channelThumbnail"
              :subscription-count-text="subscriptionCountText"
            />
          </div>
        </div>
      </div>
    </div>
    <div>
      <div class="datePublished">
        {{ publishedString }} {{ dateString }}
      </div>
      <div class="viewCount">
        {{ parsedViewCount }}
      </div>
      <div
        v-if="!hideVideoLikesAndDislikes"
        class="likeBarContainer"
      >
        <div
          class="likeSection"
        >
          <div>
            <span class="likeCount"><font-awesome-icon :icon="['fas', 'thumbs-up']" /> {{ parsedLikeCount }}</span>
          </div>
        </div>
      </div>
      <!--
      // Uncomment if suitable solution for bringing back dislikes is introduced
      <div
        v-if="!hideVideoLikesAndDislikes"
        class="likeBarContainer"
      >
        <div
          class="likeSection"
        >
          <div
            class="likeBar"
            :style="{ background: `linear-gradient(to right, var(--accent-color) ${likePercentageRatio}%, #9E9E9E ${likePercentageRatio}%` }"
          />
          <div>
            <span class="likeCount"><font-awesome-icon :icon="['fas', 'thumbs-up']" /> {{ parsedLikeCount }}</span>
            <span class="dislikeCount"><font-awesome-icon :icon="['fas', 'thumbs-down']" /> {{ parsedDislikeCount }}</span>
          </div>
        </div>
      </div>
      -->
      <div class="videoOptions">
        <ft-icon-button
          v-if="showPlaylists && !isUpcoming"
          :title="$t('User Playlists.Add to Playlist')"
          :icon="['fas', 'plus']"
          class="option"
          theme="base"
          @click="togglePlaylistPrompt"
        />
        <ft-icon-button
          v-if="isQuickBookmarkEnabled"
          :title="quickBookmarkIconText"
          :icon="['fas', 'star']"
          class="quickBookmarkVideoIcon"
          :class="{
            bookmarked: isInQuickBookmarkPlaylist,
          }"
          :theme="quickBookmarkIconTheme"
          @click="toggleQuickBookmarked"
        />
        <ft-icon-button
          v-if="externalPlayer !== ''"
          :title="$t('Video.External Player.OpenInTemplate', { externalPlayer })"
          :icon="['fas', 'external-link-alt']"
          class="option"
          theme="secondary"
          @click="handleExternalPlayer"
        />
        <ft-icon-button
          v-if="!isUpcoming && downloadLinks.length > 0"
          ref="downloadButton"
          :title="$t('Video.Download Video')"
          class="option"
          theme="secondary"
          :icon="['fas', 'download']"
          :return-index="true"
          :dropdown-options="downloadLinkOptions"
          @click="handleDownload"
        />
        <ft-icon-button
          v-if="!isUpcoming"
          :title="$t('Change Format.Change Media Formats')"
          class="option"
          theme="secondary"
          :icon="['fas', 'file-video']"
          :dropdown-options="formatTypeOptions"
          @click="changeFormat($event)"
        />
        <ft-share-button
          v-if="!hideSharingActions"
          :id="id"
          :get-timestamp="getTimestamp"
          :playlist-id="playlistId"
          class="option"
        />
      </div>
    </div>
  </ft-card>
</template>

<script src="./watch-video-info.js" />
<style scoped src="./watch-video-info.scss" lang="scss" />
