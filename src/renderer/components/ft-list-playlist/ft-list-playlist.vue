<template>
  <div
    class="ft-list-video ft-list-item"
    :class="{
      [appearance]: true,
      list: listType === 'list',
      grid: listType === 'grid'
    }"
  >
    <div
      class="videoThumbnail"
    >
      <router-link
        class="thumbnailLink"
        :to="playlistPageLinkTo"
        tabindex="-1"
        aria-hidden="true"
      >
        <img
          alt=""
          :src="thumbnail"
          class="thumbnailImage"
          :style="{filter: blurThumbnailsStyle}"
        >
      </router-link>
      <div
        class="videoCountContainer"
      >
        <div class="background" />
        <div class="inner">
          <div>{{ videoCount }}</div>
          <div><font-awesome-icon :icon="['fas','list']" /></div>
        </div>
      </div>
    </div>
    <div class="info">
      <router-link
        class="title"
        :to="playlistPageLinkTo"
      >
        <h3 class="h3Title">
          {{ titleForDisplay }}
        </h3>
      </router-link>
      <div class="infoLine">
        <router-link
          v-if="channelId"
          class="channelName"
          :to="`/channel/${channelId}`"
        >
          {{ channelName }}
        </router-link>
        <span
          v-else
          class="channelName"
        >
          {{ channelName }}
        </span>
      </div>
      <ft-icon-button
        v-if="externalPlayer !== '' && !isUserPlaylist"
        :title="$t('Video.External Player.OpenInTemplate', { externalPlayer })"
        :icon="['fas', 'external-link-alt']"
        class="externalPlayerButton"
        theme="base-no-default"
        :size="16"
        :use-shadow="false"
        @click="handleExternalPlayer"
      />
      <span
        v-if="isUserPlaylist"
        class="playlistIcons"
      >
        <ft-icon-button
          :title="markedAsQuickBookmarkTarget ? $t('User Playlists.Quick Bookmark Enabled') : $t('User Playlists.Enable Quick Bookmark With This Playlist')"
          :icon="markedAsQuickBookmarkTarget ? ['fas', 'bookmark'] : ['far', 'bookmark']"
          :disabled="markedAsQuickBookmarkTarget"
          :theme="markedAsQuickBookmarkTarget ? 'secondary' : 'base-no-default'"
          :size="16"
          @disabled-click="handleQuickBookmarkEnabledDisabledClick"
          @click="enableQuickBookmarkForThisPlaylist"
        />
      </span>
    </div>
  </div>
</template>

<script src="./ft-list-playlist.js" />
<style scoped lang="scss" src="./ft-list-playlist.scss" />
