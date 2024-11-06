import useI18nPolyfillRule from './use-i18n-polyfill-rule.mjs'

export default {
  meta: {
    name: 'eslint-plugin-freetube',
    version: '1.0'
  },
  rules: {
    'use-i18n-polyfill': useI18nPolyfillRule
  }
}
