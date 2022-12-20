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
      <router-link
        class="navOption topNavOption mobileShow "
        role="button"
        to="/subscriptions"
        :title="$t('Subscriptions.Subscriptions')"
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
      </router-link>
      <router-link
        class="navOption mobileHidden"
        role="button"
        to="/subscribedchannels"
        :title="$t('Channels.Channels')"
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
      </router-link>
      <router-link
        v-if="!hideTrendingVideos"
        class="navOption mobileHidden"
        role="button"
        to="/trending"
        :title="$t('Trending.Trending')"
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
      </router-link>
      <router-link
        v-if="!hidePopularVideos && (backendFallback || backendPreference === 'invidious')"
        class="navOption mobileHidden"
        role="button"
        to="/popular"
        :title="$t('Most Popular')"
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
      </router-link>
      <router-link
        v-if="!hidePlaylists"
        class="navOption mobileShow"
        role="button"
        to="/userplaylists"
        :title="$t('Playlists')"
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
      </router-link>
      <side-nav-more-options />
      <router-link
        class="navOption mobileShow"
        role="button"
        to="/history"
        :title="$t('History.History')"
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
      </router-link>
      <hr>
      <router-link
        class="navOption mobileShow"
        role="button"
        to="/settings"
        :title="$t('Settings.Settings')"
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
      </router-link>
      <router-link
        class="navOption mobileHidden"
        role="button"
        to="/about"
        :title="$t('About.About')"
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
      </router-link>
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
