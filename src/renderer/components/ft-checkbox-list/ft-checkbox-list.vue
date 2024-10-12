<template>
  <div class="pure-checkbox filter">
    <h3 class="checkboxTitle">
      {{ title }}
    </h3>
    <!--  eslint-disable vue/no-template-key -->
    <template
      v-for="(label, index) in labels"
    >
      <input
        :id="values[index] + id"
        :key="index"
        :name="inputName"
        :value="values[index]"
        :disabled="disabled"
        class="checkbox"
        type="checkbox"
        :checked="selectedValues.includes(values[index]) ?? null"
        @change="change"
      >
      <label
        :key="label"
        :for="values[index] + id"
      >
        {{ label }}
      </label>
    </template>
  </div>
</template>

<script src="./ft-checkbox-list.js" />
<style scoped src="./ft-checkbox-list.css" />
