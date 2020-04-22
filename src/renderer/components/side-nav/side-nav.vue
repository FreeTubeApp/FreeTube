<template>
  <ft-flex-box
    ref="sideNav"
    class="sideNav"
    :class="{closed: !isOpen}"
  >
    <div
      class="navOption topNavOption mobileShow"
      @click="navigate('subscriptions')"
    >
      <font-awesome-icon
        icon="rss"
        class="navIcon"
      />
      <p class="navLabel">
        Subscriptions
      </p>
      <font-awesome-icon
        class="refreshIcon"
        icon="sync"
      />
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
        Trending
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
        Most Popular
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
        Playlists
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
        History
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
        Settings
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
        About
      </p>
    </div>
    <hr>
  </ft-flex-box>
</template>

<script src="./side-nav.js" />
<style scoped src="./side-nav.css" />
