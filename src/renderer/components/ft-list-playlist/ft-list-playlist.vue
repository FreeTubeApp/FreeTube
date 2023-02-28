<template>
  <div
    class="ft-list-video ft-list-item"
    :appearance="appearance"
    :class="{ list: listType === 'list', grid: listType === 'grid' }"
  >
    <div
      class="videoThumbnail"
    >
      <router-link
        class="thumbnailLink"
        :to="`/playlist/${playlistId}`"
      >
        <img
          :src="thumbnail"
          class="thumbnailImage"
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
        :to="`/playlist/${playlistId}`"
      >
        {{ title }}
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
        v-if="externalPlayer !== ''"
        :title="$t('Video.External Player.OpenInTemplate', { externalPlayer })"
        :icon="['fas', 'external-link-alt']"
        class="externalPlayerButton"
        theme="base-no-default"
        :size="16"
        :use-shadow="false"
        @click="handleExternalPlayer"
      />
    </div>
  </div>
</template>

<script src="./ft-list-playlist.js" />
<style scoped lang="scss" src="./ft-list-playlist.scss" />
