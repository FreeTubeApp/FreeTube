<template>
  <ft-flex-box
    ref="sideNav"
    class="sideNav"
    :class="{closed: !isOpen}"
  >
    <div class="inner">
      <div
        class="navOption topNavOption mobileShow"
        role="button"
        tabindex="0"
        @click="navigate('subscriptions')"
      >
        <font-awesome-icon
          icon="rss"
          class="navIcon"
          fixed-width
        />
        <p class="navLabel">
          {{ $t("Subscriptions.Subscriptions") }}
        </p>
      </div>
      <div
        v-if="!hideTrendingVideos"
        class="navOption mobileHidden"
        role="button"
        tabindex="0"
        @click="navigate('trending')"
        @keypress="navigate('trending')"
      >
        <font-awesome-icon
          icon="fire"
          class="navIcon"
          fixed-width
        />
        <p class="navLabel">
          {{ $t("Trending") }}
        </p>
      </div>
      <div
        v-if="!hidePopularVideos"
        class="navOption mobileHidden"
        role="button"
        tabindex="0"
        @click="navigate('popular')"
        @keypress="navigate('popular')"
      >
        <font-awesome-icon
          icon="users"
          class="navIcon"
          fixed-width
        />
        <p class="navLabel">
          {{ $t("Most Popular") }}
        </p>
      </div>
      <div
        v-if="!hidePlaylists"
        class="navOption mobileShow"
        role="button"
        tabindex="0"
        @click="navigate('userplaylists')"
        @keypress="navigate('userplaylists')"
      >
        <font-awesome-icon
          icon="bookmark"
          class="navIcon"
          fixed-width
        />
        <p class="navLabel">
          {{ $t("Playlists") }}
        </p>
      </div>
      <side-nav-more-options
        @navigate="navigate"
      />
      <div
        class="navOption mobileShow"
        role="button"
        tabindex="0"
        @click="navigate('history')"
        @keypress="navigate('history')"
      >
        <font-awesome-icon
          icon="history"
          class="navIcon"
          fixed-width
        />
        <p class="navLabel">
          {{ $t("History.History") }}
        </p>
      </div>
      <hr>
      <div
        class="navOption mobileShow"
        role="button"
        tabindex="0"
        @click="navigate('settings')"
        @keypress="navigate('settings')"
      >
        <font-awesome-icon
          icon="sliders-h"
          class="navIcon"
          fixed-width
        />
        <p class="navLabel">
          {{ $t("Settings.Settings") }}
        </p>
      </div>
      <div
        class="navOption mobileHidden"
        role="button"
        tabindex="0"
        @click="navigate('about')"
        @keypress="navigate('about')"
      >
        <font-awesome-icon
          icon="info-circle"
          class="navIcon"
          fixed-width
        />
        <p class="navLabel">
          {{ $t("About.About") }}
        </p>
      </div>
      <hr>
      <div
        v-if="!hideActiveSubscriptions"
      >
        <div
          v-for="(channel, index) in activeSubscriptions"
          :key="index"
          class="navChannel mobileHidden"
          :title="channel.name"
          role="button"
          tabindex="0"
          @click="goToChannel(channel.id)"
          @keypress="goToChannel(channel.id)"
        >
          <div
            class="thumbnailContainer"
          >
            <img
              class="channelThumbnail"
              :src="channel.thumbnail"
            >
          </div>
          <p
            v-if="isOpen"
            class="navLabel"
          >
            {{ channel.name }}
          </p>
        </div>
      </div>
    </div>
  </ft-flex-box>
</template>

<script src="./side-nav.js" />
<style scoped src="./side-nav.css" />
