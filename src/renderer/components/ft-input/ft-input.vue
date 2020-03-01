<template>
  <div
    class="ft-input-component"
    :class="{ search: forceTextColor }"
  >
    <input
      :id="id"
      v-model="inputData"
      class="ft-input"
      type="text"
      :placeholder="placeholder"
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
