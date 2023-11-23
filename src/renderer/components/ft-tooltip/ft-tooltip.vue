<template>
  <div class="tooltip">
    <button
      :aria-labelledby="id"
      class="button"
      type="button"
    >
      <font-awesome-icon :icon="['fas', 'question-circle']" />
    </button>
    <p
      :id="id"
      ref="tooltip"
      class="text"
      :class="{
        [position]: true,
        allowNewlines,
        wrap: tooltipOutsideViewPort,
      }"
      role="tooltip"
      v-text="tooltip"
    />
  </div>
</template>

<script src="./ft-tooltip.js" />
<style scoped src="./ft-tooltip.css" />
