<template>
  <FtPrompt
    theme="slim"
    @click="hideSearchFilters"
  >
    <template #label="{ labelId }">
      <h2
        :id="labelId"
        class="center"
      >
        {{ title }}
      </h2>
    </template>

    <FtFlexBox class="radioFlexBox">
      <FtRadioButton
        v-model="sortByValue"
        :title="$t('Global.Sort By')"
        :labels="sortByLabels"
        :values="SORT_BY_VALUES"
        class="searchRadio"
      />
      <FtRadioButton
        v-model="timeValue"
        :title="$t('Search Filters.Time.Time')"
        :labels="timeLabels"
        :values="TIME_VALUES"
        class="searchRadio"
      />
      <FtRadioButton
        v-model="typeValue"
        :title="$t('Search Filters.Type.Type')"
        :labels="typeLabels"
        :values="TYPE_VALUES"
        class="searchRadio"
      />
      <FtRadioButton
        v-model="durationValue"
        :title="$t('Search Filters.Duration.Duration')"
        :labels="durationLabels"
        :values="DURATION_VALUES"
        class="searchRadio"
      />
      <FtCheckboxList
        v-model="featuresValue"
        :title="$t('Search Filters.Features.Features')"
        :labels="featureLabels"
        :values="FEATURE_VALUES"
        class="searchRadio"
      />
    </FtFlexBox>
    <div class="searchFilterCloseButtonContainer">
      <FtButton
        :label="$t('Search Filters.Clear Filters')"
        background-color="var(--accent-color)"
        text-color="var(--text-with-accent-color)"
        @click="clearFilters"
      />
      <FtButton
        :label="$t('Close')"
        background-color="null"
        text-color="null"
        @click="hideSearchFilters"
      />
    </div>
  </FtPrompt>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from '../../composables/use-i18n-polyfill'

import FtFlexBox from '../ft-flex-box/ft-flex-box.vue'
import FtRadioButton from '../FtRadioButton/FtRadioButton.vue'
import FtPrompt from '../FtPrompt/FtPrompt.vue'
import FtButton from '../FtButton/FtButton.vue'
import FtCheckboxList from '../FtCheckboxList/FtCheckboxList.vue'

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

const searchSettings = store.getters.getSearchSettings

/** @type {import('vue').Ref<'relevance' | 'rating' | 'upload_date' | 'view_count'>} */
const sortByValue = ref(searchSettings.sortBy)

watch(sortByValue, (value) => {
  store.commit('setSearchSortBy', value)
})

/** @type {import('vue').Ref<'' | 'hour' | 'today' | 'week' | 'month' | 'year'>} */
const timeValue = ref(searchSettings.time)

watch(timeValue, (value) => {
  if (timeValue.value !== '' && !isVideoOrMovieOrAll(typeValue.value)) {
    typeValue.value = 'all'
  }

  store.commit('setSearchTime', value)
})

/** @type {import('vue').Ref<'all' | 'video' | 'channel' | 'playlist' | 'movie'>} */
const typeValue = ref(searchSettings.type)

watch(typeValue, (value) => {
  if (value === 'channel' || value === 'playlist') {
    timeValue.value = ''
    durationValue.value = ''
    sortByValue.value = SORT_BY_VALUES[0]
    if (featuresValue.value.length > 0) {
      featuresValue.value = []
    }
  } else if (value === 'movie') {
    if (featuresValue.value.length > 0) {
      featuresValue.value = featuresValue.value.filter(e => !NOT_ALLOWED_FOR_MOVIES_FEATURES.includes(e))
    }
  }

  store.commit('setSearchType', value)
})

/** @type {import('vue').Ref<'' | 'short' | 'medium' | 'long'>} */
const durationValue = ref(searchSettings.duration)

watch(durationValue, (value) => {
  if (value !== '' && !isVideoOrMovieOrAll(typeValue.value)) {
    typeValue.value = 'all'
  }

  store.commit('setSearchDuration', value)
})

/** @type {import('vue').Ref<('hd' | 'subtitles' | 'creative_commons' | '3d' | 'live' | '4k' | '360' | 'location' | 'hdr' | 'vr180')[]>} */
const featuresValue = ref([...searchSettings.features])

watch(featuresValue, (values) => {
  if (values.length > 0 && (!isVideoOrMovieOrAll(typeValue.value) || NOT_ALLOWED_FOR_MOVIES_FEATURES.some(item => values.includes(item)))) {
    typeValue.value = 'all'
  }

  store.commit('setSearchFeatures', [...values])
}, { deep: true })

const searchFilterValueChanged = computed(() => {
  return sortByValue.value !== SORT_BY_VALUES[0] ||
    timeValue.value !== TIME_VALUES[0] ||
    typeValue.value !== TYPE_VALUES[0] ||
    durationValue.value !== DURATION_VALUES[0] ||
    featuresValue.value.length > 0
})

watch(searchFilterValueChanged, (value) => {
  store.commit('setSearchFilterValueChanged', value)
})

function hideSearchFilters() {
  store.dispatch('hideSearchFilters')
}

/**
 * @param {'all' | 'video' | 'channel' | 'playlist' | 'movie'} type
 */
function isVideoOrMovieOrAll(type) {
  return type === 'video' || type === 'movie' || type === 'all'
}

function clearFilters() {
  sortByValue.value = SORT_BY_VALUES[0]
  timeValue.value = TIME_VALUES[0]
  typeValue.value = TYPE_VALUES[0]
  durationValue.value = DURATION_VALUES[0]
  featuresValue.value = []
}

</script>

<style scoped src="./FtSearchFilters.css" />
