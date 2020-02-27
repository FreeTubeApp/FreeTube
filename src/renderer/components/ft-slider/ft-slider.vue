<template>
  <label
    class="pure-material-slider"
  >
    <input
      :id="id"
      type="range"
      :min="minValue"
      :max="maxValue"
      :step="step"
      v-model.number="currentValue"
    >
      <span>
        {{ label }} -
        <span>
          {{ displayLabel }}
        </span>
      </span>
  </label>
</template>

<script src="./ft-slider.js" />
<style scoped src="./ft-slider.css" />
