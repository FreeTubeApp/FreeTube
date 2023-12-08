<template>
  <label
    class="pure-material-slider"
    :for="id"
  >
    <input
      :id="id"
      v-model.number="currentValue"
      :disabled="disabled"
      type="range"
      :min="minValue"
      :max="maxValue"
      :step="step"
      @change="change"
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
