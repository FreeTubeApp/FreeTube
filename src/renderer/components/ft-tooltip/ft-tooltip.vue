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
      class="text"
      :class="{
        [position]: true,
        allowNewlines,
      }"
      role="tooltip"
      v-text="tooltip"
    />
  </div>
</template>

<script src="./ft-tooltip.js" />
<style scoped src="./ft-tooltip.css" />
