<template>
  <ft-flex-box
    ref="sideNav"
    class="sideNav"
    :class="[{closed: !isOpen}, applyHiddenLabels]"
  >
    <div
      class="inner"
      :class="applyHiddenLabels"
    >
      <div
        class="navOption topNavOption mobileShow "
        role="button"
        tabindex="0"
        :title="$t('Subscriptions.Subscriptions')"
        @click="navigate('subscriptions')"
      >
        <div
          class="thumbnailContainer"
        >
          <font-awesome-icon
            :icon="['fas', 'rss']"
            class="navIcon"
            :class="applyNavIconExpand"
            fixed-width
          />
        </div>
        <p
          v-if="!hideText"
          class="navLabel"
        >
          {{ $t("Subscriptions.Subscriptions") }}
        </p>
      </div>
      <div
        class="navOption mobileHidden"
        role="button"
        tabindex="0"
        :title="$t('Channels.Channels')"
        @click="navigate('subscribedchannels')"
        @keydown.enter.prevent="navigate('subscribedchannels')"
      >
        <div
          class="thumbnailContainer"
        >
          <font-awesome-icon
            :icon="['fas', 'list']"
            class="navIcon"
            :class="applyNavIconExpand"
            fixed-width
          />
        </div>
        <p
          v-if="!hideText"
          class="navLabel"
        >
          {{ $t("Channels.Channels") }}
        </p>
      </div>
      <div
        v-if="!hideTrendingVideos"
        class="navOption mobileHidden"
        role="button"
        tabindex="0"
        :title="$t('Trending.Trending')"
        @click="navigate('trending')"
        @keydown.enter.prevent="navigate('trending')"
      >
        <div
          class="thumbnailContainer"
        >
          <font-awesome-icon
            :icon="['fas', 'fire']"
            class="navIcon"
            :class="applyNavIconExpand"
            fixed-width
          />
        </div>
        <p
          v-if="!hideText"
          class="navLabel"
        >
          {{ $t("Trending.Trending") }}
        </p>
      </div>
      <div
        v-if="!hidePopularVideos && (backendFallback || backendPreference === 'invidious')"
        class="navOption mobileHidden"
        role="button"
        tabindex="0"
        :title="$t('Most Popular')"
        @click="navigate('popular')"
        @keydown.enter.prevent="navigate('popular')"
      >
        <div
          class="thumbnailContainer"
        >
          <font-awesome-icon
            :icon="['fas', 'users']"
            class="navIcon"
            :class="applyNavIconExpand"
            fixed-width
          />
        </div>
        <p
          v-if="!hideText"
          class="navLabel"
        >
          {{ $t("Most Popular") }}
        </p>
      </div>
      <div
        v-if="!hidePlaylists"
        class="navOption mobileShow"
        role="button"
        tabindex="0"
        :title="$t('Playlists')"
        @click="navigate('userplaylists')"
        @keydown.enter.prevent="navigate('userplaylists')"
      >
        <div
          class="thumbnailContainer"
        >
          <font-awesome-icon
            :icon="['fas', 'bookmark']"
            class="navIcon"
            :class="applyNavIconExpand"
            fixed-width
          />
        </div>
        <p
          v-if="!hideText"
          class="navLabel"
        >
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
        :title="$t('History.History')"
        @click="navigate('history')"
        @keydown.enter.prevent="navigate('history')"
      >
        <div
          class="thumbnailContainer"
        >
          <font-awesome-icon
            :icon="['fas', 'history']"
            class="navIcon"
            :class="applyNavIconExpand"
            fixed-width
          />
        </div>
        <p
          v-if="!hideText"
          class="navLabel"
        >
          {{ $t("History.History") }}
        </p>
      </div>
      <hr>
      <div
        class="navOption mobileShow"
        role="button"
        tabindex="0"
        :title="$t('Settings.Settings')"
        @click="navigate('settings')"
        @keydown.enter.prevent="navigate('settings')"
      >
        <div
          class="thumbnailContainer"
        >
          <font-awesome-icon
            :icon="['fas', 'sliders-h']"
            class="navIcon"
            :class="applyNavIconExpand"
            fixed-width
          />
        </div>
        <p
          v-if="!hideText"
          class="navLabel"
        >
          {{ $t('Settings.Settings') }}
        </p>
      </div>
      <div
        class="navOption mobileHidden"
        role="button"
        tabindex="0"
        :title="$t('About.About')"
        @click="navigate('about')"
        @keydown.enter.prevent="navigate('about')"
      >
        <div
          class="thumbnailContainer"
        >
          <font-awesome-icon
            :icon="['fas', 'info-circle']"
            class="navIcon"
            :class="applyNavIconExpand"
            fixed-width
          />
        </div>
        <p
          v-if="!hideText"
          class="navLabel"
        >
          {{ $t("About.About") }}
        </p>
      </div>
      <hr>
      <div
        v-if="!hideActiveSubscriptions"
      >
        <router-link
          v-for="(channel, index) in activeSubscriptions"
          :key="index"
          :to="`/channel/${channel.id}`"
          class="navChannel channelLink mobileHidden"
          :title="channel.name"
          role="button"
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
        </router-link>
      </div>
    </div>
  </ft-flex-box>
</template>

<script src="./side-nav.js" />
<style scoped src="./side-nav.css" />
