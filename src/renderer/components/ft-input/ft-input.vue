<template>
  <div
    class="ft-input-component"
    :class="{ search: forceTextColor }"
  >
    <input
      :id="id"
      class="ft-input"
      type="text"
      :placeholder="placeholder"
      @input="e => inputData = e.target.value"
    >
    <font-awesome-icon
      v-if="showArrow"
      icon="arrow-right"
      class="inputAction"
      @click="handleClick"
    />
  </div>
</template>

<script src="./ft-input.js" />
<style scoped src="./ft-input.css" />
