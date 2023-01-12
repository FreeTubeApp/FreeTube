<template>
  <div class="sideNavMoreOptions">
    <div
      class="navOption moreOptionNav"
      tabindex="0"
      role="button"
      aria-labelledby="moreNavLabel"
      :title="$t('More')"
      @click="openMoreOptions = !openMoreOptions"
      @keydown.space.prevent="openMoreOptions = !openMoreOptions"
      @keydown.enter.prevent="openMoreOptions = !openMoreOptions"
    >
      <font-awesome-icon
        :icon="['fas', 'ellipsis-h']"
        class="navIcon"
        :class="applyNavIconExpand"
      />
      <p
        v-if="!hideLabelsSideBar"
        id="moreNavLabel"
        class="navLabel"
      >
        {{ $t("More") }}
      </p>
    </div>
    <div
      v-if="openMoreOptions"
      class="moreOptionContainer"
    >
      <router-link
        class="navOption mobileHidden"
        :title="$t('Channels.Channels')"
        :aria-label="hideLabelsSideBar ? $t('Channels.Channels') : null"
        to="/subscribedchannels"
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
          id="channelLabel"
          class="navLabel"
        >
          {{ $t("Channels.Channels") }}
        </p>
      </router-link>
      <router-link
        v-if="!hideTrendingVideos"
        class="navOption"
        :title="$t('Trending.Trending')"
        :aria-label="hideLabelsSideBar ? $t('Trending.Trending') : null"
        to="/trending"
      >
        <font-awesome-icon
          :icon="['fas', 'fire']"
          class="navIcon"
          :class="applyNavIconExpand"
        />
        <p
          v-if="!hideLabelsSideBar"
          id="trendingNavLabel"
          class="navLabel"
        >
          {{ $t("Trending.Trending") }}
        </p>
      </router-link>
      <router-link
        v-if="!hidePopularVideos && (backendFallback || backendPreference === 'invidious')"
        class="navOption"
        :title="$t('Most Popular')"
        :aria-label="hideLabelsSideBar ? $t('Most Popular') : null"
        to="/popular"
      >
        <font-awesome-icon
          :icon="['fas', 'users']"
          class="navIcon"
          :class="applyNavIconExpand"
        />
        <p
          v-if="!hideLabelsSideBar"
          id="mostPopularNavLabel"
          class="navLabel"
        >
          {{ $t("Most Popular") }}
        </p>
      </router-link>
      <router-link
        class="navOption"
        :title="$t('About.About')"
        :aria-label="hideLabelsSideBar ? $t('About.About') : null"
        to="/about"
      >
        <font-awesome-icon
          :icon="['fas', 'info-circle']"
          class="navIcon"
          :class="applyNavIconExpand"
        />
        <p
          v-if="!hideLabelsSideBar"
          id="aboutNavLabel"
          class="navLabel"
        >
          {{ $t("About.About") }}
        </p>
      </router-link>
    </div>
    <router-link
      class="navOption mobileShow"
      :title="$t('History.History')"
      :aria-label="hideLabelsSideBar ? $t('History.History'): null"
      to="/history"
    >
      <font-awesome-icon
        :icon="['fas', 'history']"
        class="navIcon"
        :class="applyNavIconExpand"
      />
      <p
        id="historyNavLabel"
        class="navLabel"
      >
        {{ $t("History.History") }}
      </p>
    </router-link>
    <hr>
    <router-link
      class="navOption mobileShow"
      :title="$t('Settings.Settings')"
      :aria-label="hideLabelsSideBar ? $t('Settings.Settings') : null"
      to="/settings"
    >
      <font-awesome-icon
        :icon="['fas', 'sliders-h']"
        class="navIcon"
        :class="applyNavIconExpand"
      />
      <p
        id="settingsNavLabel"
        class="navLabel"
      >
        {{ $t("Settings.Settings") }}
      </p>
    </router-link>
    <router-link
      class="navOption mobileHidden"
      :title="$t('About.About')"
      to="/about"
      :aria-label="hideLabelsSideBar ? $t('About.About') : null"
    >
      <font-awesome-icon
        :icon="['fas', 'info-circle']"
        class="navIcon"
        :class="applyNavIconExpand"
      />
      <p
        v-if="!hideLabelsSideBar"
        class="navLabel"
      >
        {{ $t("About.About") }}
      </p>
    </router-link>
  </div>
</template>

<script src="./side-nav-more-options.js" />
<style scoped src="./side-nav-more-options.css" />
