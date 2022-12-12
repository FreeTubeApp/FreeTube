<template>
  <div
    class="ft-card"
    @focusout="$emit('focusout')"
  >
    <slot />
  </div>
</template>

<script src="./ft-card.js" />
<style scoped src="./ft-card.css" />
