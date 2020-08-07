<template>
  <div class="searchFilter">
    <h2 class="center">
      {{ $t("Search Filters.Search Filters") }}
    </h2>
    <ft-flex-box class="radioFlexBox">
      <ft-radio-button
        :title="$t('Search Filters.Sort By.Sort By')"
        :labels="sortByLabels"
        :values="sortByValues"
        class="searchRadio"
        @change="updateSortBy"
      />
      <ft-radio-button
        :title="$t('Search Filters.Time.Time')"
        :labels="timeLabels"
        :values="timeValues"
        class="searchRadio radioMargin"
        @change="updateTime"
      />
      <ft-radio-button
        :title="$t('Search Filters.Type.Type')"
        :labels="typeLabels"
        :values="typeValues"
        class="searchRadio radioMargin"
        @change="updateType"
      />
      <ft-radio-button
        :title="$t('Search Filters.Duration.Duration')"
        :labels="durationLabels"
        :values="durationValues"
        class="radioMargin"
        @change="updateDuration"
      />
    </ft-flex-box>
  </div>
</template>

<script src="./ft-search-filters.js" />
<style scoped src="./ft-search-filters.css" />
