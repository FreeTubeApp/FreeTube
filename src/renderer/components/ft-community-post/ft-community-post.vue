<template>
  <div
    v-if="!isLoading"
    class="outside"
  >
    <div
      class="author-div"
    >
      <img
        :src="authorThumbnails[Math.max(0, authorThumbnails.length-2)].url"
        class="communityThumbnail"
      >
      <p
        id="authorName"
      >
        {{ author }}
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
        :src="postContent.content[Math.max(0, postContent.content.length-1)].url"
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
      v-if="type === 'playlist'"
      class="playlistWrapper"
    >
      <div
      class="playlistThumbnail"
      >
        <img
          :src="postContent.content.thumbnails[0].thumbnails[0].url"
          class="playlistImage"
        >
<!--        <div-->
<!--          class="videoCountContainer"-->
<!--        >-->
<!--          <div class="background" />-->
<!--          <div class="inner">-->
<!--            <div>{{ postContent.content.videoCountText.text }}</div>-->
<!--            <div><font-awesome-icon icon="list" /></div>-->
<!--          </div>-->
<!--        </div>-->
      </div>
      <div
      class="playlistText"
      >
        <span
          class="playlistTitle"
        >
          {{ postContent.content.title }}
        </span>
        <br>
        <span
          class="playlistAuthor"
        >
          {{ postContent.content.author }}
          -
                    <span
                    class="playlistVideoCount"
                    >
                      {{ postContent.content.videoCountText.text }}
                      Videos
                    </span>
          <br>
        </span>
        <p
          v-for="(video) in postContent.content.playlistVideoRenderer"
          class="playlistPreviewVideos"
        >
          <span
            class="playlistPreviewVideoTitle"
          >
            {{ video.title }}
          </span>
          <span>
            &#183;
          </span>
          <span
            class="playlistPreviewVideoLength"
          >
            {{ video.lengthText }}
          </span>
          <br>
        </p>
      </div>
    </div>
    <div
      class="bottomSection"
    >
      <span class="likeCount"><font-awesome-icon icon="thumbs-up" /> {{ voteCount }}</span>
      <span class="dislikeCount"><font-awesome-icon
        id="thumbs-down-icon"
        icon="thumbs-down"
      /></span>
      <span class="commentCount"><font-awesome-icon
        id="comment-count-icon"
        icon="comment"
      /> {{ commentCount }}</span>
    </div>
  </div>
</template>

<script src="./ft-community-post.js" />
<style scoped src="./ft-community-post.sass" lang="sass" />
