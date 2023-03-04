<template>
  <div
    v-if="!isLoading"
    class="ft-list-post ft-list-item outside"
    :appearance="appearance"
    :class="{ list: listType === 'list', grid: listType === 'grid' }"
  >
    <div
      class="author-div"
    >
      <img
        v-if="authorThumbnails.length > 0"
        :src="getBestQualityImage(authorThumbnails)"
        class="communityThumbnail"
        alt=""
      >
      <p
        class="authorName"
      >
        {{ author }}
      </p>
      <p
        class="publishedText"
      >
        {{ publishedText }}
      </p>
    </div>
    <p v-html="postText" />
    <tiny-slider
      v-if="type === 'multiImage' && postContent.content.length > 0"
      v-bind="tinySliderOptions"
      class="slider"
    >
      <img
        v-for="(img, index) in postContent.content"
        :key="index"
        :src="getBestQualityImage(img)"
        class="communityImage tns-lazy-img"
        alt=""
      >
    </tiny-slider>
    <div
      v-if="type === 'image' && postContent.content.length > 0"
    >
      <img
        :src="getBestQualityImage(postContent.content)"
        class="communityImage"
        alt=""
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
        {{ postContent.totalVotes }}
      </div>
      <div
        v-for="(poll, index) in postContent.content"
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
            <!-- <img
              v-if="poll.image != null && poll.image.length >0"
              :src="getBestQualityImage(poll.image)"
              class="poll-image"
              alt=""
            > -->
            {{ poll.text }}
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="type === 'playlist'"
      class="playlistWrapper"
    >
      <ft-list-playlist
        :data="postContent.content"
        :appearance="appearance"
      />
    </div>
    <div
      class="bottomSection"
    >
      <span class="likeCount"><font-awesome-icon
        class="thumbs-up-icon"
        :icon="['fas', 'thumbs-up']"
      /> {{ voteCount }}</span>
      <span class="dislikeCount"><font-awesome-icon
        class="thumbs-down-icon"
        :icon="['fas', 'thumbs-down']"
        flip="horizontal"
      /></span>
      <span class="commentCount">
        <font-awesome-icon
          class="comment-count-icon"
          :icon="['fas', 'comment']"
        /> {{ commentCount }}</span>
    </div>
  </div>
</template>

<script src="./ft-community-post.js" />
<style src="./ft-community-post.scss" lang="scss" />
<style src="./slider-style.css" lang="css" />
