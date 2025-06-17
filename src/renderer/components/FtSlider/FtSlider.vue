<template>
  <label
    class="pure-material-slider"
    :for="id"
  >
    <input
      :id="id"
      v-model.number="currentValue"
      :disabled="disabled"
      type="range"
      :min="minValue"
      :max="maxValue"
      :step="step"
      @change="change"
    >
    <span>
      {{ $t('Display Label', {label: label, value: displayLabel}) }}
    </span>
  </label>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useId } from '../../composables/use-id-polyfill.js'

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  defaultValue: {
    type: Number,
    required: true
  },
  minValue: {
    type: Number,
    required: true
  },
  maxValue: {
    type: Number,
    required: true
  },
  step: {
    type: Number,
    required: true
  },
  valueExtension: {
    type: String,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['change'])

const id = useId()
const currentValue = ref(props.defaultValue)

watch(() => props.defaultValue, (value) => {
  if (currentValue.value !== value) {
    currentValue.value = value
  }
})

const displayLabel = computed(() => {
  if (props.valueExtension === null) {
    return currentValue.value
  } else {
    return `${currentValue.value}${props.valueExtension}`
  }
})

function change() {
  emit('change', currentValue.value)
}

</script>
<style scoped src="./FtSlider.css" />
