<template>
  <div
    class="ft-list-video ft-list-item grid"
    :class="{ selected: selected }"
    @click="toggleSelection"
    @keydown.enter.prevent="toggleSelection"
    @keydown.space.prevent="toggleSelection"
  >
    <div
      class="videoThumbnail"
    >
      <font-awesome-icon
        v-if="selected"
        class="selectedIcon"
        icon="check"
      />
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
          <div><font-awesome-icon icon="list" /></div>
        </div>
      </div>
    </div>
    <div class="info">
      <span
        class="title"
      >
        {{ title }}
      </span>
    </div>
  </div>
</template>

<script src="./ft-playlist-selector.js" />
<style scoped lang="sass" src="./ft-playlist-selector.sass" />
