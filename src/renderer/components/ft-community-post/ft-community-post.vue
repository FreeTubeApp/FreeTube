<template>
  <div
    v-if="!isLoading"
    class="outside"
  >
    <div
      class="author-div"
    >
      <img
        :src="authorThumbnails[1].url"
        class="communityThumbnail"
      >
      <p
        id="authorName"
      >
        Aviva
      </p>
      <p
      id="publishedText"
      >
        {{ publishedText }}
      </p>
    </div>
    <p v-html="postText" />
    <div
      v-if="type === 'image'"
    >
      <img
        :src="postContent.content[2].url"
        class="communityImage"
      >
    </div>
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
    <div
      class="bottomSection"
    >
      <span class="likeCount"><font-awesome-icon icon="thumbs-up" /> {{ voteCount }}</span>
      <span class="dislikeCount"><font-awesome-icon id="thumbs-down-icon" icon="thumbs-down" /></span>
      <span class="commentCount"><font-awesome-icon id="comment-count-icon" icon="comment" /> {{ commentCount }}</span>


    </div>
  </div>
</template>

<script src="./ft-community-post.js" />
<style scoped src="./ft-community-post.sass" lang="sass" />
