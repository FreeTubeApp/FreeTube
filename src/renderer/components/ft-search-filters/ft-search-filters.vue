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
          class="searchRadio"
          @change="updateSortBy"
        />
        <ft-radio-button
          ref="timeRadio"
          :title="$t('Search Filters.Time.Time')"
          :labels="timeLabels"
          :values="timeValues"
          class="searchRadio"
          @change="updateTime"
        />
        <ft-radio-button
          ref="typeRadio"
          :title="$t('Search Filters.Type.Type')"
          :labels="typeLabels"
          :values="typeValues"
          class="searchRadio"
          @change="updateType"
        />
        <ft-radio-button
          ref="durationRadio"
          :title="$t('Search Filters.Duration.Duration')"
          :labels="durationLabels"
          :values="durationValues"
          class="searchRadio"
          @change="updateDuration"
        />
      </ft-flex-box>
    </div>
  </div>
</template>

<script src="./ft-search-filters.js" />
<style scoped src="./ft-search-filters.css" />
