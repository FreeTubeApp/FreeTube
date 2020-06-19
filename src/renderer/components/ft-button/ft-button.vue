<template>
  <button
    class="btn ripple"
    :style="{
      color: textColor,
      backgroundColor: backgroundColor,
      border: `2px solid ${backgroundColor}`
    }"
    @click="$emit('click')"
  >
    <slot>
      {{ label }}
    </slot>
  </button>
</template>

<script src="./ft-button.js" />
<style scoped src="./ft-button.css" />
