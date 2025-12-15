<template>
  <FtPrompt
    theme="slim"
    @click="hideSearchFilters"
  >
    <template #label="{ labelId }">
      <div class="titleContainer">
        <h2
          :id="labelId"
          class="center"
        >
          {{ title }}
        </h2>
        <button
          class="clearFilterButton"
          :title="$t('Search filters.Clear filters')"
          :style="{visibility: (searchFilterValueChanged ? 'visible' : 'hidden')}"
          @click="clearFilters"
        >
          <FontAwesomeIcon
            class="clearFilterIcon"
            :icon="['fas', 'filter-circle-xmark']"
          />
        </button>
      </div>
    </template>

    <FtFlexBox class="radioFlexBox">
      <FtRadioButton
        v-model="sortByValue"
        :title="$t('Global.Sort by')"
        :labels="sortByLabels"
        :values="SORT_BY_VALUES"
        class="searchRadio"
      />
      <FtRadioButton
        v-model="timeValue"
        :title="$t('Search filters.Time.Time')"
        :labels="timeLabels"
        :values="TIME_VALUES"
        class="searchRadio"
      />
      <FtRadioButton
        v-model="typeValue"
        :title="$t('Search filters.Type.Type')"
        :labels="typeLabels"
        :values="TYPE_VALUES"
        class="searchRadio"
      />
      <FtRadioButton
        v-model="durationValue"
        :title="$t('Search filters.Duration.Duration')"
        :labels="durationLabels"
        :values="DURATION_VALUES"
        class="searchRadio"
      />
      <FtCheckboxList
        v-model="featuresValue"
        :title="$t('Search filters.Features.Features')"
        :labels="featureLabels"
        :values="FEATURE_VALUES"
        class="searchRadio"
      />
    </FtFlexBox>
    <div class="searchFilterCloseButtonContainer">
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

const title = computed(() => t('Search filters.Search filters'))

const sortByLabels = computed(() => [
  t('Search filters.Sort by.Most relevant'),
  t('Search filters.Sort by.Rating'),
  t('Search filters.Sort by.Upload date'),
  t('Search filters.Sort by.View count')
])

const timeLabels = computed(() => [
  t('Search filters.Time.Any time'),
  t('Search filters.Time.Last hour'),
  t('Search filters.Time.Today'),
  t('Search filters.Time.This week'),
  t('Search filters.Time.This month'),
  t('Search filters.Time.This year')
])

const typeLabels = computed(() => [
  t('Search filters.Type.All types'),
  t('Search filters.Type.Videos'),
  t('Search filters.Type.Channels'),
  t('Playlists'),
  t('Search filters.Type.Movies')
])

const durationLabels = computed(() => [
  t('Search filters.Duration.All durations'),
  t('Search filters.Duration.Short (< 4 minutes)'),
  t('Search filters.Duration.Medium (4 - 20 minutes)'),
  t('Search filters.Duration.Long (> 20 minutes)')
])

const featureLabels = computed(() => [
  t('Search filters.Features.HD'),
  t('Search filters.Features.Subtitles'),
  t('Search filters.Features.Creative Commons'),
  t('Search filters.Features.3D'),
  t('Search filters.Features.Live'),
  t('Search filters.Features.4K'),
  t('Search filters.Features.360 video'),
  t('Search filters.Features.Location'),
  t('Search filters.Features.HDR'),
  t('Search filters.Features.VR180')
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
