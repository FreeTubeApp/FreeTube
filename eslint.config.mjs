import eslintPluginVue from 'eslint-plugin-vue'
import vuejsAccessibility from 'eslint-plugin-vuejs-accessibility'
import eslintPluginUnicorn from 'eslint-plugin-unicorn'
import intlifyVueI18N from '@intlify/eslint-plugin-vue-i18n'
import globals from 'globals'
import vueEslintParser from 'vue-eslint-parser'
import js from '@eslint/js'
import jsoncEslintParser from 'jsonc-eslint-parser'
import eslintPluginJsonc from 'eslint-plugin-jsonc'
import eslintPluginYml from 'eslint-plugin-yml'
import yamlEslintParser from 'yaml-eslint-parser'
// Faster than importing the default import,
// because the default import imports a lot of other dependencies
// for the `resolveIgnoresFromGitignore` function that we don't use
import { neostandard } from 'neostandard/lib/main.js'
import jsdoc from 'eslint-plugin-jsdoc'
import freetube from './_scripts/eslint-rules/plugin.mjs'

import activeLocales from './static/locales/activeLocales.json' with { type: 'json' }

export default [
  {
    ignores: [
      'build/',
      'dist/',
      'eslint.config.mjs',
      // The JSON files inside this directory are auto-generated, so they don't follow the code style rules
      'static/geolocations/'
    ]
  },
  ...neostandard({
    noJsx: true,
    ts: false,
  }),
  js.configs.recommended,
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
      jsdoc,
      freetube,
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
      '@stylistic/space-before-function-paren': 'off',
      '@stylistic/comma-dangle': ['error', 'only-multiline'],
      'vue/no-v-html': 'off',

      'no-console': ['error', {
        allow: ['warn', 'error'],
      }],

      'no-unused-vars': 'warn',
      'no-undef': 'warn',
      'object-shorthand': 'off',
      'vue/no-template-key': 'warn',
      'vue/multi-word-component-names': 'off',

      'vuejs-accessibility/label-has-for': ['error', {
        required: {
          some: ['nesting', 'id'],
        },
      }],

      'vuejs-accessibility/no-static-element-interactions': 'off',
      'unicorn/better-regex': 'error',
      'unicorn/prefer-single-call': 'error',
      'unicorn/prefer-keyboard-event-key': 'error',
      'unicorn/prefer-regexp-test': 'error',
      'unicorn/prefer-string-replace-all': 'error',
      'unicorn/prefer-optional-catch-binding': 'error',
      'unicorn/prefer-date-now': 'error',
      'unicorn/prefer-array-index-of': 'error',
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

      'jsdoc/check-alignment': 'error',
      'jsdoc/check-property-names': 'error',
      'jsdoc/check-param-names': 'error',
      'jsdoc/check-syntax': 'error',
      'jsdoc/check-template-names': 'error',
      'jsdoc/check-types': 'error',
      'jsdoc/no-bad-blocks': 'error',
      'jsdoc/no-multi-asterisks': 'error',

      'freetube/prefer-use-i18n-polyfill': 'error',
    },
  },

  {
    files: ['src/main/index.js'],
    languageOptions: {
      globals: {
        __FREETUBE_ALLOWED_PATHS__: 'readable'
      }
    }
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
      '@stylistic/no-tabs': 'off',
      '@stylistic/comma-spacing': 'off',
      '@stylistic/eol-last': 'off',
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
      '@stylistic/spaced-comment': 'off',
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
      globals: globals.node,
      ecmaVersion: 'latest',
      sourceType: 'commonjs'
    },

    plugins: {
      unicorn: eslintPluginUnicorn,
    },

    rules: {
      '@stylistic/space-before-function-paren': 'off',
      '@stylistic/comma-dangle': ['error', 'only-multiline'],
      'no-console': 'off',
      'unicorn/better-regex': 'error',
      'unicorn/prefer-optional-catch-binding': 'error',
      'unicorn/prefer-date-now': 'error',
      'unicorn/prefer-array-index-of': 'error',
    }
  },
  {
    files: ['_scripts/**/*.mjs'],
    languageOptions: {
      globals: globals.node,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },

    plugins: {
      unicorn: eslintPluginUnicorn,
    },

    rules: {
      'no-console': 'off',
      '@stylistic/space-before-function-paren': 'off',
      '@stylistic/comma-dangle': ['error', 'only-multiline'],
      'unicorn/better-regex': 'error',
      'unicorn/prefer-optional-catch-binding': 'error',
      'unicorn/prefer-date-now': 'error',
      'unicorn/prefer-array-index-of': 'error',
    }
  }
]
