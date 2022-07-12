<template>
  <div
    v-if="dataReady"
    id="app"
    :class="{
      hideOutlines: hideOutlines,
      rightAligned: isRightAligned
    }"
  >
    <top-nav ref="topNav" />
    <side-nav ref="sideNav" />
    <ft-flex-box
      class="flexBox routerView"
    >
      <div
        v-if="showUpdatesBanner || showBlogBanner"
      >
        <ft-notification-banner
          v-if="showUpdatesBanner"
          class="banner"
          :message="updateBannerMessage"
          @click="handleUpdateBannerClick"
        />
        <ft-notification-banner
          v-if="showBlogBanner"
          class="banner"
          :message="blogBannerMessage"
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

    <ft-prompt
      v-if="showReleaseNotes"
      @click="showReleaseNotes = !showReleaseNotes"
    >
      <h2>
        {{ changeLogTitle }}
      </h2>
      <span
        id="changeLogText"
        v-html="updateChangelog"
      />
      <ft-flex-box>
        <ft-button
          :label="$t('Download From Site')"
          @click="openDownloadsPage"
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
