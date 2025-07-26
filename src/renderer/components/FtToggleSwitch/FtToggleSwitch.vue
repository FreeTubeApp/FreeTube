<template>
  <div
    class="switch-ctn"
    :class="{
      compact,
      disabled: disabled,
      containsTooltip: tooltip.length > 0
    }"
  >
    <input
      :id="id"
      v-model="currentValue"
      type="checkbox"
      name="set-name"
      class="switch-input"
      :checked="currentValue"
      :disabled="disabled"
      @change="change"
    >
    <label
      :for="id"
      class="switch-label"
    >
      <span class="switch-label-text">
        {{ label }}
      </span>
      <FtTooltip
        v-if="tooltip !== ''"
        class="selectTooltip"
        :position="tooltipPosition"
        :tooltip="tooltip"
        :allow-newlines="tooltipAllowNewlines"
      />
    </label>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useId } from '../../composables/use-id-polyfill'

import FtTooltip from '../FtTooltip/FtTooltip.vue'

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  defaultValue: {
    type: Boolean,
    default: false
  },
  compact: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  tooltip: {
    type: String,
    default: ''
  },
  tooltipPosition: {
    type: String,
    default: 'bottom-left'
  },
  tooltipAllowNewlines: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['change'])

const id = useId()

const currentValue = ref(props.defaultValue)

watch(() => props.defaultValue, (value) => {
  currentValue.value = value
})

function change() {
  emit('change', currentValue.value)
}
</script>

<style scoped lang="scss" src="./FtToggleSwitch.scss" />
