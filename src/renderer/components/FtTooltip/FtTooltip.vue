<template>
  <div class="tooltip">
    <button
      :aria-labelledby="id"
      class="button"
      type="button"
    >
      <FontAwesomeIcon :icon="['fas', 'question-circle']" />
    </button>
    <p
      :id="id"
      class="text"
      :class="{
        [position]: true,
        allowNewlines,
      }"
      role="tooltip"
    >
      {{ tooltip }}
    </p>
  </div>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useId } from '../../composables/use-id-polyfill'

defineProps({
  position: {
    type: String,
    default: 'bottom',
    validator: (value) => value === 'bottom' || value === 'left' || value === 'right' || value === 'top' || value === 'bottom-left'
  },
  tooltip: {
    type: String,
    required: true
  },
  allowNewlines: {
    type: Boolean,
    default: false,
  },
})

const id = useId()
</script>

<style scoped src="./FtTooltip.css" />
