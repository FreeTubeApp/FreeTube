<template>
  <button
    class="btn ripple"
    :style="{
      color: textColor,
      backgroundColor: backgroundColor,
      borderColor: backgroundColor
    }"
    @click="click"
  >
    <slot>
      <FontAwesomeIcon
        v-if="icon"
        :icon="icon"
      />
      {{ label }}
    </slot>
  </button>
</template>

<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

defineProps({
  label: {
    type: String,
    default: ''
  },
  textColor: {
    type: String,
    default: 'var(--text-with-accent-color)'
  },
  backgroundColor: {
    type: String,
    default: 'var(--accent-color)'
  },
  icon: {
    type: Array,
    default: null
  }
})

const emit = defineEmits(['click'])

/**
 * @param {MouseEvent} event
 */
function click(event) {
  emit('click', event)
}
</script>

<style scoped src="./FtButton.css" />
