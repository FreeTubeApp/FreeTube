import preferUseI18nPolyfillRule from './prefer-use-i18n-polyfill-rule.mjs'

export default {
  meta: {
    name: 'eslint-plugin-freetube',
    version: '1.0'
  },
  rules: {
    'prefer-use-i18n-polyfill': preferUseI18nPolyfillRule
  }
}
