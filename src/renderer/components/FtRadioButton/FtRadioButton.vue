<template>
  <div class="pure-radiobutton filter">
    <h3 class="radioTitle">
      {{ title }}
    </h3>
    <template
      v-for="(label, index) in labels"
    >
      <input
        :id="id + values[index]"
        :key="'value' + values[index]"
        :name="id"
        :value="values[index]"
        :checked="value === values[index]"
        :disabled="disabled"
        class="radio"
        type="radio"
        @change="handleChange(values[index])"
      >
      <label
        :key="'label' + values[index]"
        :for="id + values[index]"
      >
        {{ label }}
      </label>
    </template>
  </div>
</template>

<script setup>
import { useId } from '../../composables/use-id-polyfill'

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

  // Required for v-model in the parent component (https://v2.vuejs.org/v2/guide/components#Using-v-model-on-Components)
  // Do not rename or remove
  // TODO: Replace with defineModel in Vue 3
  value: {
    type: String,
    required: true
  }
})

// Required for v-model in the parent component (https://v2.vuejs.org/v2/guide/components#Using-v-model-on-Components)
// Do not rename or remove
// TODO: Replace with defineModel in Vue 3
const emit = defineEmits(['input'])

/**
 * @param {string} value
 */
function handleChange(value) {
  emit('input', value)
}
</script>

<style scoped src="./FtRadioButton.css" />
