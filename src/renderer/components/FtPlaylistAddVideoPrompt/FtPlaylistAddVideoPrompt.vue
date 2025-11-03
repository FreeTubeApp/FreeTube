<template>
  <FtPrompt
    theme="flex-column"
    :label="title"
    :inert="showingCreatePlaylistPrompt"
    @click="hide"
  >
    <p class="selected-count">
      {{ t('User Playlists.AddVideoPrompt.N playlists selected', {
        playlistCount: selectedPlaylistCount,
      }, selectedPlaylistCount) }}
    </p>
    <div
      v-if="allPlaylists.length > 1"
      class="searchInputsRow"
    >
      <FtInput
        ref="searchBar"
        :placeholder="t('User Playlists.AddVideoPrompt.Search in Playlists')"
        :show-clear-text-button="true"
        :show-action-button="false"
        :maxlength="255"
        @input="updateQueryDebounce"
        @clear="updateQueryDebounce('')"
      />
    </div>
    <div
      v-if="allPlaylists.length > 1"
      class="optionsRow"
    >
      <div
        class="tightOptions"
      >
        <FtToggleSwitch
          class="matchingVideoToggle"
          :label="t('User Playlists.Playlists with Matching Videos')"
          :compact="true"
          :default-value="doSearchPlaylistsWithMatchingVideos"
          @change="doSearchPlaylistsWithMatchingVideos = !doSearchPlaylistsWithMatchingVideos"
        />
        <FtToggleSwitch
          v-if="anyPlaylistContainsVideosToBeAdded"
          class="allowDuplicateToggle"
          :label="t('User Playlists.AddVideoPrompt.Allow Adding Duplicate Video(s)')"
          :compact="true"
          :default-value="addingDuplicateVideosEnabled"
          @change="addingDuplicateVideosEnabled = !addingDuplicateVideosEnabled"
        />
      </div>
      <FtSelect
        class="sortSelect"
        :value="sortBy"
        :select-names="sortBySelectNames"
        :select-values="SORT_BY_SELECT_VALUES"
        :placeholder="t('Global.Sort By')"
        :icon="sortBySelectIcon"
        @change="sortBy = $event"
      />
    </div>
    <div class="playlists-container">
      <FtFlexBox>
        <div
          v-for="playlist in activePlaylists"
          :key="playlist._id"
          class="playlist-selector-container"
          :class="{
            disabled: playlistDisabled(playlist._id),
          }"
          :aria-disabled="playlistDisabled(playlist._id)"
        >
          <FtPlaylistSelector
            :tabindex="playlistDisabled(playlist._id) ? -1 : 0"
            :playlist="playlist"
            :selected="selectedPlaylistIdList.includes(playlist._id)"
            :disabled="playlistDisabled(playlist._id)"
            :adding-duplicate-videos-enabled="addingDuplicateVideosEnabled"
            @selected="countSelected"
          />
        </div>
      </FtFlexBox>
    </div>
    <div class="actions-container">
      <FtFlexBox>
        <FtButton
          :label="t('User Playlists.Create New Playlist')"
          @click="openCreatePlaylistPrompt"
        />
        <FtButton
          :label="t('User Playlists.AddVideoPrompt.Save')"
          @click="addSelectedToPlaylists"
        />
        <FtButton
          :label="t('User Playlists.Cancel')"
          :text-color="null"
          :background-color="null"
          @click="hide"
        />
      </FtFlexBox>
    </div>
  </FtPrompt>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'

import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtPrompt from '../FtPrompt/FtPrompt.vue'
import FtButton from '../FtButton/FtButton.vue'
import FtPlaylistSelector from '../FtPlaylistSelector/FtPlaylistSelector.vue'
import FtInput from '../ft-input/ft-input.vue'
import FtSelect from '../FtSelect/FtSelect.vue'
import FtToggleSwitch from '../FtToggleSwitch/FtToggleSwitch.vue'

import store from '../../store/index'

import {
  debounce,
  showToast,
  ctrlFHandler,
  getIconForSortPreference
} from '../../helpers/utils'

const { locale, t } = useI18n()

const SORT_BY_VALUES = {
  NameAscending: 'name_ascending',
  NameDescending: 'name_descending',

  LatestCreatedFirst: 'latest_created_first',
  EarliestCreatedFirst: 'earliest_created_first',

  LatestUpdatedFirst: 'latest_updated_first',
  EarliestUpdatedFirst: 'earliest_updated_first',
}

const SORT_BY_SELECT_VALUES = Object.values(SORT_BY_VALUES)

const sortBySelectNames = computed(() => {
  return SORT_BY_SELECT_VALUES.map((k) => {
    switch (k) {
      case SORT_BY_VALUES.NameAscending:
        return t('User Playlists.Sort By.NameAscending')
      case SORT_BY_VALUES.NameDescending:
        return t('User Playlists.Sort By.NameDescending')
      case SORT_BY_VALUES.LatestCreatedFirst:
        return t('User Playlists.Sort By.LatestCreatedFirst')
      case SORT_BY_VALUES.EarliestCreatedFirst:
        return t('User Playlists.Sort By.EarliestCreatedFirst')
      case SORT_BY_VALUES.LatestUpdatedFirst:
        return t('User Playlists.Sort By.LatestUpdatedFirst')
      case SORT_BY_VALUES.EarliestUpdatedFirst:
        return t('User Playlists.Sort By.EarliestUpdatedFirst')
      default:
        console.error(`Unknown sortBy: ${k}`)
        return k
    }
  })
})

/** @type {import('vue').Ref<'name_ascending' | 'name_descending' | 'latest_created_first' | 'earliest_created_first' | 'latest_updated_first' | 'earliest_updated_first'>} */
const sortBy = ref(SORT_BY_VALUES.LatestUpdatedFirst)

const sortBySelectIcon = computed(() => getIconForSortPreference(sortBy.value))

/** @type {Set<string>} */
const createdSincePromptShownPlaylistIdList = new Set()

/** @type {import('vue').Ref<string[]>} */
const selectedPlaylistIdList = ref([])
const query = ref('')
const doSearchPlaylistsWithMatchingVideos = ref(false)
const lastShownAt = Date.now()
const addingDuplicateVideosEnabled = ref(false)

const title = computed(() => {
  return t('User Playlists.AddVideoPrompt.Select a playlist to add your N videos to', {
    videoCount: toBeAddedToPlaylistVideoCount.value,
  }, toBeAddedToPlaylistVideoCount.value)
})

const selectedPlaylistCount = computed(() => selectedPlaylistIdList.value.length)

/** @type {import('vue').ComputedRef<{ videoId: string, [key: string]: any }[]>} */
const toBeAddedToPlaylistVideoList = computed(() => store.getters.getToBeAddedToPlaylistVideoList)

const toBeAddedToPlaylistVideoCount = computed(() => toBeAddedToPlaylistVideoList.value.length)

const toBeAddedToPlaylistVideoIdList = computed(() => {
  return toBeAddedToPlaylistVideoList.value.map((v) => v.videoId)
})

const cachedCollator = computed(() => new Intl.Collator([locale.value, 'en'], { sensitivity: 'base' }))

/** @type {import('vue').ComputedRef<object[]>} */
const allPlaylists = computed(() => {
  const collator = cachedCollator.value

  return store.getters.getAllPlaylists.toSorted((a, b) => {
    switch (sortBy.value) {
      case SORT_BY_VALUES.NameAscending:
        return collator.compare(a.playlistName, b.playlistName)
      case SORT_BY_VALUES.NameDescending:
        return collator.compare(b.playlistName, a.playlistName)
      case SORT_BY_VALUES.LatestCreatedFirst: {
        if (a.createdAt > b.createdAt) { return -1 }
        if (a.createdAt < b.createdAt) { return 1 }

        return collator.compare(a.playlistName, b.playlistName)
      }
      case SORT_BY_VALUES.EarliestCreatedFirst: {
        if (a.createdAt < b.createdAt) { return -1 }
        if (a.createdAt > b.createdAt) { return 1 }

        return collator.compare(a.playlistName, b.playlistName)
      }
      case SORT_BY_VALUES.LatestUpdatedFirst: {
        if (a.lastUpdatedAt > b.lastUpdatedAt) { return -1 }
        if (a.lastUpdatedAt < b.lastUpdatedAt) { return 1 }

        return collator.compare(a.playlistName, b.playlistName)
      }
      case SORT_BY_VALUES.EarliestUpdatedFirst: {
        if (a.lastUpdatedAt < b.lastUpdatedAt) { return -1 }
        if (a.lastUpdatedAt > b.lastUpdatedAt) { return 1 }

        return collator.compare(a.playlistName, b.playlistName)
      }
      default:
        console.error(`Unknown sortBy: ${sortBy.value}`)
        return 0
    }
  })
})

const allPlaylistsLength = computed(() => allPlaylists.value.length)

const processedQuery = computed(() => query.value.trim().toLowerCase())

const activePlaylists = computed(() => {
  const processedQuery_ = processedQuery.value

  // Very rare that a playlist name only has 1 char
  if (processedQuery_.length === 0) { return allPlaylists.value }

  return allPlaylists.value.filter((playlist) => {
    if (typeof playlist.playlistName !== 'string') {
      return false
    }

    if (
      doSearchPlaylistsWithMatchingVideos.value &&
      playlist.videos.some((v) => {
        return v.author?.toLowerCase().includes(processedQuery_) || v.title.toLowerCase().includes(processedQuery_)
      })
    ) {
      return true
    }

    return playlist.playlistName.toLowerCase().includes(processedQuery_)
  })
})

const playlistIdsContainingVideosToBeAdded = computed(() => {
  /** @type {Set<string>} */
  const ids = new Set()

  const toBeAddedToPlaylistVideoIdList_ = toBeAddedToPlaylistVideoIdList.value

  allPlaylists.value.forEach((playlist) => {
    const playlistVideoIdSet = playlist.videos.reduce((s, v) => s.add(v.videoId), new Set())

    if (toBeAddedToPlaylistVideoIdList_.every((vid) => playlistVideoIdSet.has(vid))) {
      ids.add(playlist._id)
    }
  })

  return ids
})

const anyPlaylistContainsVideosToBeAdded = computed(() => {
  return playlistIdsContainingVideosToBeAdded.value.size > 0
})

const searchBar = ref(null)

watch(allPlaylistsLength, (val, oldVal) => {
  const allPlaylistIds = new Set()

  // Add new playlists to selected
  allPlaylists.value.forEach((playlist) => {
    allPlaylistIds.add(playlist._id)

    if (
      // Old playlists don't have `createdAt`
      playlist.createdAt == null ||
      // Only playlists created after this prompt shown should be considered
      playlist.createdAt < lastShownAt ||
      // Only playlists not auto added to selected yet should be considered
      createdSincePromptShownPlaylistIdList.has(playlist._id)
    ) {
      return
    }

    // Add newly created playlists to selected ONCE
    createdSincePromptShownPlaylistIdList.add(playlist._id)
    selectedPlaylistIdList.value.push(playlist._id)
  })

  // Remove  deleted playlist from deleted
  selectedPlaylistIdList.value = selectedPlaylistIdList.value.filter(playlistId => {
    return allPlaylistIds.has(playlistId)
  })

  if (val > oldVal) {
    // Only move focus back to search input when a playlist was added,
    // to allow searching for and deselecting the new created playlist more easily.
    nextTick(() => {
      searchBar.value?.focus()
    })
  }
})

/** @type {import('vue').ComputedRef<boolean>} */
const showingCreatePlaylistPrompt = computed(() => store.getters.getShowCreatePlaylistPrompt)

watch(showingCreatePlaylistPrompt, (val) => {
  if (!val) {
    // Only care when CreatePlaylistPrompt hidden
    // Shift focus from button to prevent unwanted click event
    // due to enter key press in CreatePlaylistPrompt
    nextTick(() => {
      searchBar.value?.focus()
    })
  }
})

watch(addingDuplicateVideosEnabled, (val) => {
  if (!val) {
    // Only care when addingDuplicateVideosEnabled disabled
    // Remove disabled playlists
    selectedPlaylistIdList.value = selectedPlaylistIdList.value.filter(playlistId => {
      return !playlistIdsContainingVideosToBeAdded.value.has(playlistId)
    })
  }
})

function hide() {
  store.dispatch('hideAddToPlaylistPrompt')
}

/**
 * @param {string} playlistId
 */
function countSelected(playlistId) {
  const index = selectedPlaylistIdList.value.indexOf(playlistId)

  if (index !== -1) {
    selectedPlaylistIdList.value.splice(index, 1)
  } else {
    selectedPlaylistIdList.value.push(playlistId)
  }
}

function addSelectedToPlaylists() {
  const addedPlaylistIds = new Set()

  if (selectedPlaylistIdList.value.length === 0) {
    showToast(t('User Playlists.AddVideoPrompt.Toast["You haven\'t selected any playlist yet."]'))
    return
  }

  const allPlaylists_ = allPlaylists.value
  const toBeAddedToPlaylistVideoList_ = toBeAddedToPlaylistVideoList.value

  selectedPlaylistIdList.value.forEach((selectedPlaylistId) => {
    const playlist = allPlaylists_.find((list) => list._id === selectedPlaylistId)
    if (playlist == null) { return }

    let videosToBeAdded

    if (!addingDuplicateVideosEnabled.value) {
      const playlistVideoIds = playlist.videos.map((v) => v.videoId)
      videosToBeAdded = toBeAddedToPlaylistVideoList_.filter((v) => !playlistVideoIds.includes(v.videoId))
    } else {
      // Use slice() to avoid `do not mutate vuex store state outside mutation handlers`
      videosToBeAdded = toBeAddedToPlaylistVideoList_.slice()
    }

    store.dispatch('addVideos', {
      _id: playlist._id,
      videos: videosToBeAdded,
    })

    addedPlaylistIds.add(playlist._id)
  })

  let message
  if (addedPlaylistIds.size === 1) {
    message = t('User Playlists.AddVideoPrompt.Toast.{videoCount} video(s) added to 1 playlist', {
      videoCount: toBeAddedToPlaylistVideoCount.value,
    }, toBeAddedToPlaylistVideoCount.value)
  } else {
    message = t('User Playlists.AddVideoPrompt.Toast.{videoCount} video(s) added to {playlistCount} playlists', {
      videoCount: toBeAddedToPlaylistVideoCount.value,
      playlistCount: addedPlaylistIds.size,
    }, toBeAddedToPlaylistVideoCount.value)
  }

  showToast(message)
  hide()
}

/** @type {import('vue').ComputedRef<object>} */
const newPlaylistDefaultProperties = computed(() => store.getters.getNewPlaylistDefaultProperties)

function openCreatePlaylistPrompt() {
  store.dispatch('showCreatePlaylistPrompt', {
    title: newPlaylistDefaultProperties.value.title || '',
  })
}

const updateQueryDebounce = debounce(/** @param {string} query_ */(query_) => {
  query.value = query_
}, 500)

onMounted(() => {
  document.addEventListener('keydown', keyboardShortcutHandler)

  // User might want to search first if they have many playlists
  nextTick(() => {
    searchBar.value?.focus()
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', keyboardShortcutHandler)
})

/**
 * @param {KeyboardEvent} event
 */
function keyboardShortcutHandler(event) {
  ctrlFHandler(event, searchBar.value)
}

/**
 * @param {string} playlistId
 */
function playlistDisabled(playlistId) {
  if (addingDuplicateVideosEnabled.value) {
    return false
  }

  return playlistIdsContainingVideosToBeAdded.value.has(playlistId)
}
</script>

<style scoped src="./FtPlaylistAddVideoPrompt.css" />
