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
 * @property {string | (({elapsedMs: number, remainingMs: number}) => string)} message
 * @property {Function | null} action
 * @property {boolean} isOpen
 * @property {NodeJS.Timeout | number} timeout
 * @property {NodeJS.Timeout | number} interval
 * @property {number} id
 */

/** @type {import('vue').ShallowReactive<Toast[]>} */
const toasts = shallowReactive([])

/**
 * @param {CustomEvent<{ message: string | (({elapsedMs: number, remainingMs: number}) => string), time: number | null, action: Function | null, abortSignal: AbortSignal | null }>} event
 */
function open({ detail: { message, time, action, abortSignal } }) {
  /** @type {Toast} */
  const toast = {
    message,
    action,
    isOpen: false,
    timeout: 0,
    interval: 0,
    id: idCounter++
  }
  time ||= 3000
  let elapsed = 0
  const updateDelay = 1000

  if (typeof message === 'function') {
    toast.message = message({ elapsedMs: elapsed, remainingMs: time - elapsed })
    toast.interval = setInterval(() => {
      elapsed += updateDelay
      // Skip last update
      if (elapsed >= time) { return }
      toast.message = message({ elapsedMs: elapsed, remainingMs: time - elapsed })
    }, updateDelay)
  }

  toast.timeout = setTimeout(close, time, toast)
  if (abortSignal != null) {
    abortSignal.addEventListener('abort', () => {
      close(toast)
    })
  }

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
    cleanup(toast)
  }
}

/**
 * @param {Toast} toast
 */
function cleanup(toast) {
  // assumes `toasts.indexOf(toast) !== -1`
  clearTimeout(toast.timeout)
  clearInterval(toast.interval)
}

onMounted(() => {
  ToastEventBus.addEventListener('toast-open', open)
})

onBeforeUnmount(() => {
  ToastEventBus.removeEventListener('toast-open', open)
  toasts.forEach(cleanup)
})
</script>

<style scoped src="./FtToast.css" />
