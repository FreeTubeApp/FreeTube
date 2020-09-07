<template>
  <div class="switch-ctn">
    <input
      :id="id"
      v-model="currentValue"
      type="checkbox"
      name="set-name"
      class="switch-input"
      :checked="currentValue"
      @change="$emit('change', currentValue)"
    >
    <label
      :for="id"
      class="switch-label"
      :class="{compact}"
    >
      {{ label }}
    </label>
  </div>
</template>

<script src="./ft-toggle-switch.js" />
<style scoped lang="sass" src="./ft-toggle-switch.sass" />
