<template>
  <FtPrompt
    theme="slim"
    :label="title"
    @click="hideSearchFilters"
  >
    <div>
      <h2
        class="center"
        name="title"
      >
        {{ title }}
      </h2>
      <FtFlexBox class="radioFlexBox">
        <FtRadioButton
          ref="sortByRadio"
          :title="$t('Search Filters.Sort By.Sort By')"
          :labels="sortByLabels"
          :values="SORT_BY_VALUES"
          :initial-value-index="searchSortByStartIndex"
          class="searchRadio"
          @change="updateSortBy"
        />
        <FtRadioButton
          ref="timeRadio"
          :title="$t('Search Filters.Time.Time')"
          :labels="timeLabels"
          :values="TIME_VALUES"
          :initial-value-index="searchTimeStartIndex"
          class="searchRadio"
          @change="updateTime"
        />
        <FtRadioButton
          ref="typeRadio"
          :title="$t('Search Filters.Type.Type')"
          :labels="typeLabels"
          :values="TYPE_VALUES"
          :initial-value-index="searchTypeStartIndex"
          class="searchRadio"
          @change="updateType"
        />
        <FtRadioButton
          ref="durationRadio"
          :title="$t('Search Filters.Duration.Duration')"
          :labels="durationLabels"
          :values="DURATION_VALUES"
          :initial-value-index="searchDurationStartIndex"
          class="searchRadio"
          @change="updateDuration"
        />
        <FtCheckboxList
          ref="featuresCheck"
          :title="$t('Search Filters.Features.Features')"
          :labels="featureLabels"
          :values="FEATURE_VALUES"
          :initial-values="searchDefaultFeatures"
          class="searchRadio"
          @change="updateFeatures"
        />
      </FtFlexBox>
      <div class="searchFilterCloseButtonContainer">
        <FtButton
          :label="$t('Close')"
          background-color="var(--primary-color)"
          text-color="var(--text-with-main-color)"
          @click="hideSearchFilters"
        />
      </div>
    </div>
  </FtPrompt>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'

import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtRadioButton from '../ft-radio-button/ft-radio-button.vue'
import FtPrompt from '../ft-prompt/ft-prompt.vue'
import FtButton from '../ft-button/ft-button.vue'
import FtCheckboxList from '../ft-checkbox-list/ft-checkbox-list.vue'

import store from '../../store/index'

const { t } = useI18n()

const SORT_BY_VALUES = [
  'relevance',
  'rating',
  'upload_date',
  'view_count'
]

const TIME_VALUES = [
  '',
  'hour',
  'today',
  'week',
  'month',
  'year'
]

const TYPE_VALUES = [
  'all',
  'video',
  'channel',
  'playlist',
  'movie'
]

const DURATION_VALUES = [
  '',
  'short',
  'medium',
  'long'
]

const FEATURE_VALUES = [
  'hd',
  'subtitles',
  'creative_commons',
  '3d',
  'live',
  '4k',
  '360',
  'location',
  'hdr',
  'vr180'
]

const NOT_ALLOWED_FOR_MOVIES_FEATURES = [
  'live',
  'subtitles',
  '3d',
  'creative_commons'
]

const title = computed(() => t('Search Filters.Search Filters'))

const sortByLabels = computed(() => [
  t('Search Filters.Sort By.Most Relevant'),
  t('Search Filters.Sort By.Rating'),
  t('Search Filters.Sort By.Upload Date'),
  t('Search Filters.Sort By.View Count')
])

const timeLabels = computed(() => [
  t('Search Filters.Time.Any Time'),
  t('Search Filters.Time.Last Hour'),
  t('Search Filters.Time.Today'),
  t('Search Filters.Time.This Week'),
  t('Search Filters.Time.This Month'),
  t('Search Filters.Time.This Year')
])

const typeLabels = computed(() => [
  t('Search Filters.Type.All Types'),
  t('Search Filters.Type.Videos'),
  t('Search Filters.Type.Channels'),
  t('Playlists'),
  t('Search Filters.Type.Movies')
])

const durationLabels = computed(() => [
  t('Search Filters.Duration.All Durations'),
  t('Search Filters.Duration.Short (< 4 minutes)'),
  t('Search Filters.Duration.Medium (4 - 20 minutes)'),
  t('Search Filters.Duration.Long (> 20 minutes)')
])

const featureLabels = computed(() => [
  t('Search Filters.Features.HD'),
  t('Search Filters.Features.Subtitles'),
  t('Search Filters.Features.Creative Commons'),
  t('Search Filters.Features.3D'),
  t('Search Filters.Features.Live'),
  t('Search Filters.Features.4K'),
  t('Search Filters.Features.360 Video'),
  t('Search Filters.Features.Location'),
  t('Search Filters.Features.HDR'),
  t('Search Filters.Features.VR180')
])

const sortByRadio = ref(null)
const timeRadio = ref(null)
const typeRadio = ref(null)
const durationRadio = ref(null)
const featuresCheck = ref(null)

const searchFilterValueChanged = computed(() => {
  if (sortByRadio.value == null || timeRadio.value == null || typeRadio.value == null || durationRadio.value == null || featuresCheck.value == null) {
    return false
  }

  return sortByRadio.value.selectedValue !== SORT_BY_VALUES[0] ||
    timeRadio.value.selectedValue !== TIME_VALUES[0] ||
    typeRadio.value.selectedValue !== TYPE_VALUES[0] ||
    durationRadio.value.selectedValue !== DURATION_VALUES[0] ||
    featuresCheck.value.selectedValues.length > 0
})

const searchSettings = computed(() => store.getters.getSearchSettings)

const searchSortByStartIndex = SORT_BY_VALUES.indexOf(searchSettings.value.sortBy)
const searchTimeStartIndex = TIME_VALUES.indexOf(searchSettings.value.time)
const searchTypeStartIndex = TYPE_VALUES.indexOf(searchSettings.value.type)
const searchDurationStartIndex = DURATION_VALUES.indexOf(searchSettings.value.duration)
const searchDefaultFeatures = [...searchSettings.value.features]

function hideSearchFilters() {
  store.dispatch('hideSearchFilters')
}

/**
 * @param {'all' | 'video' | 'channel' | 'playlist' | 'movie'} type
 */
function isVideoOrMovieOrAll(type) {
  return type === 'video' | type === 'movie' || type === 'all'
}

/**
 * @param {'relevance' | 'rating' | 'upload_date' | 'view_count'} value
 */
function updateSortBy(value) {
  store.commit('setSearchSortBy', value)
  store.commit('setSearchFilterValueChanged', searchFilterValueChanged.value)
}

/**
 * @param {'' | 'hour' | 'today' | 'week' | 'month' | 'year'} value
 */
function updateTime(value) {
  if (!isVideoOrMovieOrAll(searchSettings.value.type)) {
    typeRadio.value.updateSelectedValue('all')
    store.commit('setSearchType', 'all')
  }

  store.commit('setSearchTime', value)
  store.commit('setSearchFilterValueChanged', searchFilterValueChanged.value)
}

/**
 * @param {('hd' | 'subtitles' | 'creative_commons' | '3d' | 'live' | '4k' | '360' | 'location' | 'hdr' | 'vr180')[]} values
 */
function updateFeatures(values) {
  if (!isVideoOrMovieOrAll(searchSettings.value.type) || NOT_ALLOWED_FOR_MOVIES_FEATURES.some(item => values.includes(item))) {
    typeRadio.value.updateSelectedValue('all')
    store.commit('setSearchType', 'all')
  }

  store.commit('setSearchFeatures', values)
  store.commit('setSearchFilterValueChanged', searchFilterValueChanged.value)
}

/**
 * @param {'all' | 'video' | 'channel' | 'playlist' | 'movie'} value
 */
function updateType(value) {
  if (value === 'channel' || value === 'playlist') {
    timeRadio.value.updateSelectedValue('')
    durationRadio.value.updateSelectedValue('')
    sortByRadio.value.updateSelectedValue(SORT_BY_VALUES[0])
    featuresCheck.value.setSelectedValues([])

    store.commit('setSearchTime', '')
    store.commit('setSearchDuration', '')
    store.commit('setSearchFeatures', [])
    store.commit('setSearchSortBy', SORT_BY_VALUES[0])
  } else if (value === 'movie') {
    const filteredFeatures = searchSettings.value.features.filter(e => !NOT_ALLOWED_FOR_MOVIES_FEATURES.includes(e))

    featuresCheck.value.setSelectedValues([...filteredFeatures])
    store.commit('setSearchFeatures', filteredFeatures)
  }

  store.commit('setSearchType', value)
  store.commit('setSearchFilterValueChanged', searchFilterValueChanged.value)
}

/**
 * @param {'' | 'short' | 'medium' | 'long'} value
 */
function updateDuration(value) {
  if (value !== '' && !isVideoOrMovieOrAll(searchSettings.value.type)) {
    typeRadio.value.updateSelectedValue('all')
    updateType('all')
  }

  store.commit('setSearchDuration', value)
  store.commit('setSearchFilterValueChanged', searchFilterValueChanged.value)
}
</script>

<style scoped src="./FtSearchFilters.css" />
