<template>
  <div
    class="ft-list-post ft-list-item outside"
    :appearance="appearance"
    :class="{ list: listType === 'list', grid: listType === 'grid' }"
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
    <swiper-container
      v-if="type === 'multiImage' && postContent.content.length > 0"
      ref="swiperContainer"
      init="false"
      class="sliderContainer"
    >
      <swiper-slide
        v-for="(img, index) in postContent.content"
        :key="index"
        lazy="true"
      >
        <img
          :src="getBestQualityImage(img)"
          class="communityImage"
          alt=""
          loading="lazy"
        >
      </swiper-slide>
    </swiper-container>
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
        v-if="!hideVideo"
        :data="data.postContent.content"
        appearance=""
      />
      <p
        v-else
        class="hiddenVideo"
      >
        {{ '[' + $t('Channel.Community.Video hidden by FreeTube') + ']' }}
      </p>
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
      <span
        class="likeCount"
        :title="$tc('Global.Counts.Like Count', voteCount, {count: formattedVoteCount})"
        :aria-label="$tc('Global.Counts.Like Count', voteCount, {count: formattedVoteCount})"
      >
        <font-awesome-icon
          class="thumbs-up-icon"
          :icon="['fas', 'thumbs-up']"
          aria-hidden="true"
        /> {{ formattedVoteCount }}</span>
      <router-link
        v-if="isInvidiousAllowed && !singlePost"
        :to="{
          path: `/post/${postId}`,
          query: authorId ? { authorId } : undefined
        }"
        class="commentsLink"
        :aria-label="$t('Channel.Community.View Full Post')"
      >
        <span
          class="commentCount"
          :title="$tc('Global.Counts.Comment Count', commentCount, {count: formattedCommentCount})"
          :aria-label="$tc('Global.Counts.Comment Count', commentCount, {count: formattedCommentCount})"
        >
          <font-awesome-icon
            class="comment-count-icon"
            :icon="['fas', 'comment']"
            aria-hidden="true"
          /> {{ formattedCommentCount }}</span>
      </router-link>
      <span
        v-else-if="commentCount != null"
        class="commentCount"
        :title="$tc('Global.Counts.Comment Count', commentCount, {count: formattedCommentCount})"
        :aria-label="$tc('Global.Counts.Comment Count', commentCount, {count: formattedCommentCount})"
      >
        <font-awesome-icon
          class="comment-count-icon"
          :icon="['fas', 'comment']"
        /> {{ commentCount }}</span>
    </div>
  </div>
</template>

<script src="./ft-community-post.js" />
<style scoped src="./ft-community-post.scss" lang="scss" />
