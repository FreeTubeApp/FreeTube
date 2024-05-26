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

<script src="./ft-auto-grid.js" />
<style scoped src="./ft-auto-grid.css" />
