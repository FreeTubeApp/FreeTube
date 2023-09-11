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
      <font-awesome-icon
        :aria-disabled="isArrowBackwardDisabled"
        class="navIcon"
        :class="{ navIconDisabled: isArrowBackwardDisabled}"
        :icon="['fas', 'arrow-left']"
        role="button"
        tabindex="0"
        :title="backwardText"
        @click="historyBack"
        @keydown.enter.prevent="historyBack"
      />
      <font-awesome-icon
        :aria-disabled="isArrowForwardDisabled"
        class="navIcon"
        :class="{ navIconDisabled: isArrowForwardDisabled}"
        :icon="['fas', 'arrow-right']"
        role="button"
        tabindex="0"
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
      <font-awesome-icon
        class="navIcon"
        :icon="['fas', 'square-check']"
        :title="selectVideosText"
        role="button"
        tabindex="0"
        @click="toggleSelectMode"
        @keydown.enter.prevent="tselectVideosTextoggleSelectMode"
      />
      <ft-icon-button
        v-if="isSelectModeEnabled"
        class="selectModeOptionsButton"
        :class="{ navIconDisabled: selectModeSelections.count === 0 }"
        :icon="['fas', 'ellipsis-v']"
        title="More Options"
        theme="base-no-default"
        role="button"
        :use-shadow="false"
        dropdown-position-x="right"
        :dropdown-options="dropdownOptions"
        tabindex="0"
        @click="handleOptionsClick"
      />
      <div
        v-if="!hideHeaderLogo"
        class="logo"
        dir="ltr"
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
          role="button"
          tabindex="0"
          @click="showFilters = !showFilters"
          @keydown.enter.prevent="showFilters = !showFilters"
        />
      </div>
      <ft-search-filters
        v-if="!hideSearchBar"
        v-show="showFilters"
        class="searchFilters"
        @filterValueUpdated="handleSearchFilterValueChanged"
      />
    </div>
    <ft-profile-selector class="side profiles" />
  </div>
</template>

<script src="./top-nav.js" />
<style scoped lang="scss" src="./top-nav.scss" />
