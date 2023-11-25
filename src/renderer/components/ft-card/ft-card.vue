<template>
  <div
    class="ft-card"
    :class="{ fullWidth: useFullWidthLayout, big }"
    @focusout="$emit('focusout')"
  >
    <slot />
  </div>
</template>

<script src="./ft-card.js" />
<style scoped src="./ft-card.scss" lang="scss" />
