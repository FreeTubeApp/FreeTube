<template>
  <div
    class="ft-list-video ft-list-item"
    :appearance="appearance"
    :class="{ list: listType === 'list', grid: listType === 'grid' }"
  >
    <router-link
      class="videoThumbnail"
      :to="`/playlist/${playlistId}`"
    >
      <img
        :src="thumbnail"
        class="thumbnailImage"
      >
      <div
        class="videoCountContainer"
      >
        <div class="background" />
        <div class="inner">
          <div>{{ videoCount }}</div>
          <div><font-awesome-icon :icon="['fas','list']" /></div>
        </div>
      </div>
    </router-link>
    <div class="info">
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
      <router-link
        class="title"
        :to="`/playlist/${playlistId}`"
      >
        {{ title }}
      </router-link>
      <div class="infoLine">
        <router-link
          class="channelName"
          :to="`/channel/${channelId}`"
        >
          {{ channelName }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script src="./ft-list-playlist.js" />
<style scoped lang="sass" src="./ft-list-playlist.sass" />
