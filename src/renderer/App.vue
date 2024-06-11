<template>
  <div
    v-if="dataReady"
    id="app"
    class="app"
    :class="{
      hideOutlines: outlinesHidden,
      isLocaleRightToLeft: isLocaleRightToLeft,
      isSideNavOpen: isSideNavOpen,
      hideLabelsSideBar: hideLabelsSideBar && !isSideNavOpen
    }"
  >
    <portal-target
      name="promptPortal"
      @change="handlePromptPortalUpdate"
    />
    <ft-prompt
      v-if="showReleaseNotes"
      :label="changeLogTitle"
      theme="readable-width"
      @click="showReleaseNotes = !showReleaseNotes"
    >
      <span
        class="changeLogText"
        v-html="updateChangelog"
      />
      <ft-flex-box>
        <ft-button
          :label="$t('Download From Site')"
          @click="openDownloadsPage"
        />
        <ft-button
          :label="$t('Close')"
          :text-color="null"
          :background-color="null"
          @click="showReleaseNotes = !showReleaseNotes"
        />
      </ft-flex-box>
    </ft-prompt>
    <ft-prompt
      v-if="showExternalLinkOpeningPrompt"
      :label="$t('Are you sure you want to open this link?')"
      :extra-labels="[lastExternalLinkToBeOpened]"
      :option-names="externalLinkOpeningPromptNames"
      :option-values="externalLinkOpeningPromptValues"
      @click="handleExternalLinkOpeningPromptAnswer"
    />
    <ft-search-filters
      v-if="showSearchFilters"
    />
    <ft-playlist-add-video-prompt
      v-if="showAddToPlaylistPrompt"
    />
    <ft-create-playlist-prompt
      v-if="showCreatePlaylistPrompt"
    />
    <page-bookmark-prompt
      v-if="showPageBookmarkPrompt"
    />
    <ft-toast />
    <ft-progress-bar
      v-if="showProgressBar"
    />
    <top-nav
      ref="topNav"
      :inert="isPromptOpen"
      :page-bookmarks-available="pageBookmarksAvailable"
    />
    <side-nav
      ref="sideNav"
      :inert="isPromptOpen"
    />
    <ft-flex-box
      class="flexBox routerView"
      role="main"
      :inert="isPromptOpen"
    >
      <div
        v-if="showUpdatesBanner || showBlogBanner"
        class="banner-wrapper"
      >
        <ft-notification-banner
          v-if="showUpdatesBanner"
          class="banner"
          :message="updateBannerMessage"
          role="link"
          @click="handleUpdateBannerClick"
        />
        <ft-notification-banner
          v-if="showBlogBanner"
          class="banner"
          :message="blogBannerMessage"
          role="link"
          @click="handleNewBlogBannerClick"
        />
      </div>
      <transition
        v-if="dataReady"
        mode="out-in"
        name="fade"
      >
        <!-- <keep-alive> -->
        <RouterView
          ref="router"
          class="routerView"
        />
        <!-- </keep-alive> -->
      </transition>
    </ft-flex-box>
  </div>
</template>

<script src="./App.js" />

<style src="./themes.css" />
<style src="./videoJS.css" />
<style scoped src="./App.css" />
