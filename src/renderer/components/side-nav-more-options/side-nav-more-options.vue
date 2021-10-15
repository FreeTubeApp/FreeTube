<template>
  <div class="sideNavMoreOptions">
    <div
      class="navOption moreOptionNav"
      tabindex="0"
      role="button"
      aria-labelledby="moreNavLabel"
      :title="$t('More')"
      @click="openMoreOptions = !openMoreOptions"
      @keydown.space.prevent="openMoreOptions = !openMoreOptions"
      @keydown.enter.prevent="openMoreOptions = !openMoreOptions"
    >
      <font-awesome-icon
        icon="ellipsis-h"
        class="navIcon"
        :class="applyNavIconExpand"
      />
      <p
        id="moreNavLabel"
        v-if="!hideLabelsSideBar"
        class="navLabel"
      >
        {{ $t("More") }}
      </p>
    </div>
    <div
      v-if="openMoreOptions"
      class="moreOptionContainer"
    >
      <div
        v-if="!hideTrendingVideos"
        class="navOption"
        role="link"
        tabindex="0"
        aria-labelledby="trendingNavLabel"
        :title="$t('Trending.Trending')"
        @click="navigate('trending')"
        @keydown.space.prevent="navigate('trending')"
        @keydown.enter.prevent="navigate('trending')"
      >
        <font-awesome-icon
          icon="fire"
          class="navIcon"
          :class="applyNavIconExpand"
        />
        <p
          id="trendingNavLabel"
          v-if="!hideLabelsSideBar"
          class="navLabel"
        >
          {{ $t("Trending.Trending") }}
        </p>
      </div>
      <div
        v-if="!hidePopularVideos"
        class="navOption"
        role="link"
        tabindex="0"
        aria-labelledby="usersNavLabel"
        :title="$t('Most Popular')"
        @click="navigate('popular')"
        @keydown.space.prevent="navigate('popular')"
        @keydown.enter.prevent="navigate('popular')"
      >
        <font-awesome-icon
          icon="users"
          class="navIcon"
          :class="applyNavIconExpand"
        />
        <p
          id="usersNavLabel"
          v-if="!hideLabelsSideBar"
          class="navLabel"
        >
          {{ $t("Most Popular") }}
        </p>
      </div>
      <div
        class="navOption"
        role="link"
        tabindex="0"
        aria-labelledby="aboutNavLabel"
        :title="$t('About.About')"
        @click="navigate('about')"
        @keydown.space.prevent="navigate('about')"
        @keydown.enter.prevent="navigate('about')"
      >
        <font-awesome-icon
          icon="info-circle"
          class="navIcon"
          :class="applyNavIconExpand"
        />
        <p
          id="aboutNavLabel"
          v-if="!hideLabelsSideBar"
          class="navLabel"
        >
          {{ $t("About.About") }}
        </p>
      </div>
    </div>
    <div
      class="navOption mobileShow"
      role="link"
      tabindex="0"
      aria-labelledby="historyNavLabel"
      @click="navigate('history')"
      @keydown.space.prevent="navigate('history')"
      @keydown.enter.prevent="navigate('history')"
    >
      <font-awesome-icon
        icon="history"
        class="navIcon"
        :class="applyNavIconExpand"
      />
      <p
        id="historyNavLabel"
        class="navLabel"
      >
        {{ $t("History.History") }}
      </p>
    </div>
    <hr>
    <div
      class="navOption mobileShow"
      role="link"
      tabindex="0"
      aria-labelledby="settingsNavLabel"
      @click="navigate('settings')"
      @keydown.space.prevent="navigate('settings')"
      @keydown.enter.prevent="navigate('settings')"
    >
      >
      <font-awesome-icon
        icon="sliders-h"
        class="navIcon"
        :class="applyNavIconExpand"
      />
      <p
        id="settingsNavLabel"
        class="navLabel"
      >
        {{ $t("Settings.Settings") }}
      </p>
    </div>
    <div
      class="navOption mobileHidden"
      tabindex="0"
      role="link"
      aria-labelledby="aboutNavLabel"
      @click="navigate('about')"
      @keydown.space.prevent="navigate('about')"
      @keydown.enter.prevent="navigate('about')"
    >
      <font-awesome-icon
        icon="info-circle"
        class="navIcon"
        :class="applyNavIconExpand"
      />
      <p
        v-if="!hideLabelsSideBar"
        class="navLabel"
      >
        {{ $t("About.About") }}
      </p>
    </div>
  </div>
</template>

<script src="./side-nav-more-options.js" />
<style scoped src="./side-nav-more-options.css" />
