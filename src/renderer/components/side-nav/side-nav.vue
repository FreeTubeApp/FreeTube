<template>
  <ft-flex-box
    ref="sideNav"
    class="sideNav"
    :class="{closed: !isOpen}"
  >
    <div class="inner">
      <div
        class="navOption topNavOption mobileShow"
        :aria-label="$t('Subscriptions.Subscriptions')"
        role="link"
        tabindex="0"
        @click="navigate('subscriptions')"
        @keydown="navigate('subscriptions', $event)"
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
        :aria-label="$t('Trending')"
        class="navOption mobileHidden"
        role="link"
        tabindex="0"
        @click="navigate('trending')"
        @keydown="navigate('trending', $event)"
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
        :aria-label="$t('Most Popular')"
        role="link"
        tabindex="0"
        @click="navigate('popular')"
        @keydown="navigate('popular', $event)"
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
        :aria-label="$t('Playlists')"
        class="navOption mobileShow"
        role="link"
        tabindex="0"
        @click="navigate('userplaylists')"
        @keydown="navigate('userplaylists', $event)"
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
        :aria-label="$t('History.History')"
        role="link"
        tabindex="0"
        @click="navigate('history')"
        @keydown="navigate('history', $event)"
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
        :aria-label="$t('Settings.Settings')"
        @click="navigate('settings')"
        @keydown="navigate('settings', $event)"
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
        :aria-label="$t('About.About')"
        @click="navigate('about')"
        @keydown="navigate('about', $event)"
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
          :aria-label="channel.name"
          role="link"
          tabindex="0"
          @click="goToChannel(channel.id)"
          @keydown="goToChannel(channel.id, $event)"
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
