<template>
  <div class="pure-radiobutton filter">
    <h3 class="radioTitle">
      {{ title }}
    </h3>
    <!--  eslint-disable vue/no-template-key -->
    <div
      v-for="(label, index) in labels"
      :key="index"
      class="radioButtonContainer"
    >
      <input
        :id="values[index] + id"
        v-model="selectedValue"
        :name="inputName"
        :value="values[index]"
        :checked="index === 0"
        :disabled="disabled"
        class="radio"
        type="radio"
        @change="change(values[index])"
      >
      <label
        :for="values[index] + id"
      >
        {{ label }}
      </label>
    </div>
  </div>
</template>

<script src="./ft-radio-button.js" />
<style scoped src="./ft-radio-button.css" />
