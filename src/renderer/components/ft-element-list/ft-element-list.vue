<template>
  <span>
    <ft-flex-box
      v-if="listType === 'list'"
    >
      <span
        v-for="(result, index) in data"
        :key="index"
        class="maxWidth"
      >
        <ft-list-channel
          v-if="result.type === 'channel'"
          :data="result"
        />
        <ft-list-video
          v-if="result.type === 'video' || result.type === 'shortVideo'"
          :data="result"
        />
        <ft-list-playlist
          v-if="result.type === 'playlist'"
          :data="result"
        />
      </span>
    </ft-flex-box>
    <ft-grid
      v-else
    >
      <span
        v-for="(result, index) in data"
        :key="index"
      >
        <ft-list-channel
          v-if="result.type === 'channel'"
          :data="result"
        />
        <ft-list-video
          v-if="result.type === 'video' || result.type === 'shortVideo'"
          :data="result"
        />
        <ft-list-playlist
          v-if="result.type === 'playlist'"
          :data="result"
        />
      </span>
    </ft-grid>
  </span>
</template>

<script src="./ft-element-list.js" />
<style scoped src="./ft-element-list.css" />
