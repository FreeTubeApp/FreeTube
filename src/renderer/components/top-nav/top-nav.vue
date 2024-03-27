<template>
  <div
    class="topNav"
    :class="{ topNavBarColor: barColor }"
    role="navigation"
  >
    <div class="side">
      <div
        role="button"
        tabindex="0"
        @click.prevent="toggleSideNav"
        @keydown.enter.prevent="toggleSideNav"
      >
        <font-awesome-icon
          style="padding-top: 0;padding-bottom: 0;"
          class="menuIcon navIcon"
          :icon="['fas', 'bars']"
        />
      </div>
      <div
        role="button"
        tabindex="0"
        :aria-disabled="isArrowBackwardDisabled || null"
        @click.prevent="historyBack"
        @keydown.enter.prevent="historyBack"
      >
        <font-awesome-icon
          class="navIcon"
          :class="{ arrowBackwardDisabled: isArrowBackwardDisabled}"
          :icon="['fas', 'arrow-left']"
          :title="backwardText"
        />
      </div>
      <div
        role="button"
        tabindex="0"
        :aria-disabled="isArrowForwardDisabled || null"
        @click.prevent="historyForward"
        @keydown.enter.prevent="historyForward"
      >
        <font-awesome-icon
          class="navIcon"
          :class="{ arrowForwardDisabled: isArrowForwardDisabled}"
          :icon="['fas', 'arrow-right']"
          :title="forwardText"
        />
      </div>
      <div
        v-if="!hideSearchBar"
        role="button"
        tabindex="0"
        @click.prevent="toggleSearchContainer"
        @keydown.enter.prevent="toggleSearchContainer"
      >
        <font-awesome-icon
          class="navSearchIcon navIcon"
          :icon="['fas', 'search']"
        />
      </div>
      <div
        v-if="usingElectron"
        role="button"
        tabindex="0"
        @click.prevent="createNewWindow"
        @keydown.enter.prevent="createNewWindow"
      >
        <font-awesome-icon
          class="navNewWindowIcon navIcon"
          :icon="['fas', 'clone']"
          :title="newWindowText"
        />
      </div>
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
        <div
          role="button"
          tabindex="0"
          @click="showFilters = !showFilters"
          @keydown.enter.prevent="showFilters = !showFilters"
        >
          <font-awesome-icon
            class="navFilterIcon navIcon"
            :class="{ filterChanged: searchFilterValueChanged }"
            :icon="['fas', 'filter']"
          />
        </div>
      </div>
      <ft-search-filters
        v-if="!hideSearchBar"
        v-show="showFilters"
        class="searchFilters"
        @filter-value-updated="handleSearchFilterValueChanged"
      />
    </div>
    <ft-profile-selector class="side profiles" />
  </div>
</template>

<script src="./top-nav.js" />
<style scoped lang="scss" src="./top-nav.scss" />
