<template>
  <div
    class="topNav"
    :class="{ topNavBarColor: barColor }"
  >
    <div class="side">
      <font-awesome-icon
        class="menuIcon navIcon"
        icon="bars"
        role="button"
        tabindex="0"
        :title="$t('Toggle Side Bar')"
        @click="toggleSideNav"
        @keydown="toggleSideNav($event)"
      />
      <font-awesome-icon
        class="navBackIcon navIcon"
        icon="arrow-left"
        role="button"
        tabindex="0"
        :title="backwardText"
        @click="historyBack"
        @keydown="historyBack($event)"
      />
      <font-awesome-icon
        class="navForwardIcon navIcon"
        icon="arrow-right"
        role="button"
        tabindex="0"
        :title="forwardText"
        @click="historyForward"
        @keydown="historyForward($event)"
      />
      <font-awesome-icon
        class="navSearchIcon navIcon"
        icon="search"
        role="button"
        tabindex="0"
        :title="$t('Search / Go to URL')"
        @click="toggleSearchContainer"
        @keydown="toggleSearchContainer($event)"
      />
      <font-awesome-icon
        class="navNewWindowIcon navIcon"
        icon="clone"
        role="link"
        tabindex="0"
        :title="newWindowText"
        @click="createNewWindow"
        @keydown="createNewWindow($event)"
      />
      <div class="logo">
        <div
          class="logoIcon"
        />
        <div
          class="logoText"
        />
      </div>
    </div>
    <div class="middle">
      <div class="searchContainer">
        <ft-input
          :placeholder="$t('Search / Go to URL')"
          class="searchInput"
          :is-search="true"
          :select-on-focus="true"
          :data-list="searchSuggestionsDataList"
          :spellcheck="false"
          @input="getSearchSuggestionsDebounce"
          @click="goToSearch"
        />
        <font-awesome-icon
          class="navFilterIcon navIcon"
          :class="{ filterChanged: searchFilterValueChanged }"
          icon="filter"
          role="button"
          tabindex="0"
          :title="$t('Search Filters.Show Search Filters')"
          @click="showFilters = !showFilters"
          @keydown="showFilters =
            ($event.key !== 'Enter' && $event.key !== ' ')
              ? showFilters : !showFilters"
        />
      </div>
      <ft-search-filters
        v-show="showFilters"
        class="searchFilters"
        :class="{ expand: !isSideNavOpen }"
        @filterValueUpdated="handleSearchFilterValueChanged"
      />
    </div>
    <ft-profile-selector class="side profiles" />
  </div>
</template>

<script src="./top-nav.js" />
<style scoped lang="sass" src="./top-nav.sass" />
