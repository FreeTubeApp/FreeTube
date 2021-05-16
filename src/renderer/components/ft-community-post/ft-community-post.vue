<template>
  <div
    v-if="!isLoading"
    class="outside"
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
    <div
      v-if="type === 'video'"
    >
      <ft-list-video
        :data="data.postContent.content"
        appearance=""
      />
    </div>
    <div
      v-if="type === 'poll'"
    >
      <div
        class="poll-count"
      >
        {{ postContent.content.totalVotes }}

      </div>
      <div
        v-for="(poll, index) in postContent.content.choices"
        :key="index"
      >
        <div
          class="poll-option"
        >
          <span
            class="circle"
          />
          <div
            class="poll-text"
          >
            {{ poll }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./ft-community-post.js" />
<style scoped src="./ft-community-post.sass" lang="sass" />
