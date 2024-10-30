<template>
  <div>
    <div
      v-for="(shelf, index) in shelves"
      :key="index"
    >
      <details>
        <summary
          class="shelfTitle"
        >
          {{ shelf.title }}
          <hr class="shelfUnderline">
        </summary>
        <ft-element-list
          :data="shelf.content"
          :use-channels-hidden-preference="false"
          :display="shelf.isCommunity ? 'list' : null"
        />
      </details>
    </div>
  </div>
</template>

<script lang="js" src="./channel-home.js"></script>
<style scoped src="./channel-home.css" />
