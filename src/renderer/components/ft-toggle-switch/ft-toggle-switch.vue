<template>
  <div>
    <input
      type="checkbox"
      :id="id"
      name="set-name"
      class="switch-input"
      :checked='currentValue'
      v-model="currentValue"
      @change="$emit('change', currentValue)"
    >
    <label
      :for="id"
      class="switch-label"
    >
      {{ label }}
    </label>
  </div>
</template>

<script src="./ft-toggle-switch.js" />
<style scoped src="./ft-toggle-switch.css" />
