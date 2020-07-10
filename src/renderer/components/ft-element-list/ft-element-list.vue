<template>
  <ft-auto-grid
    :grid="listType !== 'list'"
  >
    <template
      v-for="(result, index) in data"
    >
      <ft-list-channel
        v-if="result.type === 'channel'"
        :key="index"
        appearance="result"
        :data="result"
      />
      <ft-list-video
        v-if="result.type === 'video' || result.type === 'shortVideo'"
        :key="index"
        appearance="result"
        :data="result"
      />
      <ft-list-playlist
        v-if="result.type === 'playlist'"
        :key="index"
        appearance="result"
        :data="result"
      />
    </template>
  </ft-auto-grid>
</template>

<script src="./ft-element-list.js" />
<style scoped src="./ft-element-list.css" />
