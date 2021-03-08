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
      <div class="videoCountContainer">
        <div class="background" />
        <div class="inner">
          <div>{{ videoCount }}</div>
          <div><font-awesome-icon icon="list" /></div>
        </div>
      </div>
    </router-link>
    <div class="info">
      <router-link
        class="title"
        :to="`/playlist/${playlistId}`"
      >
        {{ title }}
      </router-link>
      <div class="infoLine">
        <router-link
          v-if="verified"
          class="channelName"
          :to="`/channel/${channelId}`"
        >
          {{ channelName }}
          <font-awesome-icon icon="check-circle" />
        </router-link>
        <router-link
          v-else
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
