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
        :name="inputName"
        :value="values[index]"
        :disabled="disabled"
        class="radio"
        type="checkbox"
        :checked="initialValues.some(e => e == values[index]) ?? null"
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
