<template>
  <div
    class="ft-list-community ft-list-item"
    :class="{
      list: (listType === 'list' || forceListType === 'list') && forceListType !== 'grid',
      grid: (listType === 'grid' || forceListType === 'list') && forceListType !== 'list',
      [appearance]: true,
      watched: addWatchedStyle
    }"
  >
    <div
    >
      <img
        :src="image"
      >
    </div>
  </div>
</template>

<script src="./ft-list-community.js" />
<style scoped src="./ft-list-community.sass" lang="sass" />
