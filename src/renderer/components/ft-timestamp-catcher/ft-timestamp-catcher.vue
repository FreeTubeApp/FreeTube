<template>
  <p
    @timestamp-clicked="catchTimestampClick"
    v-html="detectTimestamps(inputHtml)"
  />
</template>

<script src="./ft-timestamp-catcher.js" />
