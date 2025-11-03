<template>
  <div class="pure-checkbox filter">
    <h3 class="checkboxTitle">
      {{ title }}
    </h3>
    <template
      v-for="(label, index) in labels"
      :key="values[index]"
    >
      <input
        :id="id + values[index]"
        v-model="modelValue"
        :name="id"
        :value="values[index]"
        :disabled="disabled"
        class="checkbox"
        type="checkbox"
      >
      <label
        :for="id + values[index]"
      >
        {{ label }}
      </label>
    </template>
  </div>
</template>

<script setup>
import { useId } from 'vue'

const id = useId()

defineProps({
  title: {
    type: String,
    required: true
  },
  labels: {
    type: Array,
    required: true
  },
  values: {
    type: Array,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
})

const modelValue = defineModel({ type: Array, required: true })
</script>

<style scoped src="./FtCheckboxList.css" />
