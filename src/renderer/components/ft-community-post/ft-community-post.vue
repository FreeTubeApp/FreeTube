<template>
  <div
    v-if="!isLoading"
  >
    <img
      :src="authorThumbnails[1].url"
      class="communityThumbnail"
    >
    <p v-html="postText" />
    <img
      v-if="type === 'image'"
      :src="postContent.content[2].url"
    >
  </div>
</template>

<script src="./ft-community-post.js" />
<style scoped src="./ft-community-post.css" lang="css" />
