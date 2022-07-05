<template>
  <div>
    <general-settings />
    <hr>
    <theme-settings />
    <hr>
    <player-settings />
    <hr>
    <external-player-settings v-if="usingElectron" />
    <hr>
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
    <hr>
    <parental-control-settings />
    <hr>
    <sponsor-block-settings />
  </div>
</template>

<script src="./Settings.js" />
<style scoped src="./Settings.css" />
