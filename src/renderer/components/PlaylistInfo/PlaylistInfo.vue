<template>
  <div
    class="playlistInfo"
    :class="{ [theme]: true }"
  >
    <div
      class="playlistThumbnail"
    >
      <router-link
        v-if="firstVideoIdExists"
        :to="{
          path: `/watch/${firstVideoId}`,
          query: {
            playlistId: id,
            playlistType: videoPlaylistType,
            playlistItemId: firstVideoPlaylistItemId,
          },
        }"
        tabindex="-1"
      >
        <img
          :src="thumbnail"
          alt=""
          :class="{ blur: blurThumbnails }"
        >
      </router-link>
      <img
        v-else
        :src="thumbnail"
        alt=""
        :class="{ blur: blurThumbnails }"
      >
    </div>

    <div class="playlistStats">
      <template
        v-if="editMode"
      >
        <FtInput
          ref="playlistTitleInput"
          class="inputElement"
          :placeholder="$t('User Playlists.Playlist Name')"
          :show-action-button="false"
          :show-label="false"
          :value="newTitle"
          :maxlength="255"
          @input="handlePlaylistNameInput"
          @keydown.enter.native="savePlaylistInfo"
        />
        <FtFlexBox v-if="inputPlaylistNameBlank">
          <p>
            {{ $t('User Playlists.SinglePlaylistView.Toast["Playlist name cannot be empty. Please input a name."]') }}
          </p>
        </FtFlexBox>
        <FtFlexBox v-if="inputPlaylistWithNameExists">
          <p>
            {{ $t('User Playlists.CreatePlaylistPrompt.Toast["There is already a playlist with this name. Please pick a different name."]') }}
          </p>
        </FtFlexBox>
      </template>
      <template
        v-else
      >
        <h2
          class="playlistTitle"
        >
          {{ title }}
        </h2>
        <p>
          {{ $tc('Global.Counts.Video Count', videoCount, { count: parsedVideoCount }) }}
          <span v-if="!hideViews && !isUserPlaylist">
            - {{ $tc('Global.Counts.View Count', viewCount, { count: parsedViewCount }) }}
          </span>
          <span>- </span>
          <span v-if="infoSource !== 'local'">
            {{ $t("Playlist.Last Updated On") }}
          </span>
          {{ lastUpdated }}
          <template v-if="durationFormatted !== ''">
            <br>
            {{ $t('User Playlists.TotalTimePlaylist', { duration: durationFormatted }) }}
          </template>
        </p>
      </template>
    </div>

    <FtInput
      v-if="editMode"
      class="inputElement descriptionInput"
      :placeholder="$t('User Playlists.Playlist Description')"
      :show-action-button="false"
      :show-label="false"
      :value="newDescription"
      @input="(input) => newDescription = input"
      @keydown.enter.native="savePlaylistInfo"
    />
    <p
      v-else
      class="playlistDescription"
      v-text="description"
    />

    <hr class="playlistInfoSeparator">

    <div
      class="channelShareWrapper"
    >
      <router-link
        v-if="!isUserPlaylist && channelId"
        class="playlistChannel"
        :to="`/channel/${channelId}`"
      >
        <img
          class="channelThumbnail"
          :src="channelThumbnail"
          alt=""
        >
        <h3
          class="channelName"
        >
          {{ channelName }}
        </h3>
      </router-link>
      <div
        v-else
        class="playlistChannel"
      >
        <h3
          class="channelName"
        >
          {{ channelName }}
        </h3>
      </div>

      <div class="playlistOptionsAndSearch">
        <div class="playlistOptions">
          <FtIconButton
            v-if="editMode"
            :title="$t('User Playlists.Save Changes')"
            :disabled="playlistPersistenceDisabled"
            :icon="['fas', 'save']"
            theme="secondary"
            @click="savePlaylistInfo"
          />
          <FtIconButton
            v-if="editMode"
            :title="$t('User Playlists.Cancel')"
            :icon="['fas', 'times']"
            theme="secondary"
            @click="exitEditMode"
          />
          <FtIconButton
            v-if="!editMode && isUserPlaylist"
            :title="markedAsQuickBookmarkTarget ? $t('User Playlists.Quick Bookmark Enabled') : $t('User Playlists.Enable Quick Bookmark With This Playlist')"
            :icon="markedAsQuickBookmarkTarget ? ['fas', 'bookmark'] : ['far', 'bookmark']"
            :disabled="markedAsQuickBookmarkTarget"
            :theme="markedAsQuickBookmarkTarget ? 'secondary' : 'base-no-default'"
            @disabled-click="handleQuickBookmarkEnabledDisabledClick"
            @click="enableQuickBookmarkForThisPlaylist"
          />
          <FtIconButton
            v-if="!editMode && isUserPlaylist"
            :title="$t('User Playlists.Edit Playlist Info')"
            :icon="['fas', 'edit']"
            theme="secondary"
            @click="enterEditMode"
          />
          <FtIconButton
            v-if="videoCount > 0 && showPlaylists && !editMode"
            :title="$t('User Playlists.Copy Playlist')"
            :icon="['fas', 'copy']"
            theme="secondary"
            @click="toggleCopyVideosPrompt"
          />
          <FtIconButton
            v-if="exportPlaylistButtonVisible"
            :title="$t('User Playlists.Export Playlist')"
            :icon="['fas', 'file-arrow-down']"
            theme="secondary"
            @click="showExportPrompt = true"
          />
          <FtIconButton
            v-if="!editMode && userPlaylistDuplicateItemCount > 0"
            :title="$t('User Playlists.Remove Duplicate Videos')"
            :icon="['fas', 'users-slash']"
            theme="destructive"
            @click="showRemoveDuplicateVideosPrompt = true"
          />
          <FtIconButton
            v-if="!editMode && userPlaylistAnyVideoWatched"
            :title="$t('User Playlists.Remove Watched Videos')"
            :icon="['fas', 'eye-slash']"
            theme="destructive"
            @click="showRemoveVideosOnWatchPrompt = true"
          />
          <FtIconButton
            v-if="deletePlaylistButtonVisible"
            :disabled="markedAsQuickBookmarkTarget"
            :title="!markedAsQuickBookmarkTarget ? $t('User Playlists.Delete Playlist') : playlistDeletionDisabledLabel"
            :icon="['fas', 'trash']"
            theme="destructive"
            @disabled-click="handlePlaylistDeleteDisabledClick"
            @click="showDeletePlaylistPrompt = true"
          />
          <FtShareButton
            v-if="sharePlaylistButtonVisible"
            :id="id"
            class="sharePlaylistIcon"
            :dropdown-position-y="description ? 'top' : 'bottom'"
            share-target-type="Playlist"
          />
        </div>
        <div
          v-if="searchVideoModeAllowed"
          class="searchInputsRow"
        >
          <FtInput
            ref="searchInput"
            class="inputElement"
            :placeholder="$t('User Playlists.SinglePlaylistView.Search for Videos')"
            :show-clear-text-button="true"
            :show-action-button="false"
            :value="query"
            :maxlength="255"
            @input="updateQueryDebounced"
            @clear="updateQueryDebounced('')"
          />
        </div>
      </div>
      <FtPrompt
        v-if="showDeletePlaylistPrompt"
        :label="$t('User Playlists.Are you sure you want to delete this playlist? This cannot be undone')"
        :option-names="deletePlaylistPromptNames"
        :option-values="DELETE_PLAYLIST_PROMPT_VALUES"
        is-first-option-destructive
        @click="handleDeletePlaylistPromptAnswer"
      />
      <FtPrompt
        v-if="showRemoveVideosOnWatchPrompt"
        :label="removeVideosOnWatchPromptLabelText"
        :option-names="deletePlaylistPromptNames"
        :option-values="DELETE_PLAYLIST_PROMPT_VALUES"
        is-first-option-destructive
        @click="handleRemoveVideosOnWatchPromptAnswer"
      />
      <FtPrompt
        v-if="showRemoveDuplicateVideosPrompt"
        :label="removeDuplicateVideosPromptLabelText"
        :option-names="deletePlaylistPromptNames"
        :option-values="DELETE_PLAYLIST_PROMPT_VALUES"
        is-first-option-destructive
        @click="handleRemoveDuplicateVideosPromptAnswer"
      />
      <FtPrompt
        v-if="showExportPrompt"
        :label="t('Settings.Data Settings.Select Export Type')"
        :option-names="exportNames"
        :option-values="EXPORT_VALUES"
        @click="handleExport"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'
import { useRouter } from 'vue-router/composables'

import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtIconButton from '../ft-icon-button/ft-icon-button.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtPrompt from '../FtPrompt/FtPrompt.vue'
import FtShareButton from '../FtShareButton/FtShareButton.vue'

import store from '../../store/index'

import {
  ctrlFHandler,
  debounce,
  formatNumber,
  showToast,
  getTodayDateStrLocalTimezone,
  writeFileWithPicker,
} from '../../helpers/utils'
import thumbnailPlaceholder from '../../assets/img/thumbnail_placeholder.svg'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  firstVideoId: {
    type: String,
    required: true,
  },
  firstVideoPlaylistItemId: {
    type: String,
    required: true,
  },
  playlistThumbnail: {
    type: String,
    required: true,
  },
  theme: {
    type: String,
    default: 'base'
  },
  title: {
    type: String,
    required: true,
  },
  channelThumbnail: {
    type: String,
    required: true,
  },
  channelName: {
    type: String,
    required: true,
  },
  channelId: {
    type: String,
    default: null,
  },
  videoCount: {
    type: Number,
    required: true,
  },
  videos: {
    type: Array,
    required: true
  },
  sortedVideos: {
    type: Array,
    required: true
  },
  viewCount: {
    type: Number,
    required: true,
  },
  totalPlaylistDuration: {
    type: Number,
    required: true
  },
  isDurationApproximate: {
    type: Boolean,
    required: true
  },
  lastUpdated: {
    type: String,
    default: undefined,
  },
  description: {
    type: String,
    required: true,
  },
  infoSource: {
    type: String,
    required: true,
  },
  moreVideoDataAvailable: {
    type: Boolean,
    required: true,
  },
  searchVideoModeAllowed: {
    type: Boolean,
    required: true,
  },
  searchQueryText: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['enter-edit-mode', 'exit-edit-mode', 'search-video-query-change', 'prompt-open', 'prompt-close'])

const { locale, t } = useI18n()

const query = ref('')
const editMode = ref(false)
const showDeletePlaylistPrompt = ref(false)
const showRemoveVideosOnWatchPrompt = ref(false)
const showRemoveDuplicateVideosPrompt = ref(false)
const showExportPrompt = ref(false)
const newTitle = ref(props.title)
const newDescription = ref(props.description)

if (props.videoCount > 0) {
  query.value = props.searchQueryText
}

const durationFormatted = computed(() => {
  const total = props.totalPlaylistDuration

  const duration = {
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }

  let formatted = new Intl.DurationFormat([locale.value, 'en'], { style: 'short' }).format(duration)

  if (props.moreVideoDataAvailable && !isUserPlaylist.value) {
    formatted += '+'
  }

  if (props.isDurationApproximate && formatted) {
    formatted = `~${formatted}`
  }

  return formatted
})

/** @type {import('vue').ComputedRef<boolean>} */
const hideSharingActions = computed(() => store.getters.getHideSharingActions)

/** @type {import('vue').ComputedRef<string>} */
const currentInvidiousInstanceUrl = computed(() => store.getters.getCurrentInvidiousInstanceUrl)

/** @type {import('vue').ComputedRef<Record<string, object>>} */
const historyCacheById = computed(() => store.getters.getHistoryCacheById)

/** @type {import('vue').ComputedRef<'' | 'start' | 'middle' | 'end' | 'hidden' | 'blur'>} */
const thumbnailPreference = computed(() => store.getters.getThumbnailPreference)

/** @type {import('vue').ComputedRef<boolean>} */
const blurThumbnails = computed(() => store.getters.getBlurThumbnails)

/** @type {import('vue').ComputedRef<'local' | 'invidious'>} */
const backendPreference = computed(() => store.getters.getBackendPreference)

/** @type {import('vue').ComputedRef<boolean>} */
const hideViews = computed(() => store.getters.getHideVideoViews)

/** @type {import('vue').ComputedRef<boolean>} */
const showPlaylists = computed(() => !store.getters.getHidePlaylists)

/** @type {import('vue').ComputedRef<object | undefined>} */
const selectedUserPlaylist = computed(() => store.getters.getPlaylist(props.id))

/** @type {import('vue').ComputedRef<object[]>} */
const allPlaylists = computed(() => store.getters.getAllPlaylists)

const firstVideoIdExists = computed(() => props.firstVideoId !== '')

const parsedViewCount = computed(() => formatNumber(props.viewCount))
const parsedVideoCount = computed(() => formatNumber(props.videoCount))

/** @type {import('vue').ComputedRef<string>} */
const thumbnail = computed(() => {
  if (thumbnailPreference.value === 'hidden' || !firstVideoIdExists.value) {
    return thumbnailPlaceholder
  }

  let baseUrl = 'https://i.ytimg.com'
  if (backendPreference.value === 'invidious') {
    baseUrl = currentInvidiousInstanceUrl.value
  } else if (typeof props.playlistThumbnail === 'string' && props.playlistThumbnail.length > 0) {
    // Use playlist thumbnail provided by YT when available
    return props.playlistThumbnail
  }

  switch (thumbnailPreference.value) {
    case 'start':
      return `${baseUrl}/vi/${props.firstVideoId}/mq1.jpg`
    case 'middle':
      return `${baseUrl}/vi/${props.firstVideoId}/mq2.jpg`
    case 'end':
      return `${baseUrl}/vi/${props.firstVideoId}/mq3.jpg`
    default:
      return `${baseUrl}/vi/${props.firstVideoId}/mqdefault.jpg`
  }
})

const isUserPlaylist = computed(() => props.infoSource === 'user')
const videoPlaylistType = computed(() => isUserPlaylist.value ? 'user' : '')

/** @type {import('vue').ComputedRef<boolean>} */
const userPlaylistAnyVideoWatched = computed(() => {
  if (!isUserPlaylist.value) { return false }

  const historyCacheById_ = historyCacheById.value
  return selectedUserPlaylist.value.videos.some((video) => {
    return Object.hasOwn(historyCacheById_, video.videoId)
  })
})

/** @type {import('vue').ComputedRef<number>} */
const userPlaylistUniqueVideosCount = computed(() => {
  return selectedUserPlaylist.value?.videos.reduce((set, video) => {
    set.add(video.videoId)
    return set
  }, new Set()).size ?? 0
})

const userPlaylistDuplicateItemCount = computed(() => {
  if (userPlaylistUniqueVideosCount.value === 0) { return 0 }

  return selectedUserPlaylist.value.videos.length - userPlaylistUniqueVideosCount.value
})

const exportPlaylistButtonVisible = computed(() => {
  return isUserPlaylist.value && !editMode.value && props.videoCount > 0
})

const deletePlaylistButtonVisible = computed(() => {
  return isUserPlaylist.value && !editMode.value && !selectedUserPlaylist.value.protected
})

const sharePlaylistButtonVisible = computed(() => {
  return !isUserPlaylist.value && !hideSharingActions.value
})

/** @type {import('vue').ComputedRef<object | undefined>} */
const quickBookmarkPlaylist = computed(() => {
  return store.getters.getQuickBookmarkPlaylist
})

const markedAsQuickBookmarkTarget = computed(() => {
  return selectedUserPlaylist.value &&
    quickBookmarkPlaylist.value &&
    quickBookmarkPlaylist.value._id === selectedUserPlaylist.value._id
})

const playlistDeletionDisabledLabel = computed(() => {
  return t('User Playlists["Cannot delete the quick bookmark target playlist."]')
})

const inputPlaylistNameBlank = computed(() => newTitle.value.trim() === '')

const inputPlaylistWithNameExists = computed(() => {
  const playlistName = newTitle.value
  const selectedUserPlaylistId = selectedUserPlaylist.value._id

  return playlistName !== '' &&
    allPlaylists.value.some((playlist) => {
      return playlist._id !== selectedUserPlaylistId && playlist.playlistName === playlistName
    })
})

const playlistPersistenceDisabled = computed(() => {
  return inputPlaylistNameBlank.value || inputPlaylistWithNameExists.value
})

watch(showDeletePlaylistPrompt, handlePromptToggle)
watch(showRemoveVideosOnWatchPrompt, handlePromptToggle)
watch(showExportPrompt, handlePromptToggle)

/**
 * @param {boolean} shown
 */
function handlePromptToggle(shown) {
  if (shown) {
    emit('prompt-open')
  } else {
    emit('prompt-close')
  }
}

/**
 * @param {string} input
 */
function handlePlaylistNameInput(input) {
  if (input.trim() === '') {
    // Need to show message for blank input
    newTitle.value = input
    return
  }

  newTitle.value = input.trim()
}

function toggleCopyVideosPrompt(force = false) {
  if (props.moreVideoDataAvailable && !isUserPlaylist.value && !force) {
    showToast(t('User Playlists.SinglePlaylistView.Toast["Some videos in the playlist are not loaded yet. Click here to copy anyway."]'), 5000, () => {
      toggleCopyVideosPrompt(true)
    })
    return
  }

  store.dispatch('showAddToPlaylistPromptForManyVideos', {
    videos: props.videos,
    newPlaylistDefaultProperties: {
      title: props.channelName === '' ? props.title : `${props.title} | ${props.channelName}`,
    },
  })
}

async function savePlaylistInfo() {
  // Still possible to attempt to create via pressing enter
  if (playlistPersistenceDisabled.value) { return }

  const playlist = {
    playlistName: newTitle.value,
    protected: selectedUserPlaylist.value.protected,
    description: newDescription.value,
    videos: selectedUserPlaylist.value.videos,
    _id: props.id,
  }
  try {
    await store.dispatch('updatePlaylist', playlist)
    showToast(t('User Playlists.SinglePlaylistView.Toast["Playlist has been updated."]'))
  } catch (e) {
    showToast(t('User Playlists.SinglePlaylistView.Toast["There was an issue with updating this playlist."]'))
    console.error(e)
  } finally {
    exitEditMode()
  }
}

const playlistTitleInput = ref(null)

function enterEditMode() {
  newTitle.value = props.title
  newDescription.value = props.description
  editMode.value = true

  emit('enter-edit-mode')

  nextTick(() => {
    playlistTitleInput.value.focus()
  })
}

function handleQuickBookmarkEnabledDisabledClick() {
  showToast(t('User Playlists.SinglePlaylistView.Toast["This playlist is already being used for quick bookmark."]'))
}

function handlePlaylistDeleteDisabledClick() {
  showToast(playlistDeletionDisabledLabel.value)
}

const EXPORT_VALUES = [
  'database',
  'urls',
  'close'
]

const exportNames = computed(() => [
  `${t('Settings.Data Settings.Export FreeTube')} (.db)`,
  `${t('User Playlists.Export list of URLs')} (.txt)`,
  t('Close')
])

/**
 * @param {'database' | 'urls' | null} value
 */
function handleExport(value) {
  showExportPrompt.value = false

  if (value === 'database') {
    exportAsFreeTubeDatabase()
  } else if (value === 'urls') {
    exportAsListOfUrls()
  }
}

/**
 * @param {string} title
 * @param {string} extension
 */
function getExportFilename(title, extension) {
  const dateStr = getTodayDateStrLocalTimezone()
  const sanitisedTitle = title.replaceAll(/[ "%*/:<>?\\|]/g, '_')
  return `freetube-playlist-${sanitisedTitle}-${dateStr}.${extension}`
}

async function exportAsFreeTubeDatabase() {
  const exportFileName = getExportFilename(selectedUserPlaylist.value.playlistName, 'db')

  const data = JSON.stringify(selectedUserPlaylist.value) + '\n'

  // See DataSettings.vue `promptAndWriteToFile`

  try {
    const response = await writeFileWithPicker(
      exportFileName,
      data,
      t('Settings.Data Settings.Playlist File'),
      'application/x-freetube-db',
      '.db',
      'single-playlist-export',
      'downloads'
    )

    if (response) {
      showToast(t('User Playlists.The playlist has been successfully exported'))
    }
  } catch (error) {
    const message = t('Settings.Data Settings.Unable to write file')
    showToast(`${message}: ${error}`)
  }
}

async function exportAsListOfUrls() {
  const exportFileName = getExportFilename(props.title, 'txt')

  const data = props.sortedVideos.map((video) => {
    return `https://www.youtube.com/watch?v=${video.videoId}`
  }).join('\n') + '\n'

  // See DataSettings.vue `promptAndWriteToFile`

  try {
    const response = await writeFileWithPicker(
      exportFileName,
      data,
      '',
      'text/plain',
      '.txt',
      'single-playlist-export',
      'downloads'
    )

    if (response) {
      showToast(t('User Playlists.The playlist has been successfully exported'))
    }
  } catch (error) {
    const message = t('Settings.Data Settings.Unable to write file')
    showToast(`${message}: ${error}`)
  }
}

function exitEditMode() {
  editMode.value = false

  emit('exit-edit-mode')
}

const DELETE_PLAYLIST_PROMPT_VALUES = ['delete', 'cancel']

const deletePlaylistPromptNames = computed(() => [
  t('Yes, Delete'),
  t('Cancel')
])

/** @type {import('vue').ComputedRef<number>} */
const userPlaylistWatchedVideoCount = computed(() => {
  if (!isUserPlaylist.value || !userPlaylistAnyVideoWatched.value) { return false }

  const historyCacheById_ = historyCacheById.value
  return selectedUserPlaylist.value.videos.reduce((count, video) => {
    return Object.hasOwn(historyCacheById_, video.videoId) ? count + 1 : count
  }, 0)
})

const removeVideosOnWatchPromptLabelText = computed(() => {
  return t(
    'User Playlists.Are you sure you want to remove {playlistItemCount} watched videos from this playlist? This cannot be undone',
    { playlistItemCount: userPlaylistWatchedVideoCount.value },
    userPlaylistWatchedVideoCount.value
  )
})

const removeDuplicateVideosPromptLabelText = computed(() => {
  return t(
    'User Playlists.Are you sure you want to remove {playlistItemCount} duplicate videos from this playlist? This cannot be undone',
    { playlistItemCount: userPlaylistDuplicateItemCount.value },
    userPlaylistDuplicateItemCount.value
  )
})

/**
 * @param {'delete' | 'cancel' | null} option
 */
async function handleRemoveDuplicateVideosPromptAnswer(option) {
  showRemoveDuplicateVideosPrompt.value = false
  if (option !== 'delete') { return }

  const videoIdsAdded = new Set()
  const newVideoItems = selectedUserPlaylist.value.videos.reduce((ary, video) => {
    if (!videoIdsAdded.has(video.videoId)) {
      ary.push(video)
      videoIdsAdded.add(video.videoId)
    }

    return ary
  }, [])

  const removedVideosCount = userPlaylistDuplicateItemCount.value
  if (removedVideosCount === 0) {
    showToast(t('User Playlists.SinglePlaylistView.Toast["There were no videos to remove."]'))
    return
  }

  const playlist = {
    playlistName: props.title,
    protected: selectedUserPlaylist.value.protected,
    description: props.description,
    videos: newVideoItems,
    _id: props.id,
  }
  try {
    await store.dispatch('updatePlaylist', playlist)
    showToast(t('User Playlists.SinglePlaylistView.Toast.{videoCount} video(s) have been removed', {
      videoCount: removedVideosCount
    }, removedVideosCount))
  } catch (e) {
    showToast(t('User Playlists.SinglePlaylistView.Toast["There was an issue with updating this playlist."]'))
    console.error(e)
  }
}

/**
 * @param {'delete' | 'cancel' | null} option
 */
async function handleRemoveVideosOnWatchPromptAnswer(option) {
  showRemoveVideosOnWatchPrompt.value = false
  if (option !== 'delete') { return }

  const historyCacheById_ = historyCacheById.value
  const videosToWatch = selectedUserPlaylist.value.videos.filter((video) => {
    return !Object.hasOwn(historyCacheById_, video.videoId)
  })

  const removedVideosCount = selectedUserPlaylist.value.videos.length - videosToWatch.length

  if (removedVideosCount === 0) {
    showToast(t('User Playlists.SinglePlaylistView.Toast["There were no videos to remove."]'))
    return
  }

  const playlist = {
    playlistName: props.title,
    protected: selectedUserPlaylist.value.protected,
    description: props.description,
    videos: videosToWatch,
    _id: props.id
  }
  try {
    await store.dispatch('updatePlaylist', playlist)
    showToast(t('User Playlists.SinglePlaylistView.Toast.{videoCount} video(s) have been removed', {
      videoCount: removedVideosCount
    }, removedVideosCount))
  } catch (e) {
    showToast(t('User Playlists.SinglePlaylistView.Toast["There was an issue with updating this playlist."]'))
    console.error(e)
  }
}

const router = useRouter()

/**
 * @param {'delete' | 'cancel' | null} option
 */
function handleDeletePlaylistPromptAnswer(option) {
  showDeletePlaylistPrompt.value = false
  if (option !== 'delete') { return }

  if (selectedUserPlaylist.value.protected) {
    showToast(t('User Playlists.SinglePlaylistView.Toast["This playlist is protected and cannot be removed."]'))
  } else {
    store.dispatch('removePlaylist', props.id)
    router.push(
      {
        path: '/userPlaylists'
      }
    )
    showToast(t('User Playlists.SinglePlaylistView.Toast["Playlist {playlistName} has been deleted."]', {
      playlistName: props.title
    }))
  }
}

function enableQuickBookmarkForThisPlaylist() {
  const currentQuickBookmarkTargetPlaylist = quickBookmarkPlaylist.value

  store.dispatch('updateQuickBookmarkTargetPlaylistId', props.id)
  if (currentQuickBookmarkTargetPlaylist != null) {
    showToast(
      t('User Playlists.SinglePlaylistView.Toast["This playlist is now used for quick bookmark instead of {oldPlaylistName}. Click here to undo"]', {
        oldPlaylistName: currentQuickBookmarkTargetPlaylist.playlistName
      }),
      5000,
      () => {
        store.dispatch('updateQuickBookmarkTargetPlaylistId', currentQuickBookmarkTargetPlaylist._id)
        showToast(
          t('User Playlists.SinglePlaylistView.Toast["Reverted to use {oldPlaylistName} for quick bookmark"]', {
            oldPlaylistName: currentQuickBookmarkTargetPlaylist.playlistName
          }),
          5000,
        )
      },
    )
  } else {
    showToast(t('User Playlists.SinglePlaylistView.Toast.This playlist is now used for quick bookmark'))
  }
}

const updateQueryDebounced = debounce((newQuery) => {
  query.value = newQuery
  emit('search-video-query-change', newQuery)
}, 500)

const searchInput = ref(null)

/**
 * @param {KeyboardEvent} event
 */
function keyboardShortcutHandler(event) {
  ctrlFHandler(event, searchInput.value)
}

onMounted(() => {
  document.addEventListener('keydown', keyboardShortcutHandler)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', keyboardShortcutHandler)
})
</script>

<style scoped lang="scss" src="./PlaylistInfo.scss" />
