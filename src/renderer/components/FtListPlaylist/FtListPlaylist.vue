<template>
  <div
    class="ft-list-video ft-list-item"
    :class="{
      [appearance]: true,
      list: listType === 'list',
      grid: listType === 'grid'
    }"
  >
    <div
      class="videoThumbnail"
    >
      <RouterLink
        class="thumbnailLink"
        :to="playlistPageLinkTo"
        tabindex="-1"
        aria-hidden="true"
      >
        <img
          alt=""
          :src="thumbnailForDisplay"
          class="thumbnailImage"
          :class="{ blur: blurThumbnails }"
        >
      </RouterLink>
      <div
        class="videoCountContainer"
      >
        <div class="background" />
        <div class="inner">
          <div>{{ videoCount }}</div>
          <div><FontAwesomeIcon :icon="['fas','list']" /></div>
        </div>
      </div>
    </div>
    <div class="info">
      <RouterLink
        class="title"
        :to="playlistPageLinkTo"
      >
        <h3 class="h3Title">
          {{ titleForDisplay }}
        </h3>
      </RouterLink>
      <div class="infoLine">
        <RouterLink
          v-if="channelId"
          class="channelName"
          :to="`/channel/${channelId}`"
        >
          {{ channelName }}
        </RouterLink>
        <span
          v-else
          class="channelName"
        >
          {{ channelName }}
        </span>
      </div>
      <FtIconButton
        v-if="externalPlayer !== '' && !isUserPlaylist"
        :title="t('Video.External Player.OpenInTemplate', { externalPlayer })"
        :icon="['fas', 'external-link-alt']"
        class="externalPlayerButton"
        theme="base-no-default"
        :size="16"
        :use-shadow="false"
        @click="handleExternalPlayer"
      />
      <span
        v-if="isUserPlaylist"
        class="playlistIcons"
      >
        <FtIconButton
          :title="markedAsQuickBookmarkTarget ? t('User Playlists.Quick Bookmark Enabled') : t('User Playlists.Enable Quick Bookmark With This Playlist')"
          :icon="markedAsQuickBookmarkTarget ? ['fas', 'bookmark'] : ['far', 'bookmark']"
          :disabled="markedAsQuickBookmarkTarget"
          :theme="markedAsQuickBookmarkTarget ? 'secondary' : 'base-no-default'"
          :size="16"
          @disabled-click="handleQuickBookmarkEnabledDisabledClick"
          @click="enableQuickBookmarkForThisPlaylist"
        />
      </span>
    </div>
  </div>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'

import FtIconButton from '../ft-icon-button/ft-icon-button.vue'

import store from '../../store/index'

import { showToast } from '../../helpers/utils'
import thumbnailPlaceholder from '../../assets/img/thumbnail_placeholder.svg'

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  appearance: {
    type: String,
    required: true
  },
  searchQueryText: {
    type: String,
    default: ''
  },
})

const { t } = useI18n()

let playlistId = ''
let title = ''
/** @type {string} */
let thumbnail = thumbnailPlaceholder
/** @type {string | null} */
let channelId = null
let channelName = ''
let videoCount = 0

/** @type {import('vue').ComputedRef<'grid' | 'list'>} */
const listType = computed(() => store.getters.getListType)

const titleForDisplay = computed(() => {
  if (typeof title !== 'string') {
    return ''
  }
  if (title.length <= 255) {
    return title
  }

  return `${title.slice(0, 255)}...`
})

/** @type {import('vue').ComputedRef<boolean>} */
const blurThumbnails = computed(() => store.getters.getBlurThumbnails)

/** @type {import('vue').ComputedRef<'' | 'start' | 'middle' | 'end' | 'hidden' | 'blur'>} */
const thumbnailPreference = computed(() => store.getters.getThumbnailPreference)

/** @type {import('vue').ComputedRef<string>} */
const thumbnailForDisplay = computed(() => {
  return thumbnailPreference.value !== 'hidden' ? thumbnail : thumbnailPlaceholder
})

const isUserPlaylist = computed(() => props.data._id != null)

// For `router-link` attribute `to`
const playlistPageLinkTo = computed(() => ({
  path: `/playlist/${playlistId}`,
  query: {
    playlistType: isUserPlaylist.value ? 'user' : '',
    searchQueryText: props.searchQueryText,
  },
}))

/** @type {import('vue').ComputedRef<'local' | 'invidious'>} */
const backendPreference = computed(() => store.getters.getBackendPreference)

/** @type {import('vue').ComputedRef<string>} */
const currentInvidiousInstanceUrl = computed(() => store.getters.getCurrentInvidiousInstanceUrl)

if (isUserPlaylist.value) {
  parseUserData()
} else if (props.data.dataSource === 'local') {
  parseLocalData()
} else {
  parseInvidiousData()
}

function parseInvidiousData() {
  title = props.data.title

  thumbnail = props.data.playlistThumbnail
    .replace('https://i.ytimg.com', currentInvidiousInstanceUrl.value)
    .replace('hqdefault', 'mqdefault')

  channelName = props.data.author
  channelId = props.data.authorId
  playlistId = props.data.playlistId
  videoCount = props.data.videoCount

  if (props.data.proxyThumbnail === false) {
    thumbnail = props.data.playlistThumbnail
  }
}

function parseLocalData() {
  title = props.data.title

  thumbnail = props.data.thumbnail

  channelName = props.data.channelName
  channelId = props.data.channelId
  playlistId = props.data.playlistId
  videoCount = props.data.videoCount
}

function parseUserData() {
  title = props.data.playlistName

  if (props.data.videos.length > 0) {
    const origin = backendPreference.value === 'invidious'
      ? currentInvidiousInstanceUrl.value
      : 'https://i.ytimg.com'

    thumbnail = `${origin}/vi/${props.data.videos[0].videoId}/mqdefault.jpg`
  }

  channelName = ''
  channelId = ''
  playlistId = props.data._id
  videoCount = props.data.videos.length
}

/** @type {import('vue').ComputedRef<string | null>} */
const quickBookmarkPlaylistId = computed(() => store.getters.getQuickBookmarkTargetPlaylistId)

const markedAsQuickBookmarkTarget = computed(() => {
  // Only user playlists can be target
  return playlistId != null &&
    quickBookmarkPlaylistId.value != null &&
    quickBookmarkPlaylistId.value === playlistId
})

function handleQuickBookmarkEnabledDisabledClick() {
  showToast(t('User Playlists.SinglePlaylistView.Toast["This playlist is already being used for quick bookmark."]'))
}

async function enableQuickBookmarkForThisPlaylist() {
  const currentQuickBookmarkTargetPlaylist = store.getters.getQuickBookmarkPlaylist

  store.dispatch('updateQuickBookmarkTargetPlaylistId', playlistId)

  if (currentQuickBookmarkTargetPlaylist != null) {
    showToast(
      t('User Playlists.SinglePlaylistView.Toast["This playlist is now used for quick bookmark instead of {oldPlaylistName}. Click here to undo"]', {
        oldPlaylistName: currentQuickBookmarkTargetPlaylist.playlistName,
      }),
      5000,
      () => {
        store.dispatch('updateQuickBookmarkTargetPlaylistId', currentQuickBookmarkTargetPlaylist._id)
        showToast(
          t('User Playlists.SinglePlaylistView.Toast["Reverted to use {oldPlaylistName} for quick bookmark"]', {
            oldPlaylistName: currentQuickBookmarkTargetPlaylist.playlistName,
          }),
          5000,
        )
      },
    )
  } else {
    showToast(t('User Playlists.SinglePlaylistView.Toast.This playlist is now used for quick bookmark'))
  }
}

/** @type {import('vue').ComputedRef<string>} */
const externalPlayer = computed(() => store.getters.getExternalPlayer)

/** @type {import('vue').ComputedRef<number>} */
const defaultPlayback = computed(() => store.getters.getDefaultPlayback)

function handleExternalPlayer() {
  store.dispatch('openInExternalPlayer', {
    watchProgress: 0,
    playbackRate: defaultPlayback.value,
    videoId: null,
    playlistId: playlistId,
    playlistIndex: null,
    playlistReverse: null,
    playlistShuffle: null,
    playlistLoop: null
  })
}
</script>

<style scoped lang="scss" src="./FtListPlaylist.scss" />
