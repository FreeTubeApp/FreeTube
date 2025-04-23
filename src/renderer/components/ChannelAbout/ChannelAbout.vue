<template>
  <div
    class="about"
  >
    <template
      v-if="description"
    >
      <h2>{{ $t("Channel.About.Channel Description") }}</h2>
      <div
        class="aboutInfo"
        v-html="description"
      />
    </template>
    <template
      v-if="joined || views !== null || videos !== null || location"
    >
      <h2>{{ $t('Channel.About.Details') }}</h2>
      <table
        class="aboutDetails"
      >
        <tr
          v-if="joined"
        >
          <th
            scope="row"
          >
            {{ $t('Channel.About.Joined') }}
          </th>
          <td>{{ formattedJoined }}</td>
        </tr>
        <tr
          v-if="views !== null"
        >
          <th
            scope="row"
          >
            {{ $t('Video.Views') }}
          </th>
          <td>{{ formattedViews }}</td>
        </tr>
        <tr
          v-if="videos !== null"
        >
          <th
            scope="row"
          >
            {{ $t('Global.Videos') }}
          </th>
          <td>{{ formattedVideos }}</td>
        </tr>
        <tr
          v-if="location"
        >
          <th
            scope="row"
          >
            {{ $t('Channel.About.Location') }}
          </th>
          <td>{{ location }}</td>
        </tr>
      </table>
    </template>
    <template
      v-if="tags.length > 0"
    >
      <h2>{{ $t('Channel.About.Tags.Tags') }}</h2>
      <ul
        class="aboutTags"
      >
        <li
          v-for="tag in tags"
          :key="tag"
          class="aboutTag"
        >
          <router-link
            v-if="!hideSearchBar"
            class="aboutTagLink"
            :title="$t('Channel.About.Tags.Search for', { tag })"
            :to="{
              path: `/search/${encodeURIComponent(tag)}`,
              query: searchSettings
            }"
          >
            {{ tag }}
          </router-link>
          <span
            v-else
            class="aboutTagLink"
          >
            {{ tag }}
          </span>
        </li>
      </ul>
    </template>
    <template
      v-if="!hideFeaturedChannels && relatedChannels.length > 0"
    >
      <h2>{{ $t("Channel.About.Featured Channels") }}</h2>
      <FtFlexBox>
        <FtChannelBubble
          v-for="channel in relatedChannels"
          :key="channel.id"
          :channel-id="channel.id"
          :channel-name="channel.name"
          :channel-thumbnail="channel.thumbnailUrl"
        />
      </FtFlexBox>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'

import FtChannelBubble from '../../components/FtChannelBubble/FtChannelBubble.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'

import store from '../../store/index'

import { formatNumber } from '../../helpers/utils'

const { locale } = useI18n()

const props = defineProps({
  description: {
    type: String,
    default: ''
  },
  joined: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: null
  },
  videos: {
    type: Number,
    default: null
  },
  location: {
    type: String,
    default: null
  },
  tags: {
    type: Array,
    default: () => []
  },
  relatedChannels: {
    type: Array,
    default: () => []
  }
})

/** @type {import('vue').ComputedRef<boolean>} */
const hideFeaturedChannels = computed(() => {
  return store.getters.getHideFeaturedChannels
})

/** @type {import('vue').ComputedRef<boolean>} */
const hideSearchBar = computed(() => {
  return store.getters.getHideSearchBar
})

/** @type {import('vue').ComputedRef<{ sortBy: string, time: string, type: string, duration: string, features: string[] }>} */
const searchSettings = computed(() => {
  return store.getters.getSearchSettings
})

const formattedJoined = computed(() => {
  return new Intl.DateTimeFormat([locale.value, 'en'], { dateStyle: 'long' }).format(props.joined)
})

const formattedViews = computed(() => formatNumber(props.views))
const formattedVideos = computed(() => formatNumber(props.videos))
</script>

<style scoped src="./ChannelAbout.css" />
