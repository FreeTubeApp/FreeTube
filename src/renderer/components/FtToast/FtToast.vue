<template>
  <div class="toast-holder">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="toast"
      :class="{ closed: !toast.isOpen, open: toast.isOpen }"
      tabindex="0"
      role="status"
      @click="performAction(toast)"
      @keydown.enter.prevent="performAction(toast)"
      @keydown.space.prevent="performAction(toast)"
    >
      <p class="message">
        {{ toast.message }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, shallowReactive } from 'vue'
import { ToastEventBus } from '../../helpers/utils'

let idCounter = 0

/**
 * @typedef Toast
 * @property {string} message
 * @property {Function | null} action
 * @property {boolean} isOpen
 * @property {NodeJS.Timeout | number} timeout
 * @property {number} id
 */

/** @type {import('vue').ShallowReactive<Toast[]>} */
const toasts = shallowReactive([])

/**
 * @param {CustomEvent<{ message: string, time: number | null, action: Function | null }>} event
 */
function open({ detail: { message, time, action } }) {
  /** @type {Toast} */
  const toast = {
    message,
    action,
    isOpen: false,
    timeout: 0,
    id: idCounter++
  }

  toast.timeout = setTimeout(close, time || 3000, toast)

  nextTick(() => {
    toast.isOpen = true
  })

  if (toasts.length > 4) {
    remove(toasts[0])
  }
  toasts.push(toast)
}

/**
 * @param {Toast} toast
 */
function close(toast) {
  setTimeout(remove, 300, toast)

  toast.isOpen = false
}

/**
 * @param {Toast} toast
 */
function performAction(toast) {
  toast.action?.()
  remove(toast)
}

/**
 * @param {Toast} toast
 */
function remove(toast) {
  const index = toasts.indexOf(toast)

  if (index !== -1) {
    toasts.splice(index, 1)
    clearTimeout(toast.timeout)
  }
}

onMounted(() => {
  ToastEventBus.addEventListener('toast-open', open)
})

onBeforeUnmount(() => {
  ToastEventBus.removeEventListener('toast-open', open)
  toasts.forEach((toast) => clearTimeout(toast.timeout))
})
</script>

<style scoped src="./FtToast.css" />
