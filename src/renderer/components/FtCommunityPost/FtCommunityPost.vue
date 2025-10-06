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
      v-if="postType === 'multiImage' && postContent.content.length > 0"
      ref="swiperContainerRef"
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
      v-if="postType === 'image' && postContent.content.length > 0"
    >
      <img
        :src="getBestQualityImage(postContent.content)"
        class="communityImage"
        alt=""
      >
    </div>
    <div
      v-if="postType === 'video'"
    >
      <FtListVideo
        v-if="!hideVideo"
        :data="data.postContent.content"
        appearance=""
      />
      <p
        v-else
        class="hiddenVideo"
      >
        {{ '[' + $t('Channel.Posts.Video hidden by FreeTube') + ']' }}
      </p>
    </div>
    <div
      v-if="postType === 'poll' || postType === 'quiz'"
    >
      <FtCommunityPoll :data="postContent" />
    </div>
    <div
      v-if="postType === 'playlist'"
      class="playlistWrapper"
    >
      <FtListPlaylist
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
        <FontAwesomeIcon
          class="thumbs-up-icon"
          :icon="['fas', 'thumbs-up']"
          aria-hidden="true"
        /> {{ formattedVoteCount }}</span>
      <router-link
        v-if="!singlePost"
        :to="{
          path: `/post/${postId}`,
          query: authorId ? { authorId } : undefined
        }"
        class="commentsLink"
        :aria-label="$t('Channel.Posts.View Full Post')"
      >
        <span
          class="commentCount"
          :title="$tc('Global.Counts.Comment Count', commentCount, {count: formattedCommentCount})"
          :aria-label="$tc('Global.Counts.Comment Count', commentCount, {count: formattedCommentCount})"
        >
          <FontAwesomeIcon
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
        <FontAwesomeIcon
          class="comment-count-icon"
          :icon="['fas', 'comment']"
        /> {{ commentCount }}</span>
    </div>
  </div>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import autolinker from 'autolinker'
import { A11y, Navigation, Pagination } from 'swiper/modules'
import { computed, onMounted, ref } from 'vue'

import FtListVideo from '../ft-list-video/ft-list-video.vue'
import FtListPlaylist from '../FtListPlaylist/FtListPlaylist.vue'
import FtCommunityPoll from '../FtCommunityPoll/FtCommunityPoll.vue'

import store from '../../store/index'

import {
  createWebURL,
  deepCopy,
  formatNumber,
  getRelativeTimeFromDate,
} from '../../helpers/utils'
import { youtubeImageUrlToInvidious } from '../../helpers/api/invidious'

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  appearance: {
    type: String,
    required: true
  },
  hideForbiddenTitles: {
    type: Boolean,
    default: true
  },
  singlePost: {
    type: Boolean,
    default: false
  },
})

/** @type {import('vue').ComputedRef<'grid' | 'list'>} */
const listType = computed(() => {
  return store.getters.getListType
})

/** @type {import('vue').ComputedRef<string[]>} */
const forbiddenTitles = computed(() => {
  if (!props.hideForbiddenTitles) { return [] }
  return JSON.parse(store.getters.getForbiddenTitles)
})

const hideVideo = computed(() => {
  return forbiddenTitles.value.some((text) => props.data.postContent.content.title?.toLowerCase().includes(text.toLowerCase()))
})

/** @type {import('vue').ComputedRef<'local' | 'invidious'>} */
const backendPreference = computed(() => {
  return store.getters.getBackendPreference
})

let postType = ''
let postText = ''
let postId = ''
/** @type {string[]?} */
let authorThumbnails = null
let postContent = ''
let author = ''
let authorId = ''
let voteCount = 0
/** @type {number?} */
let commentCount = null

parseCommunityData()

const formattedCommentCount = computed(() => {
  if (commentCount != null) {
    return formatNumber(commentCount)
  }

  return ''
})

const formattedVoteCount = computed(() => {
  return formatNumber(voteCount)
})

const publishedText = computed(() => {
  if (props.data.publishedTime) {
    return getRelativeTimeFromDate(props.data.publishedTime)
  }

  return ''
})

function parseCommunityData() {
  if ('backstagePostThreadRenderer' in props.data) {
    postText = 'Shared post'
    postType = 'text'

    authorThumbnails = ['', 'https://yt3.ggpht.com/ytc/AAUvwnjm-0qglHJkAHqLFsCQQO97G7cCNDuDLldsrn25Lg=s88-c-k-c0x00ffffff-no-rj']

    if (!process.env.SUPPORTS_LOCAL_API || backendPreference.value === 'invidious') {
      authorThumbnails.forEach(thumbnail => {
        thumbnail.url = youtubeImageUrlToInvidious(thumbnail.url)
      })
    }

    return
  }

  postText = autolinker.link(props.data.postText)
  postContent = props.data.postContent
  postId = props.data.postId
  voteCount = props.data.voteCount
  commentCount = props.data.commentCount
  postType = props.data.postContent?.type ?? 'text'
  author = props.data.author
  authorId = props.data.authorId

  authorThumbnails = deepCopy(props.data.authorThumbnails)

  if (!process.env.SUPPORTS_LOCAL_API || backendPreference.value === 'invidious') {
    authorThumbnails.forEach(thumbnail => {
      thumbnail.url = youtubeImageUrlToInvidious(thumbnail.url)
    })
  } else {
    authorThumbnails.forEach(thumbnail => {
      if (thumbnail.url.startsWith('//')) {
        thumbnail.url = 'https:' + thumbnail.url
      }
    })
  }
}

/**
 * @param {{ width: number, height: number, url: string }[]} imageArray
 */
function getBestQualityImage(imageArray) {
  const imageArrayCopy = Array.from(imageArray)
  imageArrayCopy.sort((a, b) => {
    return Number.parseInt(b.width) - Number.parseInt(a.width)
  })

  // Remove cropping directives when applicable
  return imageArrayCopy[0]?.url?.replace(/-c-fcrop64=[^-]+/i, '') ?? ''
}

const swiperContainerRef = ref(null)

if (postType === 'multiImage' && postContent.content.length > 0) {
  onMounted(() => {
    /** @type {import('swiper/element').SwiperContainer} */
    const swiperOptions = {
      modules: [A11y, Navigation, Pagination],

      injectStylesUrls: [
        // This file is created with the copy webpack plugin in the web and renderer webpack configs.
        // If you add more modules, please remember to add their CSS files to the list in webpack config files.
        createWebURL(`/swiper-${process.env.SWIPER_VERSION}.css`)
      ],

      a11y: true,
      navigation: true,
      pagination: {
        enabled: true,
        clickable: true
      },
      slidesPerView: 1
    }

    Object.assign(swiperContainerRef.value, swiperOptions)

    swiperContainerRef.value.initialize()
  })
}
</script>

<style scoped src="./FtCommunityPost.scss" lang="scss" />
