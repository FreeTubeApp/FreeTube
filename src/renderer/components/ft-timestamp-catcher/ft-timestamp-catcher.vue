<template>
  <p
    @timestampClicked="catchTimestampClick"
    v-html="detectTimestamps(inputHTML)"
  />
</template>

<script src="./ft-timestamp-catcher.js" />
<style scoped src="./ft-timestamp-catcher.css" />
