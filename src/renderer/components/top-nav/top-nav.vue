<template>
  <div
    class="topNav"
    :class="{ topNavBarColor: barColor }"
  >
    <div class="side">
      <font-awesome-icon
        class="menuIcon navIcon"
        icon="bars"
        @click="toggleSideNav"
      />
      <font-awesome-icon
        class="navBackIcon navIcon"
        icon="arrow-left"
        @click="historyBack"
      />
      <font-awesome-icon
        class="navForwardIcon navIcon"
        icon="arrow-right"
        @click="historyForward"
      />
      <font-awesome-icon
        class="navSearchIcon navIcon"
        icon="search"
        @click="toggleSearchContainer"
      />
      <font-awesome-icon
        class="navNewWindowIcon navIcon"
        icon="clone"
        @click="createNewWindow"
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
          @input="getSearchSuggestionsDebounce"
          @click="goToSearch"
        />
        <font-awesome-icon
          class="navFilterIcon navIcon"
          icon="filter"
          @click="showFilters = !showFilters"
        />
      </div>
      <ft-search-filters
        v-show="showFilters"
        class="searchFilters"
        :class="{ expand: !isSideNavOpen }"
      />
    </div>
    <ft-profile-selector class="side profiles" />
  </div>
</template>

<script src="./top-nav.js" />
<style scoped lang="sass" src="./top-nav.sass" />
