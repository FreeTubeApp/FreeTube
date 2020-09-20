<template>
  <div
    id="app"
    :class="{
      hideOutlines: hideOutlines,
      rightAligned: isRightAligned
    }"
  >
    <top-nav ref="topNav" />
    <side-nav ref="sideNav" />
    <transition
      mode="out-in"
      name="fade"
    >
      <!-- <keep-alive> -->
      <RouterView
        ref="router"
        class="routerView"
        :class="{ expand: !isOpen }"
      />
      <!-- </keep-alive> -->
    </transition>
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
