<template>
  <div
    :class="{
      grid: grid,
      list: !grid
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
