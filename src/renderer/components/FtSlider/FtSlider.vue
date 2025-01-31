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
      {{ t('Display Label', {label: label, value: displayLabel}) }}
    </span>
  </label>
</template>

<script setup>
import { computed, ref } from 'vue'
import { randomUUID } from 'crypto'
import { useI18n } from '../../composables/use-i18n-polyfill'

const { t } = useI18n()

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

const id = randomUUID()
const currentValue = ref(props.defaultValue)

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
