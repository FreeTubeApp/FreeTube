import eslintPluginVue from 'eslint-plugin-vue'
import vuejsAccessibility from 'eslint-plugin-vuejs-accessibility'
import eslintPluginUnicorn from 'eslint-plugin-unicorn'
import eslintConfigPrettier from 'eslint-config-prettier'
import intlifyVueI18N from '@intlify/eslint-plugin-vue-i18n'
import globals from 'globals'
import vueEslintParser from 'vue-eslint-parser'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'
import { fixupConfigRules } from '@eslint/compat'
import jsoncEslintParser from 'jsonc-eslint-parser'
import eslintPluginJsonc from 'eslint-plugin-jsonc'
import eslintPluginYml from 'eslint-plugin-yml'
import yamlEslintParser from 'yaml-eslint-parser'

import activeLocales from './static/locales/activeLocales.json' with { type: 'json' }

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

export default [
  {
    ignores: [
      'dist/',
      'eslint.config.mjs'
    ]
  },
  ...fixupConfigRules(
    compat.config({
      extends: ['standard']
    })
  ),
  js.configs.recommended,
  eslintConfigPrettier,
  ...eslintPluginVue.configs['flat/vue2-recommended'],
  ...vuejsAccessibility.configs["flat/recommended"],
  ...intlifyVueI18N.configs['flat/recommended'],
  {
    files: [
      '**/*.{js,vue}',
    ],
    ignores: [
      '_scripts/',
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
        localeDir: `./static/locales/{${activeLocales.join(',')}}.yaml`,
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

  ...eslintPluginJsonc.configs['flat/base'],
  {
    files: ['**/*.json'],
    ignores: [
      '_scripts/',
    ],

    languageOptions: {
      parser: jsoncEslintParser,
    },

    rules: {
      'no-tabs': 'off',
      'comma-spacing': 'off',
      'no-irregular-whitespace': 'off',
    },

    settings: {
      'vue-i18n': {
        localeDir: `./static/locales/{${activeLocales.join(',')}}.yaml`,
        messageSyntaxVersion: '^8.0.0',
      },
    },
  },

  ...eslintPluginYml.configs['flat/recommended'],
  {
    files: ['**/*.{yml,yaml}'],
    ignores: [
      '.github/',
      '_scripts/'
    ],

    languageOptions: {
      parser: yamlEslintParser,
    },

    rules: {
      'yml/no-irregular-whitespace': 'off',
    },

    settings: {
      'vue-i18n': {
        localeDir: `./static/locales/{${activeLocales.join(',')}}.yaml`,
        messageSyntaxVersion: '^8.0.0',
      },
    },
  },
  {
    files: ['.github/**/*.{yml,yaml}'],

    languageOptions: {
      parser: yamlEslintParser,
    },

    rules: {
      'yml/no-empty-mapping-value': 'off',
      'yml/no-irregular-whitespace': 'off',
    },

    settings: {
      'vue-i18n': {
        localeDir: `./static/locales/{${activeLocales.join(',')}}.yaml`,
        messageSyntaxVersion: '^8.0.0',
      },
    },
  },
  {
    files: ['_scripts/*.js'],
    languageOptions: {
      globals: {
        ...globals.node
      },
      ecmaVersion: 'latest',
    },

    plugins: {
      unicorn: eslintPluginUnicorn,
    },

    rules: {
      'no-console': 'off',
      'n/no-path-concat': 'off',
      'unicorn/better-regex': 'error',
    }
  },
  {
    files: ['_scripts/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },

    plugins: {
      unicorn: eslintPluginUnicorn,
    },

    rules: {
      'no-console': 'off',
      'n/no-path-concat': 'off',
      'unicorn/better-regex': 'error',
    }
  }
]
