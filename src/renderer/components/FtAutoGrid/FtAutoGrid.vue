<template>
  <div
    :class="{
      autoGrid: grid,
      autoList: !grid
    }"
  >
    <slot />
  </div>
</template>

<script setup>
defineProps({
  grid: {
    type: Boolean,
    required: true
  }
})
</script>

<style scoped src="./FtAutoGrid.css" />
