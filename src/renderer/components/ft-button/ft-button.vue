<template>
  <button
    :id="id.length > 0 ? id : null"
    class="btn ripple"
    :style="{
      color: textColor,
      backgroundColor: backgroundColor,
      border: `2px solid ${backgroundColor}`
    }"
    @click="click"
  >
    <slot>
      <font-awesome-icon
        v-if="icon"
        :icon="icon"
      />
      {{ label }}
    </slot>
  </button>
</template>

<script src="./ft-button.js" />
<style scoped src="./ft-button.css" />
