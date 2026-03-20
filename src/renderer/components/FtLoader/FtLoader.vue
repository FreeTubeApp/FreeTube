<template>
  <div
    class="container"
    :class="{ fullscreen }"
  >
    <div class="spinner">
      <div class="double-bounce1" />
      <div class="double-bounce2" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  fullscreen: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped src="./FtLoader.css" />
