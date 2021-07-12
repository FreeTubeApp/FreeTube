<template>
  <div>
    <general-settings />
    <theme-settings />
    <player-settings />
    <external-player-settings v-if="usingElectron" />
    <subscription-settings />
    <distraction-settings />
    <privacy-settings />
    <data-settings />
    <proxy-settings />
    <sponsor-block-settings />
    <parental-control-settings/>
  </div>
</template>

<script src="./Settings.js" />
<style scoped src="./Settings.css" />
