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
        @click="toggleSideNav"
        @keypress="toggleSideNav"
      />
      <font-awesome-icon
        id="historyArrowBack"
        class="navBackIcon navIcon fa-arrow-left"
        icon="arrow-left"
        role="button"
        tabindex="0"
        :title="forwardText"
        @click="historyBack"
        @keypress="historyBack"
      />
      <font-awesome-icon
        id="historyArrowForward"
        class="navForwardIcon navIcon fa-arrow-right"
        icon="arrow-right"
        role="button"
        tabindex="0"
        :title="forwardText"
        @click="historyForward"
        @keypress="historyForward"
      />
      <font-awesome-icon
        class="navSearchIcon navIcon"
        icon="search"
        role="button"
        tabindex="0"
        @click="toggleSearchContainer"
        @keypress="toggleSearchContainer"
      />
      <font-awesome-icon
        class="navNewWindowIcon navIcon"
        icon="clone"
        :title="newWindowText"
        @click="createNewWindow"
      />
      <div
        class="logo"
        role="link"
        tabindex="0"
        :title="$t('Subscriptions.Subscriptions')"
        @click="navigate('subscriptions')"
        @keydown.space.prevent="navigate('subscriptions')"
        @keydown.enter.prevent="navigate('subscriptions')"
      >
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
          :show-clear-text-button="true"
          @input="getSearchSuggestionsDebounce"
          @click="goToSearch"
        />
        <font-awesome-icon
          class="navFilterIcon navIcon"
          :class="{ filterChanged: searchFilterValueChanged }"
          icon="filter"
          role="button"
          tabindex="0"
          @click="showFilters = !showFilters"
          @keypress="showFilters = !showFilters"
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
