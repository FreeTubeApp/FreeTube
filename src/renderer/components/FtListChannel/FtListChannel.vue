<template>
  <div
    class="ft-list-channel ft-list-item"
    :class="{
      list: listType === 'list',
      grid: listType === 'grid',
      [appearance]: true
    }"
  >
    <div class="channelThumbnail">
      <router-link
        :to="`/channel/${id}`"
        class="channelThumbnailLink"
        tabindex="-1"
        aria-hidden="true"
      >
        <img
          :src="thumbnail"
          :class="!isGame ? 'channelImage' : 'gameImage'"
          alt=""
        >
      </router-link>
    </div>
    <div class="infoAndSubscribe">
      <div class="info">
        <router-link
          class="title"
          :to="`/channel/${id}`"
        >
          <h3 class="h3Title">
            {{ name }}
          </h3>
        </router-link>
        <div class="infoLine">
          <router-link
            v-if="handle !== null"
            class="handle"
            :to="`/channel/${id}`"
          >
            {{ handle }}
          </router-link>
          <span
            v-if="subscriberCount !== null && !hideChannelSubscriptions"
            class="subscriberCount"
          >
            <template v-if="handle !== null"> • </template>
            {{ $tc('Global.Counts.Subscriber Count', subscriberCount, {count: formattedSubscriberCount}) }}
          </span>
          <span
            v-if="handle == null && videoCount != null"
            class="videoCount"
          >
            <template v-if="subscriberCount !== null && !hideChannelSubscriptions"> • </template>
            {{ $tc('Global.Counts.Video Count', videoCount, {count: formattedVideoCount}) }}
          </span>
        </div>
        <p
          v-if="listType !== 'grid'"
          class="description"
          v-html="description"
        />
      </div>
      <FtSubscribeButton
        v-if="!hideUnsubscribeButton"
        class="channelSubscribeButton"
        :channel-id="id"
        :channel-name="name"
        :channel-thumbnail="thumbnail"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

import FtSubscribeButton from '../FtSubscribeButton/FtSubscribeButton.vue'

import store from '../../store/index'

import { youtubeImageUrlToInvidious } from '../../helpers/api/invidious'
import { formatNumber } from '../../helpers/utils'

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  appearance: {
    type: String,
    required: true
  }
})

/** @type {import('vue').ComputedRef<string>} */
const currentInvidiousInstanceUrl = computed(() => {
  return store.getters.getCurrentInvidiousInstanceUrl
})

/** @type {import('vue').ComputedRef<'grid' | 'list'>} */
const listType = computed(() => {
  return store.getters.getListType
})

/** @type {import('vue').ComputedRef<boolean>} */
const hideChannelSubscriptions = computed(() => {
  return store.getters.getHideChannelSubscriptions
})

/** @type {import('vue').ComputedRef<boolean>} */
const hideUnsubscribeButton = computed(() => {
  return store.getters.getHideUnsubscribeButton
})

let id = ''
let thumbnail = ''
let name = ''
/** @type {number?} */
let subscriberCount = null
/** @type {number?} */
let videoCount = null
/** @type {string?} */
let handle = null
let description = ''
let isGame = null

if (process.env.SUPPORTS_LOCAL_API && props.data.dataSource === 'local') {
  parseLocalData()
} else {
  parseInvidiousData()
}

const formattedSubscriberCount = computed(() => {
  if (subscriberCount != null) {
    return formatNumber(subscriberCount)
  }

  return ''
})

const formattedVideoCount = computed(() => {
  if (videoCount != null) {
    return formatNumber(videoCount)
  }

  return ''
})

function parseLocalData() {
  thumbnail = props.data.thumbnail
  name = props.data.name
  id = props.data.id

  if (props.data.subscribers != null) {
    subscriberCount = props.data.subscribers
  }

  if (props.data.videos != null) {
    videoCount = props.data.videos
  }

  if (props.data.handle) {
    handle = props.data.handle
  }

  description = props.data.descriptionShort
  isGame = props.data.isGame
}

function parseInvidiousData() {
  // Can be prefixed with `https://` or `//` (protocol relative)
  /** @type {string} */
  const thumbnailUrl = props.data.authorThumbnails[2].url

  thumbnail = youtubeImageUrlToInvidious(thumbnailUrl, currentInvidiousInstanceUrl.value)

  name = props.data.author
  id = props.data.authorId
  subscriberCount = props.data.subCount

  if (props.data.channelHandle != null) {
    handle = props.data.channelHandle
  } else {
    videoCount = props.data.videoCount
  }

  description = props.data.description
}
</script>

<style scoped lang="scss" src="./FtListChannel.scss" />
