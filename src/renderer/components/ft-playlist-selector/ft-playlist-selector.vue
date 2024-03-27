<template>
  <div
    class="ft-playlist-selector grid"
    :class="{ selected: selected }"
    @click="toggleSelection"
    @keydown.enter.prevent="toggleSelection"
    @keydown.space.prevent="toggleSelection"
  >
    <div
      class="thumbnail"
    >
      <font-awesome-icon
        v-if="selected"
        class="selectedIcon"
        :icon="['fas', 'check']"
      />
      <img
        alt=""
        :src="thumbnail"
        class="thumbnailImage"
      >
      <div
        class="videoCountContainer"
      >
        <div class="background" />
        <div class="inner">
          <div>{{ videoCount }}</div>
          <div><font-awesome-icon :icon="['fas', 'list']" /></div>
        </div>
      </div>
    </div>
    <div
      v-observe-visibility="{
        callback: onVisibilityChanged,
        once: true,
      }"
      class="info"
    >
      <div
        class="title"
      >
        {{ titleForDisplay }}
      </div>
      <div
        v-if="videoPresenceCountInPlaylistTextVisible"
        class="videoPresenceCount"
      >
        {{ videoPresenceCountInPlaylistText }}
      </div>
    </div>
  </div>
</template>

<script src="./ft-playlist-selector.js" />
<style scoped lang="scss" src="./ft-playlist-selector.scss" />
