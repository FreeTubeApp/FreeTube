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
      multiple
      @change="handlePromptPortalUpdate"
    />
    <ft-prompt
      v-if="showReleaseNotes"
      theme="readable-width"
      @click="showReleaseNotes = !showReleaseNotes"
    >
      <template #label="{ labelId }">
        <h1
          :id="labelId"
          class="changeLogTitle"
        >
          {{ changeLogTitle }}
        </h1>
      </template>
      <span
        class="changeLogText"
        lang="en"
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
    <ft-keyboard-shortcut-prompt
      v-if="isKeyboardShortcutPromptShown"
    />
    <ft-playlist-add-video-prompt
      v-if="showAddToPlaylistPrompt"
    />
    <ft-create-playlist-prompt
      v-if="showCreatePlaylistPrompt"
    />
    <ft-toast />
    <ft-progress-bar
      v-if="showProgressBar"
    />
    <top-nav
      :inert="isPromptOpen"
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
          class="routerView"
        />
        <!-- </keep-alive> -->
      </transition>
    </ft-flex-box>
  </div>
</template>

<script src="./App.js" />

<style src="./themes.css" />
<style scoped src="./App.css" />
