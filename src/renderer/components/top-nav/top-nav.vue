<template>
  <div class="topNav">
    <font-awesome-icon
      class="menuIcon"
      icon="bars"
      @click="toggleSideNav"
    />
    <font-awesome-icon
      class="navBackIcon"
      icon="arrow-left"
      @click="historyBack"
    />
    <font-awesome-icon
      class="navForwardIcon"
      icon="arrow-right"
      @click="historyForward"
    />
    <div class="logoIcon" />
    <div class="logoText" />
    <div class="searchContainer">
      <ft-input
        placeholder="Search / Go to URL"
        class="search"
        @click="goToSearch"
      />
      <font-awesome-icon
        class="navFilterIcon"
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
</template>

<script src="./top-nav.js" />
<style scoped src="./top-nav.css" />
