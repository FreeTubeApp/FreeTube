<template>
  <div>
    <FtCard
      class="card"
    >
      <div class="heading">
        <h2 class="headingText">
          <FontAwesomeIcon
            :icon="['fas', 'bookmark']"
            class="headingIcon"
            fixed-width
          />
          {{ $t("User Playlists.Your Playlists") }}
        </h2>
        <FtIconButton
          :title="$t('User Playlists.Create New Playlist')"
          :icon="['fas', 'plus']"
          theme="secondary"
          class="newPlaylistButton"
          @click="createNewPlaylist"
        />
        <div
          v-if="fullData.length > 1"
          class="searchInputsRow"
        >
          <FtInput
            ref="searchBar"
            :placeholder="$t('User Playlists.Search bar placeholder')"
            :value="query"
            :show-clear-text-button="true"
            :show-action-button="false"
            :maxlength="255"
            @input="handleQueryChange"
            @clear="() => handleQueryChange('')"
          />
        </div>
        <div
          class="optionsRow"
        >
          <FtToggleSwitch
            v-if="fullData.length > 1"
            :label="$t('User Playlists.Playlists with Matching Videos')"
            :compact="true"
            :default-value="doSearchPlaylistsWithMatchingVideos"
            @change="doSearchPlaylistsWithMatchingVideos = !doSearchPlaylistsWithMatchingVideos"
          />
          <FtSelect
            v-if="fullData.length > 1"
            class="sortSelect"
            :value="sortBy"
            :select-names="sortByNames"
            :select-values="SORT_BY_VALUES"
            :placeholder="$t('Global.Sort By')"
            :icon="sortByIcon"
            @change="updateUserPlaylistsSortBy"
          />
        </div>
      </div>
      <FtFlexBox
        v-if="fullData.length === 0"
      >
        <p class="message">
          {{ $t("User Playlists['You have no playlists. Click on the create new playlist button to create a new one.']") }}
        </p>
      </FtFlexBox>
      <FtFlexBox
        v-else-if="activeData.length === 0 && fullData.length > 0"
      >
        <p class="message">
          {{ $t("User Playlists['Empty Search Message']") }}
        </p>
      </FtFlexBox>
      <FtElementList
        v-else-if="activeData.length > 0"
        :data="activeData"
        data-type="playlist"
        :search-query-text="doSearchPlaylistsWithMatchingVideos ? lowerCaseQuery : ''"
        :use-channels-hidden-preference="false"
        :hide-forbidden-titles="false"
      />
      <FtAutoLoadNextPageWrapper
        v-if="showLoadMoreButton"
        @load-next-page="increaseLimit"
      >
        <FtFlexBox>
          <FtButton
            label="Load More"
            background-color="var(--primary-color)"
            text-color="var(--text-with-main-color)"
            @click="increaseLimit"
          />
        </FtFlexBox>
      </FtAutoLoadNextPageWrapper>
    </FtCard>
  </div>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'
import { isNavigationFailure, NavigationFailureType } from 'vue-router'
import { useRoute, useRouter } from 'vue-router/composables'

import FtAutoLoadNextPageWrapper from '../../components/FtAutoLoadNextPageWrapper.vue'
import FtButton from '../../components/FtButton/FtButton.vue'
import FtCard from '../../components/ft-card/ft-card.vue'
import FtElementList from '../../components/FtElementList/FtElementList.vue'
import FtFlexBox from '../../components/ft-flex-box/ft-flex-box.vue'
import FtIconButton from '../../components/ft-icon-button/ft-icon-button.vue'
import FtInput from '../../components/ft-input/ft-input.vue'
import FtSelect from '../../components/FtSelect/FtSelect.vue'
import FtToggleSwitch from '../../components/FtToggleSwitch/FtToggleSwitch.vue'

import store from '../../store/index'

import { ctrlFHandler, debounce, getIconForSortPreference } from '../../helpers/utils'

const { locale, t } = useI18n()

const sessionDataLimit = sessionStorage.getItem('UserPlaylists/dataLimit')

const dataLimit = ref(sessionDataLimit !== null ? parseInt(sessionDataLimit) : 100)
const searchDataLimit = ref(100)
const showLoadMoreButton = ref(false)
const query = ref('')
const doSearchPlaylistsWithMatchingVideos = ref(false)
const activeData = ref([])

const SORT_BY_OPTIONS = {
  NameAscending: 'name_ascending',
  NameDescending: 'name_descending',

  LatestCreatedFirst: 'latest_created_first',
  EarliestCreatedFirst: 'earliest_created_first',

  LatestUpdatedFirst: 'latest_updated_first',
  EarliestUpdatedFirst: 'earliest_updated_first',

  LatestPlayedFirst: 'latest_played_first',
  EarliestPlayedFirst: 'earliest_played_first',
}

const SORT_BY_VALUES = Object.values(SORT_BY_OPTIONS)

const sortByNames = computed(() => {
  return SORT_BY_VALUES.map((k) => {
    switch (k) {
      case SORT_BY_OPTIONS.NameAscending:
        return t('User Playlists.Sort By.NameAscending')
      case SORT_BY_OPTIONS.NameDescending:
        return t('User Playlists.Sort By.NameDescending')
      case SORT_BY_OPTIONS.LatestCreatedFirst:
        return t('User Playlists.Sort By.LatestCreatedFirst')
      case SORT_BY_OPTIONS.EarliestCreatedFirst:
        return t('User Playlists.Sort By.EarliestCreatedFirst')
      case SORT_BY_OPTIONS.LatestUpdatedFirst:
        return t('User Playlists.Sort By.LatestUpdatedFirst')
      case SORT_BY_OPTIONS.EarliestUpdatedFirst:
        return t('User Playlists.Sort By.EarliestUpdatedFirst')
      case SORT_BY_OPTIONS.LatestPlayedFirst:
        return t('User Playlists.Sort By.LatestPlayedFirst')
      case SORT_BY_OPTIONS.EarliestPlayedFirst:
        return t('User Playlists.Sort By.EarliestPlayedFirst')
      default:
        console.error(`Unknown sortBy: ${k}`)
        return k
    }
  })
})

/** @type {import('vue').ComputedRef<'name_ascending' | 'name_descending' | 'latest_created_first' | 'earliest_created_first' | 'latest_updated_first' | 'earliest_updated_first' | 'latest_played_first' | 'earliest_played_first'>} */
const sortBy = computed(() => store.getters.getUserPlaylistsSortBy)

const sortByIcon = computed(() => getIconForSortPreference(sortBy.value))

const cachedCollator = computed(() => new Intl.Collator([locale.value, 'en'], { sensitivity: 'base' }))

/** @type {import('vue').ComputedRef<any[]>} */
const allPlaylists = computed(() => {
  /** @type {any[]} */
  const playlists = store.getters.getAllPlaylists

  const sortBy_ = sortBy.value

  if (!SORT_BY_VALUES.includes(sortBy_)) {
    console.error(`Unknown sortBy: ${sortBy_}`)
    return playlists
  }

  const collator = cachedCollator.value

  return playlists.toSorted((a, b) => {
    switch (sortBy_) {
      case SORT_BY_OPTIONS.NameAscending:
        return collator.compare(a.playlistName, b.playlistName)
      case SORT_BY_OPTIONS.NameDescending:
        return collator.compare(b.playlistName, a.playlistName)
      case SORT_BY_OPTIONS.LatestCreatedFirst:
        if (a.createdAt > b.createdAt) { return -1 }
        if (a.createdAt < b.createdAt) { return 1 }

        return collator.compare(a.playlistName, b.playlistName)
      case SORT_BY_OPTIONS.EarliestCreatedFirst:
        if (a.createdAt < b.createdAt) { return -1 }
        if (a.createdAt > b.createdAt) { return 1 }

        return collator.compare(a.playlistName, b.playlistName)
      case SORT_BY_OPTIONS.LatestUpdatedFirst:
        if (a.lastUpdatedAt > b.lastUpdatedAt) { return -1 }
        if (a.lastUpdatedAt < b.lastUpdatedAt) { return 1 }

        return collator.compare(a.playlistName, b.playlistName)
      case SORT_BY_OPTIONS.EarliestUpdatedFirst:
        if (a.lastUpdatedAt < b.lastUpdatedAt) { return -1 }
        if (a.lastUpdatedAt > b.lastUpdatedAt) { return 1 }

        return collator.compare(a.playlistName, b.playlistName)
      case SORT_BY_OPTIONS.LatestPlayedFirst:
        if (a.lastPlayedAt == null && b.lastPlayedAt == null) {
          return collator.compare(a.playlistName, b.playlistName)
        }

        // Never played playlist = move to last
        if (a.lastPlayedAt == null) { return 1 }
        if (b.lastPlayedAt == null) { return -1 }
        if (a.lastPlayedAt > b.lastPlayedAt) { return -1 }
        if (a.lastPlayedAt < b.lastPlayedAt) { return 1 }

        return collator.compare(a.playlistName, b.playlistName)
      case SORT_BY_OPTIONS.EarliestPlayedFirst:
        // Never played playlist = first
        if (a.lastPlayedAt == null && b.lastPlayedAt == null) {
          return collator.compare(a.playlistName, b.playlistName)
        }

        // Never played playlist = move to first
        if (a.lastPlayedAt == null) { return -1 }
        if (b.lastPlayedAt == null) { return 1 }
        if (a.lastPlayedAt < b.lastPlayedAt) { return -1 }
        if (a.lastPlayedAt > b.lastPlayedAt) { return 1 }

        return collator.compare(a.playlistName, b.playlistName)
      default:
        // should never happen as we detect this before calling toSorted
        return 0
    }
  })
})

const fullData = computed(() => {
  return allPlaylists.value.length < dataLimit.value
    ? allPlaylists.value
    : allPlaylists.value.slice(0, dataLimit.value)
})

const lowerCaseQuery = computed(() => query.value.toLowerCase())

watch(lowerCaseQuery, () => {
  searchDataLimit.value = 100
  filterPlaylistAsync()
})

watch(doSearchPlaylistsWithMatchingVideos, () => {
  searchDataLimit.value = 100
  filterPlaylistAsync()
  saveStateInRouter()
})

watch(fullData, (value) => {
  activeData.value = value
  filterPlaylist()
}, { deep: true })

/**
 * @param {'name_ascending' | 'name_descending' | 'latest_created_first' | 'earliest_created_first' | 'latest_updated_first' | 'earliest_updated_first' | 'latest_played_first' | 'earliest_played_first'} value
 */
function updateUserPlaylistsSortBy(value) {
  store.dispatch('updateUserPlaylistsSortBy', value)
}

/**
 * @param {string} query_
 * @param {string} [limit]
 * @param {boolean} [doSearchPlaylistsWithMatchingVideos_]
 * @param {boolean} [filterNow=false]
 */
function handleQueryChange(query_, limit = undefined, doSearchPlaylistsWithMatchingVideos_ = undefined, filterNow = false) {
  query.value = query_

  let newLimit = 100

  if (limit !== undefined) {
    const parsedLimit = parseInt(limit)

    if (!isNaN(parsedLimit)) {
      newLimit = parsedLimit
    }
  }

  searchDataLimit.value = newLimit

  if (doSearchPlaylistsWithMatchingVideos_ !== undefined) {
    doSearchPlaylistsWithMatchingVideos.value = doSearchPlaylistsWithMatchingVideos_
  }

  saveStateInRouter()

  if (filterNow) {
    filterPlaylist()
  } else {
    filterPlaylistAsync()
  }
}

function increaseLimit() {
  if (query.value !== '') {
    searchDataLimit.value += 100
    saveStateInRouter()
    filterPlaylist()
  } else {
    dataLimit.value += 100
    sessionStorage.setItem('UserPlaylists/dataLimit', dataLimit.value.toFixed(0))
  }
}

function filterPlaylist() {
  const lowerCaseQuery_ = lowerCaseQuery.value

  if (lowerCaseQuery_ === '') {
    activeData.value = fullData.value
    showLoadMoreButton.value = allPlaylists.value.length > activeData.value.length
  } else {
    const findMatchingVideos = doSearchPlaylistsWithMatchingVideos.value

    const filteredPlaylists = allPlaylists.value.filter((playlist) => {
      if (typeof playlist.playlistName !== 'string') { return false }

      if (
        findMatchingVideos &&
        playlist.videos.some((v) => {
          return v.author?.toLowerCase().includes(lowerCaseQuery_) || v.title.toLowerCase().includes(lowerCaseQuery_)
        })
      ) {
        return true
      }

      return playlist.playlistName.toLowerCase().includes(lowerCaseQuery_)
    })

    const searchDataLimit_ = searchDataLimit.value

    showLoadMoreButton.value = filteredPlaylists.length > searchDataLimit_
    activeData.value = filteredPlaylists.length < searchDataLimit_ ? filteredPlaylists : filteredPlaylists.slice(0, searchDataLimit_)
  }
}

const filterPlaylistAsync = debounce(filterPlaylist, 500)

function createNewPlaylist() {
  store.dispatch('showCreatePlaylistPrompt', { title: '' })
}

const router = useRouter()

async function saveStateInRouter() {
  const query_ = query.value

  let location

  if (query_ === '') {
    location = { path: '/userplaylists' }
  } else {
    location = {
      path: '/userplaylists',
      query: {
        query: query_,
        searchDataLimit: searchDataLimit.value.toFixed(0)
      }
    }

    if (doSearchPlaylistsWithMatchingVideos.value) {
      location.query.doSearchPlaylistsWithMatchingVideos = 'true'
    }
  }

  try {
    await router.replace(location)
  } catch (failure) {
    if (isNavigationFailure(failure, NavigationFailureType.duplicated)) {
      return
    }

    throw failure
  }
}

const route = useRoute()

const oldQuery = route.query.query
if (oldQuery != null && oldQuery !== '') {
  handleQueryChange(
    oldQuery,
    route.query.searchDataLimit,
    route.query.doSearchPlaylistsWithMatchingVideos === 'true',
    true
  )
} else {
  // Only display unfiltered data when no query used last time
  filterPlaylist()
}

const searchBar = ref(null)

/**
 * @param {KeyboardEvent} event
 */
function keyboardShortcutHandler(event) {
  ctrlFHandler(event, searchBar.value)
}

onMounted(() => {
  document.addEventListener('keydown', keyboardShortcutHandler)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', keyboardShortcutHandler)
})
</script>

<style scoped src="./UserPlaylists.css" />
