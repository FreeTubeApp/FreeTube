/* eslint-disable @intlify/vue-i18n/no-dynamic-keys */
import { computed } from 'vue'

import i18n from '../i18n/index'

/**
 * Polyfill for vue-i18n's useI18n composable, as it is not available in Vue 2
 * and doesn't work when vue-i18n 9+ (used for Vue 3) is set to `legacy: true`,
 * which is needed for Options API components.
 *
 * Yes, vue-i18n 9 has an `allowComposition` option,
 * but it comes with limitations that this polyfill doesn't have and was removed in vue-i18n 10.
 *
 * @see https://vue-i18n.intlify.dev/guide/migration/vue3#limitations
 * @see https://vue-i18n.intlify.dev/guide/migration/breaking10.html#drop-allowcomposition-option
 */
export function useI18n() {
  const locale = computed({
    get() {
      return i18n.locale
    },
    set(locale) {
      i18n.locale = locale
    }
  })

  return {
    locale,
    t
  }
}

/**
 * @overload
 * @param {string} key
 * @returns {string}
 */

/**
 * @overload
 * @param {string} key
 * @param {number} plural
 * @returns {string}
 */

/**
 * @overload
 * @param {string} key
 * @param {unknown[]} list
 * @returns {string}
 */

/**
 * @overload
 * @param {string} key
 * @param {unknown[]} list
 * @param {number} plural
 * @returns {string}
 */

/**
 * @overload
 * @param {string} key
 * @param {Record<string, unknown>} named
 * @returns {string}
 */

/**
 * @overload
 * @param {string} key
 * @param {Record<string, unknown>} named
 * @param {number} plural
 * @returns {string}
 */

/**
 * @param {string} key
 * @param {number | unknown[] | Record<string, unknown> | undefined} arg1
 * @param {number | undefined} arg2
 * @returns {string}
 */
function t(key, arg1, arg2) {
  // Remove these lines in the Vue 3 migration and pass all args to the `.t()` call
  if (typeof arg1 === 'number') {
    return i18n.tc(key, arg1)
  } else if (typeof arg2 === 'number') {
    return i18n.tc(key, arg2, arg1)
  }

  if (arg1 != null) {
    return i18n.t(key, arg1)
  }

  return i18n.t(key)
}
