<template>
  <div
    class="ft-auto-grid"
    :class="{
      grid: grid,
      list: !grid
    }"
  >
    <slot />
  </div>
</template>

<script src="./ft-auto-grid.js" />
<style scoped lang="scss" src="./ft-auto-grid.scss" />
