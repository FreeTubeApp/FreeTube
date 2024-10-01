import eslintPluginVue from 'eslint-plugin-vue'
import vuejsAccessibility from 'eslint-plugin-vuejs-accessibility'
import eslintPluginUnicorn from 'eslint-plugin-unicorn'
import eslintConfigPrettier from 'eslint-config-prettier'
import intlifyVueI18N from '@intlify/eslint-plugin-vue-i18n'
import globals from 'globals'
import vueEslintParser from 'vue-eslint-parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'
import { fixupConfigRules } from '@eslint/compat'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

export default [
  ...fixupConfigRules(
    compat.config({
      extends: ['standard']
    })
  ),
  js.configs.recommended,
  eslintConfigPrettier,
  ...eslintPluginVue.configs['flat/recommended'],
  ...vuejsAccessibility.configs["flat/recommended"],
  ...intlifyVueI18N.configs['flat/recommended'],
  {
    files: [
      '**/*.{js,vue}',
    ],
    ignores: [
      '**/node_modules',
      '**/_scripts',
      '**/dist',
    ],
    plugins: {
      unicorn: eslintPluginUnicorn,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      parser: vueEslintParser,
      ecmaVersion: 2022,
      sourceType: 'module',
    },

    settings: {
      'vue-i18n': {
        localeDir: './static/locales/{en-US,en-GB,ar,bg,ca,cs,da,de-DE,el,es,es-AR,es-MX,et,eu,fa,fi,fr-FR,gl,he,hu,hr,id,is,it,ja,ko,lt,nb-NO,nl,nn,pl,pt,pt-BR,pt-PT,ro,ru,sk,sl,sr,sv,tr,uk,vi,zh-CN,zh-TW}.yaml',
        messageSyntaxVersion: '^8.0.0',
      },
    },

    rules: {
      'space-before-function-paren': 'off',
      'comma-dangle': ['error', 'only-multiline'],
      'vue/no-v-html': 'off',

      'no-console': ['error', {
        allow: ['warn', 'error'],
      }],

      'no-unused-vars': 'warn',
      'no-undef': 'warn',
      'object-shorthand': 'off',
      'vue/no-template-key': 'warn',
      'vue/no-useless-template-attributes': 'off',
      'vue/multi-word-component-names': 'off',
      'vuejs-accessibility/no-onchange': 'off',

      'vuejs-accessibility/label-has-for': ['error', {
        required: {
          some: ['nesting', 'id'],
        },
      }],

      'vuejs-accessibility/no-static-element-interactions': 'off',
      'n/no-callback-literal': 'warn',
      'n/no-path-concat': 'warn',
      'unicorn/better-regex': 'error',
      'unicorn/no-array-push-push': 'error',
      'unicorn/prefer-keyboard-event-key': 'error',
      'unicorn/prefer-regexp-test': 'error',
      'unicorn/prefer-string-replace-all': 'error',
      '@intlify/vue-i18n/no-dynamic-keys': 'error',
      '@intlify/vue-i18n/no-duplicate-keys-in-locale': 'error',

      '@intlify/vue-i18n/no-raw-text': ['error', {
        attributes: {
          '/.+/': [
            'title',
            'aria-label',
            'aria-placeholder',
            'aria-roledescription',
            'aria-valuetext',
            'tooltip',
            'message',
          ],

          input: ['placeholder', 'value'],
          img: ['alt'],
        },

        ignoreText: ['-', '•', '/', 'YouTube', 'Invidious', 'FreeTube'],
      }],

      '@intlify/vue-i18n/no-deprecated-tc': 'off',
      'vue/require-explicit-emits': 'error',
      'vue/no-unused-emit-declarations': 'error',
    },
  },
]
