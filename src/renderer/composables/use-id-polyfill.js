// based on https://github.com/vuejs/core/blob/main/packages/runtime-core/src/helpers/useId.ts

let counter = 0

/**
 * Polyfill for Vue 3's useId composable in Vue 2
 */
export function useId() {
  return `v-0-${counter++}`
}
