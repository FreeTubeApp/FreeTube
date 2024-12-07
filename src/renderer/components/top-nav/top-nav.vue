<template>
  <div
    class="topNav"
    :class="{ topNavBarColor: barColor }"
    role="navigation"
  >
    <div class="side">
      <font-awesome-icon
        class="menuIcon navIcon"
        :icon="['fas', 'bars']"
        role="button"
        tabindex="0"
        @click="toggleSideNav"
        @keydown.enter.prevent="toggleSideNav"
      />
      <ft-icon-button
        class="navIconButton"
        :disabled="isArrowBackwardDisabled"
        :class="{ arrowDisabled: isArrowBackwardDisabled }"
        :icon="['fas', 'arrow-left']"
        :theme="null"
        :size="20"
        :use-shadow="false"
        dropdown-position-x="right"
        :dropdown-options="navigationHistoryDropdownOptions"
        :open-on-right-or-long-click="true"
        :title="backwardText"
        @click="historyBack"
        @keydown.enter.prevent="historyBack"
      />
      <ft-icon-button
        class="navIconButton"
        :disabled="isArrowForwardDisabled"
        :class="{ arrowDisabled: isArrowForwardDisabled }"
        :icon="['fas', 'arrow-right']"
        :theme="null"
        :size="20"
        :use-shadow="false"
        dropdown-position-x="right"
        :dropdown-options="navigationHistoryDropdownOptions"
        :open-on-right-or-long-click="true"
        :title="forwardText"
        @click="historyForward"
        @keydown.enter.prevent="historyForward"
      />
      <font-awesome-icon
        v-if="!hideSearchBar"
        class="navSearchIcon navIcon"
        :icon="['fas', 'search']"
        role="button"
        tabindex="0"
        @click="toggleSearchContainer"
        @keydown.enter.prevent="toggleSearchContainer"
      />
      <font-awesome-icon
        class="navNewWindowIcon navIcon"
        :icon="['fas', 'clone']"
        :title="newWindowText"
        role="button"
        tabindex="0"
        @click="createNewWindow"
        @keydown.enter.prevent="createNewWindow"
      />
      <div
        v-if="!hideHeaderLogo"
        class="logo"
        dir="ltr"
        role="link"
        tabindex="0"
        :title="headerLogoTitle"
        @click="navigate(landingPage)"
        @keydown.space.prevent="navigate(landingPage)"
        @keydown.enter.prevent="navigate(landingPage)"
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
      <div
        v-if="!hideSearchBar"
        v-show="showSearchContainer"
        ref="searchContainer"
        class="searchContainer"
      >
        <ft-input
          ref="searchInput"
          :placeholder="$t('Search / Go to URL')"
          class="searchInput"
          :is-search="true"
          :data-list="searchSuggestionsDataList"
          :spellcheck="false"
          :show-clear-text-button="true"
          @input="getSearchSuggestionsDebounce"
          @click="goToSearch"
        />
        <font-awesome-icon
          class="navFilterIcon navIcon"
          :class="{ filterChanged: searchFilterValueChanged }"
          :icon="['fas', 'filter']"
          :title="$t('Search Filters.Search Filters')"
          role="button"
          tabindex="0"
          @click="showSearchFilters"
          @keydown.enter.prevent="showSearchFilters"
        />
      </div>
    </div>
    <ft-profile-selector class="side profiles" />
  </div>
</template>

<script src="./top-nav.js" />
<style scoped lang="scss" src="./top-nav.scss" />
