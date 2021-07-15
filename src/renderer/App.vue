<template>
  <div
    id="app"
    :class="{
      hideOutlines: hideOutlines,
      rightAligned: isRightAligned
    }"
  >
    <top-nav ref="topNav" />
    <side-nav ref="sideNav" />
    <ft-flex-box
      v-if="showUpdatesBanner || showBlogBanner"
      class="flexBox routerView"
      :class="{ expand: !isOpen }"
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
    </ft-flex-box>
    <transition
      v-if="dataReady"
      mode="out-in"
      name="fade"
    >
      <!-- <keep-alive> -->
      <RouterView
        ref="router"
        class="routerView"
        :class="{ expand: !isOpen }"
      />
      <!-- </keep-alive> -->
    </transition>
    <ft-prompt
      v-if="showReleaseNotes"
      :label="changeLogTitle"
      @click="showReleaseNotes = !showReleaseNotes"
    >
      <span v-html="updateChangelog" />
      <ft-flex-box>
        <ft-button
          :label="$t('Download From Site')"
          @click="openDownloadsPage"
        />
        <ft-button
          :label="$t('Close')"
          @click="showReleaseNotes = !showReleaseNotes"
        />
      </ft-flex-box>
    </ft-prompt>
    <ft-toast />
    <ft-progress-bar
      v-if="showProgressBar"
    />
  </div>
</template>

<script src="./App.js" />

<style src="./themes.css" />
<style src="./videoJS.css" />
<style scoped src="./App.css" />
