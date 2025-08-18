<template>
  <div class="select">
    <select
      :id="id"
      :aria-describedby="describeById"
      class="select-text"
      :class="{ disabled }"
      :value="value"
      :name="id"
      :disabled="disabled"
      @change="change"
    >
      <option
        v-for="(name, index) in selectNames"
        :key="selectValues[index]"
        :value="selectValues[index]"
        :lang="isLocaleSelector && selectValues[index] !== 'system' ? selectValues[index] : null"
      >
        {{ name }}
      </option>
    </select>
    <FontAwesomeIcon
      :icon="['fas', 'sort-down']"
      class="iconSelect"
    />
    <span class="select-highlight" />
    <span class="select-bar" />
    <label
      v-if="!disabled"
      class="select-label"
      :for="id"
    >
      <FontAwesomeIcon
        :icon="icon"
        class="select-icon"
        :color="iconColor"
      />
      {{ placeholder }}
    </label>
    <FtTooltip
      v-if="tooltip !== ''"
      class="selectTooltip"
      :tooltip="tooltip"
    />
  </div>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useId } from '../../composables/use-id-polyfill'

import FtTooltip from '../FtTooltip/FtTooltip.vue'

defineProps({
  placeholder: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  selectNames: {
    type: Array,
    required: true
  },
  selectValues: {
    type: Array,
    required: true
  },
  tooltip: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  describeById: {
    type: String,
    default: null
  },
  icon: {
    type: Array,
    required: true
  },
  iconColor: {
    type: String,
    default: null
  },
  isLocaleSelector: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['change'])

const id = useId()

/**
 * @param {Event} event
 */
function change(event) {
  emit('change', event.target.value)
}
</script>

<style scoped src="./FtSelect.css" />
