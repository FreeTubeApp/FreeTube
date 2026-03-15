import eslintPluginVue from 'eslint-plugin-vue'
import vuejsAccessibility from 'eslint-plugin-vuejs-accessibility'
import eslintPluginUnicorn from 'eslint-plugin-unicorn'
import intlifyVueI18N from '@intlify/eslint-plugin-vue-i18n'
import globals from 'globals'
import vueEslintParser from 'vue-eslint-parser'
import js from '@eslint/js'
import eslintPluginJsonc from 'eslint-plugin-jsonc'
import eslintPluginYml from 'eslint-plugin-yml'
import jsdoc from 'eslint-plugin-jsdoc'

import stylistic from '@stylistic/eslint-plugin'
import eslintPluginImportX from 'eslint-plugin-import-x'
import eslintPluginN from 'eslint-plugin-n'
import eslintPluginPromise from 'eslint-plugin-promise'

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
  {
    name: 'base',

    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.es2022,
        ...globals.node,
        document: 'readonly',
        navigator: 'readonly',
        window: 'readonly',
      },
    },

    plugins: {
      'import-x': eslintPluginImportX,
      n: eslintPluginN,
      promise: eslintPluginPromise,
    },

    rules: {
      'no-var': 'warn',
      'object-shorthand': ['warn', 'properties'],

      'accessor-pairs': ['error', { setWithoutGet: true, enforceForClassMembers: true }],
      'array-callback-return': ['error', {
        allowImplicit: false,
        checkForEach: false,
      }],
      camelcase: ['error', {
        allow: ['^UNSAFE_'],
        properties: 'never',
        ignoreGlobals: true,
      }],
      curly: ['error', 'multi-line'],
      'default-case-last': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'new-cap': ['error', { newIsCap: true, capIsNew: false, properties: true }],
      'no-array-constructor': 'error',
      'no-caller': 'error',
      'no-constant-condition': ['error', { checkLoops: false }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-eval': 'error',
      'no-extend-native': 'error',
      'no-extra-bind': 'error',
      'no-implied-eval': 'error',
      'no-iterator': 'error',
      'no-labels': ['error', { allowLoop: false, allowSwitch: false }],
      'no-lone-blocks': 'error',
      'no-multi-str': 'error',
      'no-new': 'error',
      'no-new-func': 'error',
      'no-object-constructor': 'error',
      'no-new-wrappers': 'error',
      'no-octal-escape': 'error',
      'no-proto': 'error',
      'no-redeclare': ['error', { builtinGlobals: false }],
      'no-return-assign': ['error', 'except-parens'],
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-template-curly-in-string': 'error',
      'no-throw-literal': 'error',
      'no-undef-init': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unneeded-ternary': ['error', { defaultAssignment: false }],
      'no-unreachable-loop': 'error',
      'no-unused-expressions': ['error', {
        allowShortCircuit: true,
        allowTernary: true,
        allowTaggedTemplates: true,
      }],
      'no-unused-vars': ['error', {
        args: 'none',
        caughtErrors: 'none',
        ignoreRestSiblings: true,
        vars: 'all',
      }],
      'no-use-before-define': ['error', { functions: false, classes: false, variables: false }],
      'no-useless-call': 'error',
      'no-useless-computed-key': 'error',
      'no-useless-constructor': 'error',
      'no-useless-rename': 'error',
      'no-useless-return': 'error',
      'no-void': 'error',
      'one-var': ['error', { initialized: 'never' }],
      'prefer-const': ['error', { destructuring: 'all' }],
      'prefer-promise-reject-errors': 'error',
      'prefer-regex-literals': ['error', { disallowRedundantWrapping: true }],
      'symbol-description': 'error',
      'unicode-bom': ['error', 'never'],
      'use-isnan': ['error', {
        enforceForSwitchCase: true,
        enforceForIndexOf: true,
      }],
      'valid-typeof': ['error', { requireStringLiterals: true }],
      yoda: ['error', 'never'],

      'import-x/export': 'error',
      'import-x/first': 'error',
      'import-x/no-absolute-path': ['error', { esmodule: true, commonjs: true, amd: false }],
      'import-x/no-duplicates': 'error',
      'import-x/no-named-default': 'error',
      'import-x/no-webpack-loader-syntax': 'error',

      'n/handle-callback-err': ['error', '^(err|error)$'],
      'n/no-callback-literal': 'error',
      'n/no-deprecated-api': 'warn',
      'n/no-exports-assign': 'error',
      'n/no-new-require': 'error',
      'n/no-path-concat': 'error',
      'n/process-exit-as-throw': 'error',

      'promise/param-names': 'error',
    },
  },
  {
    name: 'style',

    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      '@stylistic/array-bracket-spacing': ['error', 'never'],
      '@stylistic/arrow-spacing': ['error', { before: true, after: true }],
      '@stylistic/block-spacing': ['error', 'always'],
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      '@stylistic/comma-dangle': ['warn', {
        arrays: 'ignore',
        enums: 'ignore',
        exports: 'ignore',
        imports: 'ignore',
        objects: 'ignore',
      }],
      '@stylistic/comma-spacing': ['error', { before: false, after: true }],
      '@stylistic/comma-style': ['error', 'last'],
      '@stylistic/computed-property-spacing': ['error', 'never', { enforceForClassMembers: true }],
      '@stylistic/dot-location': ['error', 'property'],
      '@stylistic/eol-last': 'error',
      '@stylistic/function-call-spacing': ['error', 'never'],
      '@stylistic/generator-star-spacing': ['error', { before: true, after: true }],
      '@stylistic/indent': ['error', 2, {
        SwitchCase: 1,
        VariableDeclarator: 1,
        outerIIFEBody: 1,
        MemberExpression: 1,
        FunctionDeclaration: { parameters: 1, body: 1 },
        FunctionExpression: { parameters: 1, body: 1 },
        CallExpression: { arguments: 1 },
        ArrayExpression: 1,
        ObjectExpression: 1,
        ImportDeclaration: 1,
        flatTernaryExpressions: false,
        ignoreComments: false,
        ignoredNodes: ['TemplateLiteral *'],
        offsetTernaryExpressions: true,
      }],
      '@stylistic/key-spacing': ['error', { beforeColon: false, afterColon: true }],
      '@stylistic/keyword-spacing': ['error', { before: true, after: true }],
      '@stylistic/lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
      '@stylistic/multiline-ternary': ['error', 'always-multiline'],
      '@stylistic/new-parens': 'error',
      '@stylistic/no-extra-parens': ['error', 'functions'],
      '@stylistic/no-floating-decimal': 'error',
      '@stylistic/no-mixed-operators': ['error', {
        groups: [
          ['==', '!=', '===', '!==', '>', '>=', '<', '<='],
          ['&&', '||'],
          ['in', 'instanceof'],
        ],
        allowSamePrecedence: true,
      }],
      '@stylistic/no-mixed-spaces-and-tabs': 'error',
      '@stylistic/no-multi-spaces': ['error', { ignoreEOLComments: true }],
      '@stylistic/no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 0 }],
      '@stylistic/no-tabs': 'error',
      '@stylistic/no-trailing-spaces': 'error',
      '@stylistic/no-whitespace-before-property': 'error',
      '@stylistic/object-curly-newline': ['error', { multiline: true, consistent: true }],
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@stylistic/object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
      '@stylistic/operator-linebreak': ['error', 'after', { overrides: { '?': 'before', ':': 'before', '|>': 'before' } }],
      '@stylistic/padded-blocks': ['error', { blocks: 'never', switches: 'never', classes: 'never' }],
      '@stylistic/quote-props': ['error', 'as-needed'],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: 'never' }],
      '@stylistic/rest-spread-spacing': ['error', 'never'],
      '@stylistic/semi': ['error', 'never'],
      '@stylistic/semi-spacing': ['error', { before: false, after: true }],
      '@stylistic/space-before-blocks': ['error', 'always'],
      '@stylistic/space-before-function-paren': ['error', 'always'],
      '@stylistic/space-in-parens': ['error', 'never'],
      '@stylistic/space-infix-ops': 'error',
      '@stylistic/space-unary-ops': ['error', { words: true, nonwords: false }],
      '@stylistic/spaced-comment': ['error', 'always', {
        line: { markers: ['*package', '!', '/', ',', '='] },
        block: { balanced: true, markers: ['*package', '!', ',', ':', '::', 'flow-include'], exceptions: ['*'] },
      }],
      '@stylistic/template-curly-spacing': ['error', 'never'],
      '@stylistic/template-tag-spacing': ['error', 'never'],
      '@stylistic/wrap-iife': ['error', 'any', { functionPrototypeMethods: true }],
      '@stylistic/yield-star-spacing': ['error', 'both'],
    },
  },

  js.configs.recommended,
  ...eslintPluginVue.configs['flat/recommended'],
  ...vuejsAccessibility.configs["flat/recommended"],
  ...intlifyVueI18N.configs.recommended,
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
        messageSyntaxVersion: '^11.0.0',
      },
    },

    rules: {
      '@stylistic/space-before-function-paren': 'off',
      '@stylistic/comma-dangle': ['error', 'only-multiline'],

      // Ban v-html as it inserts HTML via innerHTML without sanitizing it
      // if inserting raw HTML is unavoidable the custom v-safer-html directive should be used
      // which sanitizes the HTML before inserting it into the DOM
      'vue/no-v-html': 'error',

      'no-console': ['error', {
        allow: ['warn', 'error'],
      }],

      'no-unused-vars': 'warn',
      'no-undef': 'warn',
      'object-shorthand': 'off',
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

      'vue/no-unused-emit-declarations': 'error',
      'vue/prefer-use-template-ref': 'error',

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
  {
    files: ['src/renderer/directives/vSaferHtml.js'],
    languageOptions: {
      globals: {
        // Fix Sanitizer not being listed in `globals` yet, remove it it gets added in the future
        Sanitizer: 'readable'
      }
    }
  },

  ...eslintPluginJsonc.configs.base,
  {
    files: ['**/*.json'],
    ignores: [
      '_scripts/',
    ],

    rules: {
      '@stylistic/no-tabs': 'off',
      '@stylistic/comma-spacing': 'off',
      '@stylistic/eol-last': 'off',
      'no-irregular-whitespace': 'off',
    },

    settings: {
      'vue-i18n': {
        localeDir: `./static/locales/{${activeLocales.join(',')}}.yaml`,
        messageSyntaxVersion: '^11.0.0',
      },
    },
  },

  ...eslintPluginYml.configs.recommended,
  {
    files: ['**/*.{yml,yaml}'],
    ignores: [
      '.github/',
      '_scripts/'
    ],

    rules: {
      'yml/no-irregular-whitespace': 'off',
      '@stylistic/spaced-comment': 'off',
    },

    settings: {
      'vue-i18n': {
        localeDir: `./static/locales/{${activeLocales.join(',')}}.yaml`,
        messageSyntaxVersion: '^11.0.0',
      },
    },
  },
  {
    files: ['.github/**/*.{yml,yaml}'],

    rules: {
      'yml/no-empty-mapping-value': 'off',
      'yml/no-irregular-whitespace': 'off',
    },

    settings: {
      'vue-i18n': {
        localeDir: `./static/locales/{${activeLocales.join(',')}}.yaml`,
        messageSyntaxVersion: '^11.0.0',
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
