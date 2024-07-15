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

<script src="./ft-auto-grid.js" />
<style scoped src="./ft-auto-grid.css" />
