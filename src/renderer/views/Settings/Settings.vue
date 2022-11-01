<template>
  <div>
    <general-settings />
    <hr>
    <theme-settings />
    <hr>
    <player-settings />
    <hr>
    <external-player-settings v-if="usingElectron" />
    <hr v-if="usingElectron">
    <subscription-settings />
    <hr>
    <distraction-settings />
    <hr>
    <privacy-settings />
    <hr>
    <data-settings />
    <hr>
    <proxy-settings />
    <hr>
    <download-settings v-if="usingElectron" />
    <hr v-if="usingElectron">
    <parental-control-settings />
    <hr>
    <sponsor-block-settings />
    <hr v-if="usingElectron">
    <experimental-settings v-if="usingElectron" />
  </div>
</template>

<script src="./Settings.js" />
<style scoped src="./Settings.css" />
