<template>
  <div>
    <div class="searchFilterInner">
      <h2 class="center">
        {{ $t("Search Filters.Search Filters") }}
      </h2>
      <ft-flex-box class="radioFlexBox">
        <ft-radio-button
          ref="sortByRadio"
          :title="$t('Search Filters.Sort By.Sort By')"
          :labels="sortByLabels"
          :values="sortByValues"
          :selected="searchSettings.sortBy"
          class="searchRadio"
          @change="updateSortBy"
        />
        <ft-radio-button
          ref="timeRadio"
          :title="$t('Search Filters.Time.Time')"
          :labels="timeLabels"
          :values="timeValues"
          :selected="searchSettings.time"
          class="searchRadio"
          @change="updateTime"
        />
        <ft-radio-button
          ref="typeRadio"
          :title="$t('Search Filters.Type.Type')"
          :labels="typeLabels"
          :values="typeValues"
          :selected="searchSettings.type"
          class="searchRadio"
          @change="updateType"
        />
        <ft-radio-button
          ref="durationRadio"
          :title="$t('Search Filters.Duration.Duration')"
          :labels="durationLabels"
          :values="durationValues"
          :selected="searchSettings.duration"
          class="searchRadio"
          @change="updateDuration"
        />
      </ft-flex-box>
    </div>
  </div>
</template>

<script src="./ft-search-filters.js" />
<style scoped src="./ft-search-filters.css" />
