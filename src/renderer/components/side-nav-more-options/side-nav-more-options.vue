<template>
  <div class="sideNavMoreOptions">
    <div
      class="navOption moreOptionNav"
      :title="$t('More')"
      @click="openMoreOptions = !openMoreOptions"
    >
      <font-awesome-icon
        icon="ellipsis-h"
        class="navIcon"
        :class="applyNavIconExpand"
      />
      <p
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
        :title="$t('Trending.Trending')"

        @click="navigate('trending')"
      >
        <font-awesome-icon
          icon="fire"
          class="navIcon"
          :class="applyNavIconExpand"
        />
        <p
          v-if="!hideLabelsSideBar"
          class="navLabel"
        >
          {{ $t("Trending.Trending") }}
        </p>
      </div>
      <div
        v-if="!hidePopularVideos"
        class="navOption"
        :title="$t('Most Popular')"
        @click="navigate('popular')"
      >
        <font-awesome-icon
          icon="users"
          class="navIcon"
          :class="applyNavIconExpand"
        />
        <p
          v-if="!hideLabelsSideBar"
          class="navLabel"
        >
          {{ $t("Most Popular") }}
        </p>
      </div>
      <div
        class="navOption"
        :title="$t('About.About')"
        @click="navigate('about')"
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
    <div
      class="navOption mobileShow"
      @click="navigate('history')"
    >
      <font-awesome-icon
        icon="history"
        class="navIcon"
        :class="applyNavIconExpand"
      />
      <p class="navLabel">
        {{ $t("History.History") }}
      </p>
    </div>
    <hr>
    <div
      class="navOption mobileShow"
      @click="navigate('settings')"
    >
      <font-awesome-icon
        icon="sliders-h"
        class="navIcon"
        :class="applyNavIconExpand"
      />
      <p class="navLabel">
        {{ $t("Settings.Settings") }}
      </p>
    </div>
    <div
      class="navOption mobileHidden"
      @click="navigate('about')"
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
