<template>
  <ft-flex-box
    ref="sideNav"
    class="sideNav"
    :class="{closed: !isOpen}"
  >
    <div class="inner">
      <div
        class="navOption topNavOption mobileShow"
        @click="navigate('subscriptions')"
      >
        <font-awesome-icon
          icon="rss"
          class="navIcon"
        />
        <p class="navLabel">
          {{ $t("Subscriptions.Subscriptions") }}
        </p>
      </div>
      <div
        class="navOption mobileHidden"
        @click="navigate('trending')"
      >
        <font-awesome-icon
          icon="fire"
          class="navIcon"
        />
        <p class="navLabel">
          {{ $t("Trending") }}
        </p>
      </div>
      <div
        class="navOption mobileHidden"
        @click="navigate('popular')"
      >
        <font-awesome-icon
          icon="users"
          class="navIcon"
        />
        <p class="navLabel">
          {{ $t("Most Popular") }}
        </p>
      </div>
      <div
        class="navOption mobileShow"
        @click="navigate('userplaylists')"
      >
        <font-awesome-icon
          icon="bookmark"
          class="navIcon"
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
        @click="navigate('history')"
      >
        <font-awesome-icon
          icon="history"
          class="navIcon"
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
        />
        <p class="navLabel">
          {{ $t("About.About") }}
        </p>
      </div>
      <hr>
      <div
        v-for="(channel, index) in activeSubscriptions"
        :key="index"
        class="navChannel mobileHidden"
        :title="channel.name"
        @click="goToChannel(channel.id)"
      >
        <div
          class="thumbnailContainer"
        >
          <img
            class="channelThumbnail"
            :src="channel.thumbnail"
          />
        </div>
        <p
          class="navLabel"
          v-if="isOpen"
        >
          {{ channel.name }}
        </p>
      </div>
    </div>
  </ft-flex-box>
</template>

<script src="./side-nav.js" />
<style scoped src="./side-nav.css" />
