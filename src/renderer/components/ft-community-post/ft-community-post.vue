<template>
  <div
    v-if="!isLoading"
    class="ft-list-post ft-list-item outside card list"
    :appearance="appearance"
  >
    <div
      class="author-div"
    >
      <template
        v-if="authorThumbnails.length > 0"
      >
        <router-link
          v-if="authorId"
          :to="`/channel/${authorId}`"
          tabindex="-1"
          aria-hidden="true"
        >
          <img
            :src="getBestQualityImage(authorThumbnails)"
            class="communityThumbnail"
            alt=""
          >
        </router-link>
        <img
          v-else
          :src="getBestQualityImage(authorThumbnails)"
          class="communityThumbnail"
          alt=""
        >
      </template>
      <p
        class="authorName"
      >
        <router-link
          v-if="authorId"
          :to="`/channel/${authorId}`"
          class="authorNameLink"
        >
          {{ author }}
        </router-link>
        <template
          v-else
        >
          {{ author }}
        </template>
      </p>
      <p
        class="publishedText"
      >
        {{ publishedText }}
      </p>
    </div>
    <p
      class="postText"
      v-html="postText"
    />
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
        v-if="type === 'poll' || type === 'quiz'"
      >
        <ft-community-poll :data="postContent" />
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
        <span class="commentCount">
          <font-awesome-icon
            class="comment-count-icon"
            :icon="['fas', 'comment']"
          /> {{ commentCount }}</span>
      </div>
    </div>
  </div>
</template>

<script src="./ft-community-post.js" />
<style scoped src="./ft-community-post.scss" lang="scss" />
<style src="./slider-style.css" lang="css" />
