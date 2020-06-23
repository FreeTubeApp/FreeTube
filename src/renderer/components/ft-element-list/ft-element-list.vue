<template>
  <ft-auto-grid
    :grid="listType !== 'list'"
  >
    <template
      v-for="(result, index) in data"
    >
      <ft-list-channel
        v-if="result.type === 'channel'"
        :data="result"
        :key="index"
      />
      <ft-list-video
        v-if="result.type === 'video' || result.type === 'shortVideo'"
        appearance="result"
        :data="result"
        :key="index"
      />
      <ft-list-playlist
        v-if="result.type === 'playlist'"
        appearance="result"
        :data="result"
        :key="index"
      />
    </template>
  </ft-auto-grid>
</template>

<script src="./ft-element-list.js" />
<style scoped src="./ft-element-list.css" />
