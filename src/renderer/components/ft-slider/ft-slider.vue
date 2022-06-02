<template>
  <label
    class="pure-material-slider"
  >
    <input
      :id="id"
      v-model.number="currentValue"
      :disabled="disabled"
      type="range"
      :min="minValue"
      :max="maxValue"
      :step="step"
      @change="$emit('change', currentValue)"
    >
    <span>
      {{ label }}:
      <span>
        {{ displayLabel }}
      </span>
    </span>
  </label>
</template>

<script src="./ft-slider.js" />
<style scoped src="./ft-slider.css" />
