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
      v-if="type === 'multiImage'"
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
      v-if="type === 'image'"
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
        {{ postContent.content.totalVotes }}
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
      <router-link
        class="videoThumbnail"
        :to="`/playlist/${postContent.content.playlistId}`"
      >
        <div
          class="imageWrapper"
        >
          <img
            :src="postContent.content.thumbnails[0].thumbnails[0].url"
            class="thumbnailImage"
            alt=""
          >
        </div>
      </router-link>
      <div
        class="playlistText"
      >
        <router-link
          class="playlistTitle"
          :to="`/playlist/${playlistId}`"
        >
          {{ postContent.content.title }}
        </router-link>
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
            {{ $t('Channel.Videos.Videos') }}
          </span>
          <br>
        </span>
        <router-link
          v-for="video in postContent.content.playlistVideoRenderer"
          :key="video.videoId"
          class="playlistPreviewVideos"
          :to="`/watch/${video.videoId}`"
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
        </router-link>
      </div>
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
<style scoped src="./ft-community-post.scss" lang="scss" />
