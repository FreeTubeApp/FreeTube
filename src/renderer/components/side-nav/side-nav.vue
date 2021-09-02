<template>
  <ft-flex-box
    ref="sideNav"
    class="sideNav"
    :class="{closed: !isOpen}"
  >
    <div class="inner">
      <div
        class="navOption topNavOption mobileShow"
        role="link"
        tabindex="0"
        @click="navigate('subscriptions')"
        @keydown.enter.prevent="navigate('subscriptions')"
        @keydown.space.prevent="navigate('subscriptions')"
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
        role="link"
        tabindex="0"
        @click="navigate('trending')"
        @keydown.enter.prevent="navigate('trending')"
        @keydown.space.prevent="navigate('trending')"
      >
        <font-awesome-icon
          icon="fire"
          class="navIcon"
          fixed-width
        />
        <p class="navLabel">
          {{ $t("Trending.Trending") }}
        </p>
      </div>
      <div
        v-if="!hidePopularVideos"
        class="navOption mobileHidden"
        role="link"
        tabindex="0"
        @click="navigate('popular')"
        @keydown.enter.prevent="navigate('popular')"
        @keydown.space.prevent="navigate('popular')"
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
        role="link"
        tabindex="0"
        @click="navigate('userplaylists')"
        @keydown.enter.prevent="navigate('userplaylists')"
        @keydown.space.prevent="navigate('userplaylists')"
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
        role="link"
        tabindex="0"
        @click="navigate('history')"
        @keydown.enter.prevent="navigate('history')"
        @keydown.space.prevent="navigate('history')"
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
        role="link"
        tabindex="0"
        @click="navigate('settings')"
        @keydown.enter.prevent="navigate('settings')"
        @keydown.space.prevent="navigate('settings')"
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
        role="link"
        tabindex="0"
        @click="navigate('about')"
        @keydown.enter.prevent="navigate('about')"
        @keydown.space.prevent="navigate('about')"
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
          role="link"
          tabindex="0"
          @click="$goToChannel(channel.id)"
          @keydown.enter.prevent="$goToChannel(channel.id)"
        >
          <div
            class="thumbnailContainer"
          >
            <img
              class="channelThumbnail"
              :src="channel.thumbnail"
              alt=""
            >
          </div>
          <p
            v-if="isOpen"
            id="navLabelChannel"
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
