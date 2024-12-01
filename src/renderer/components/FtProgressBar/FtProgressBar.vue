<template>
  <div
    class="progressBar"
    :style="{ inlineSize: progressBarPercentage + '%' }"
  />
</template>

<script setup>
import { computed } from 'vue'

import store from '../../store/index'

const progressBarPercentage = computed(() => {
  return store.getters.getProgressBarPercentage
})
</script>

<style scoped src="./FtProgressBar.css" />
