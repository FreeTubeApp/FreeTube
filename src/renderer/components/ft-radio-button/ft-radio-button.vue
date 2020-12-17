<template>
  <div class="pure-radiobutton filter">
    <h3 class="radioTitle">
      {{ title }}
    </h3>
    <!--  eslint-disable vue/no-template-key -->
    <template
      v-for="(label, index) in labels"
      class="radioButtonContainer"
    >
      <input
        :id="values[index] + id"
        :key="index"
        v-model="selectedValue"
        :name="inputName"
        :value="values[index]"
        :checked="index === 0"
        :disabled="disabled"
        class="radio"
        type="radio"
        @change="$emit('change', values[index])"
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

<script src="./ft-radio-button.js" />
<style scoped src="./ft-radio-button.css" />
