<template>
  <div
    ref="sideNav"
    class="sideNav"
    :class="{closed: !isOpen}"
  >
    <div
      class="navOption topNavOption"
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
      class="navOption"
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
      class="navOption"
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
      class="navOption"
      @click="navigate('userplaylists')"
    >
      <font-awesome-icon
        icon="star"
        class="navIcon"
      />
      <p class="navLabel">
        Playlists
      </p>
    </div>
    <div
      class="navOption"
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
      class="navOption"
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
      class="navOption"
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
  </div>
</template>

<script src="./side-nav.js" />
<style scoped src="./side-nav.css" />
