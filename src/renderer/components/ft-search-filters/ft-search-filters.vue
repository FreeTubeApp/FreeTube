<template>
  <ft-prompt
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
      <ft-flex-box class="radioFlexBox">
        <ft-radio-button
          ref="sortByRadio"
          :title="$t('Search Filters.Sort By.Sort By')"
          :labels="sortByLabels"
          :values="sortByValues"
          :initial-value-index="searchSortByStartIndex"
          class="searchRadio"
          @change="updateSortBy"
        />
        <ft-radio-button
          ref="timeRadio"
          :title="$t('Search Filters.Time.Time')"
          :labels="timeLabels"
          :values="timeValues"
          :initial-value-index="searchTimeStartIndex"
          class="searchRadio"
          @change="updateTime"
        />
        <ft-radio-button
          ref="typeRadio"
          :title="$t('Search Filters.Type.Type')"
          :labels="typeLabels"
          :values="typeValues"
          :initial-value-index="searchTypeStartIndex"
          class="searchRadio"
          @change="updateType"
        />
        <ft-radio-button
          ref="durationRadio"
          :title="$t('Search Filters.Duration.Duration')"
          :labels="durationLabels"
          :values="durationValues"
          :initial-value-index="searchDurationStartIndex"
          class="searchRadio"
          @change="updateDuration"
        />
        <ft-checkbox-list
          ref="featuresCheck"
          :title="$t('Search Filters.Features.Features')"
          :labels="featureLabels"
          :values="featureValues"
          :initial-values="searchDefaultFeatures"
          class="searchRadio"
          @change="updateFeatures"
        />
      </ft-flex-box>
      <div class="searchFilterCloseButtonContainer">
        <ft-button
          :label="$t('Close')"
          background-color="var(--primary-color)"
          text-color="var(--text-with-main-color)"
          @click="hideSearchFilters"
        />
      </div>
    </div>
  </ft-prompt>
</template>

<script src="./ft-search-filters.js" />
<style scoped src="./ft-search-filters.css" />
