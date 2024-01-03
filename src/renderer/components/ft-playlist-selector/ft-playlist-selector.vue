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
    <div class="info">
      <span
        class="title"
      >
        {{ titleForDisplay }}
      </span>
    </div>
  </div>
</template>

<script src="./ft-playlist-selector.js" />
<style scoped lang="scss" src="./ft-playlist-selector.scss" />
