<template>
  <FtIconButton
    ref="iconButton"
    :title="shareTitle"
    theme="secondary"
    :icon="['fas', 'share-alt']"
    :dropdown-modal-on-mobile="true"
    dropdown-position-x="left"
    :dropdown-position-y="dropdownPositionY"
    :force-dropdown="true"
  >
    <FtFlexBox>
      <FtToggleSwitch
        v-if="isVideo"
        :label="$t('Share.Include Timestamp')"
        :compact="true"
        :default-value="includeTimestamp"
        @change="updateIncludeTimestamp"
      />
    </FtFlexBox>
    <div class="shareLinks">
      <div class="header">
        <img
          id="youtubeShareImage"
          class="youtubeLogo"
          src="~../../assets/img/yt_logo_mono_dark.png"
          alt="YouTube"
          width="794"
          height="178"
        >
      </div>

      <div class="buttons">
        <FtButton
          class="action"
          aria-describedby="youtubeShareImage"
          @click="copyYoutube"
        >
          <FontAwesomeIcon :icon="['fas', 'copy']" />
          {{ $t("Share.Copy Link") }}
        </FtButton>
        <FtButton
          class="action"
          aria-describedby="youtubeShareImage"
          @click="openYoutube"
        >
          <FontAwesomeIcon :icon="['fas', 'globe']" />
          {{ $t("Share.Open Link") }}
        </FtButton>
        <FtButton
          v-if="isVideo || isPlaylist"
          class="action"
          aria-describedby="youtubeShareImage"
          background-color="var(--accent-color-active)"
          @click="copyYoutubeEmbed"
        >
          <FontAwesomeIcon :icon="['fas', 'copy']" />
          {{ $t("Share.Copy Embed") }}
        </FtButton>
        <FtButton
          v-if="isVideo || isPlaylist"
          class="action"
          aria-describedby="youtubeShareImage"
          background-color="var(--accent-color-active)"
          @click="openYoutubeEmbed"
        >
          <FontAwesomeIcon :icon="['fas', 'globe']" />
          {{ $t("Share.Open Embed") }}
        </FtButton>
      </div>

      <template v-if="showInvidiousOptions">
        <div class="divider" />

        <div
          id="invidiousShare"
          class="header invidious"
        >
          <span class="invidiousLogo" /> Invidious
        </div>

        <div class="buttons">
          <FtButton
            aria-describedby="invidiousShare"
            class="action"
            @click="copyInvidious"
          >
            <FontAwesomeIcon :icon="['fas', 'copy']" />
            {{ $t("Share.Copy Link") }}
          </FtButton>
          <FtButton
            aria-describedby="invidiousShare"
            class="action"
            @click="openInvidious"
          >
            <FontAwesomeIcon :icon="['fas', 'globe']" />
            {{ $t("Share.Open Link") }}
          </FtButton>
          <FtButton
            v-if="isVideo || isPlaylist"
            aria-describedby="invidiousShare"
            class="action"
            background-color="var(--accent-color-active)"
            @click="copyInvidiousEmbed"
          >
            <FontAwesomeIcon :icon="['fas', 'copy']" />
            {{ $t("Share.Copy Embed") }}
          </FtButton>
          <FtButton
            v-if="isVideo || isPlaylist"
            aria-describedby="invidiousShare"
            class="action"
            background-color="var(--accent-color-active)"
            @click="openInvidiousEmbed"
          >
            <FontAwesomeIcon :icon="['fas', 'globe']" />
            {{ $t("Share.Open Embed") }}
          </FtButton>
        </div>
      </template>
    </div>
  </FtIconButton>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed, ref } from 'vue'
import { copyToClipboard, openExternalLink } from '../../helpers/utils'
import { useI18n } from '../../composables/use-i18n-polyfill'

import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import FtButton from '../FtButton/FtButton.vue'
import FtToggleSwitch from '../FtToggleSwitch/FtToggleSwitch.vue'
import store from '../../store/index'

const { t } = useI18n()

const props = defineProps({
  shareTargetType: {
    /**
     * Allows to render the dropdown conditionally
     * 'Channel' will exclude embed links
     * 'Video' (default) keeps the original behaviour
     */
    type: String,
    default: 'Video'
  },
  id: {
    type: String,
    required: true
  },
  playlistId: {
    type: String,
    default: ''
  },
  getTimestamp: {
    type: Function,
    default: null
  },
  dropdownPositionY: {
    type: String,
    default: 'bottom'
  }
})

const includeTimestamp = ref(false)
const iconButton = ref(null)

const isChannel = computed(() => {
  return props.shareTargetType === 'Channel'
})

const isPlaylist = computed(() => {
  return props.shareTargetType === 'Playlist'
})

const isVideo = computed(() => {
  return props.shareTargetType === 'Video'
})

const shareTitle = computed(() => {
  if (isChannel.value) {
    return t('Share.Share Channel')
  }
  if (isPlaylist.value) {
    return t('Share.Share Playlist')
  }
  return t('Share.Share Video')
})

const currentInvidiousInstanceUrl = computed(() => {
  return store.getters.getCurrentInvidiousInstanceUrl
})

const showInvidiousOptions = computed(() => {
  return store.getters.getBackendPreference === 'invidious' || store.getters.getBackendFallback
})

const selectedUserPlaylist = computed(() => {
  if (props.playlistId == null || props.playlistId === '') { return null }

  return store.getters.getPlaylist(props.playlistId)
})

const playlistSharable = computed(() => {
  // `playlistId` can be undefined
  // User playlist ID should not be shared
  return props.playlistId && props.playlistId.length !== 0 && selectedUserPlaylist.value == null
})

const invidiousURL = computed(() => {
  if (isChannel.value) {
    return `${currentInvidiousInstanceUrl.value}/channel/${props.id}`
  }
  if (isPlaylist.value) {
    return `${currentInvidiousInstanceUrl.value}/playlist?list=${props.id}`
  }
  let videoUrl = `${currentInvidiousInstanceUrl.value}/watch?v=${props.id}`
  // `playlistId` can be undefined
  if (playlistSharable.value) {
    // `index` seems can be ignored
    videoUrl += `&list=${props.playlistId}`
  }
  return videoUrl
})

const invidiousEmbedURL = computed(() => {
  if (isPlaylist.value) {
    return `${currentInvidiousInstanceUrl.value}/embed/videoseries?list=${props.id}`
  }
  return `${currentInvidiousInstanceUrl.value}/embed/${props.id}`
})

const youtubeChannelUrl = computed(() => {
  return `https://www.youtube.com/channel/${props.id}`
})

const youtubePlaylistUrl = computed(() => {
  return `https://youtube.com/playlist?list=${props.id}`
})

const youtubeURL = computed(() => {
  if (isChannel.value) {
    return youtubeChannelUrl.value
  }
  if (isPlaylist.value) {
    return youtubePlaylistUrl.value
  }
  let videoUrl = `https://www.youtube.com/watch?v=${props.id}`
  if (playlistSharable.value) {
    // `index` seems can be ignored
    videoUrl += `&list=${props.playlistId}`
  }
  return videoUrl
})

const youtubeShareURL = computed(() => {
  if (isChannel.value) {
    return youtubeChannelUrl.value
  }
  if (isPlaylist.value) {
    return youtubePlaylistUrl.value
  }
  const videoUrl = `https://youtu.be/${props.id}`
  if (playlistSharable.value) {
    // `index` seems can be ignored
    return `${videoUrl}?list=${props.playlistId}`
  }
  return videoUrl
})

const youtubeEmbedURL = computed(() => {
  if (isPlaylist.value) {
    return `https://www.youtube-nocookie.com/embed/videoseries?list=${props.id}`
  }
  return `https://www.youtube-nocookie.com/embed/${props.id}`
})

if (isVideo.value && !props.getTimestamp) {
  console.error('Error in props validation: A Video FtShareButton requires a valid get-timestamp function.')
}

function openInvidious() {
  openExternalLink(getFinalUrl(invidiousURL.value))
  iconButton.value.hideDropdown()
}

function copyInvidious() {
  copyToClipboard(getFinalUrl(invidiousURL.value), { messageOnSuccess: t('Share.Invidious URL copied to clipboard') })
  iconButton.value.hideDropdown()
}

function openYoutube() {
  openExternalLink(getFinalUrl(youtubeURL.value))
  iconButton.value.hideDropdown()
}

function copyYoutube() {
  copyToClipboard(getFinalUrl(youtubeShareURL.value), { messageOnSuccess: t('Share.YouTube URL copied to clipboard') })
  iconButton.value.hideDropdown()
}

function openYoutubeEmbed() {
  openExternalLink(getFinalUrl(youtubeEmbedURL.value))
  iconButton.value.hideDropdown()
}

function copyYoutubeEmbed() {
  copyToClipboard(getFinalUrl(youtubeEmbedURL.value), { messageOnSuccess: t('Share.YouTube Embed URL copied to clipboard') })
  iconButton.value.hideDropdown()
}

function openInvidiousEmbed() {
  openExternalLink(getFinalUrl(invidiousEmbedURL.value))
  iconButton.value.hideDropdown()
}

function copyInvidiousEmbed() {
  copyToClipboard(getFinalUrl(invidiousEmbedURL.value), { messageOnSuccess: t('Share.Invidious Embed URL copied to clipboard') })
  iconButton.value.hideDropdown()
}

function updateIncludeTimestamp() {
  includeTimestamp.value = !includeTimestamp.value
}

function getFinalUrl(url) {
  if (isChannel.value || isPlaylist.value) {
    return url
  }
  if (url.indexOf('?') === -1) {
    return includeTimestamp.value ? `${url}?t=${props.getTimestamp()}` : url
  }
  return includeTimestamp.value ? `${url}&t=${props.getTimestamp()}` : url
}
</script>
<style scoped src="./FtShareButton.css" />
