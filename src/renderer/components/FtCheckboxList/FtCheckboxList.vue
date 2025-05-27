<template>
  <div class="pure-checkbox filter">
    <h3 class="checkboxTitle">
      {{ title }}
    </h3>
    <template
      v-for="(label, index) in labels"
    >
      <input
        :id="id + values[index]"
        :key="'value' + values[index]"
        v-model="modelValue"
        :name="id"
        :value="values[index]"
        :disabled="disabled"
        class="checkbox"
        type="checkbox"
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
import { ref, watch } from 'vue'
import { useId } from '../../composables/use-id-polyfill'

const id = useId()

const props = defineProps({
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
    type: Array,
    required: true
  }
})

// Required for v-model in the parent component (https://v2.vuejs.org/v2/guide/components#Using-v-model-on-Components)
// Do not rename or remove
// TODO: Replace with defineModel in Vue 3
const emit = defineEmits(['input'])

/** @type {import('vue').Ref<string[]>} */
const modelValue = ref(props.value)

watch(
  modelValue,
  (newValue) => {
    emit('input', newValue)
  },
  { deep: true }
)

watch(
  () => props.value,
  (newValue) => {
    modelValue.value = newValue
  },
  { deep: true }
)
</script>

<style scoped src="./FtCheckboxList.css" />
