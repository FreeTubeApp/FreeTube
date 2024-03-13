module.exports = {
  // https://eslint.org/docs/user-guide/configuring#using-configuration-files-1
  root: true,

  // https://eslint.org/docs/user-guide/configuring#specifying-environments
  env: {
    browser: true,
    node: true
  },

  // https://eslint.org/docs/user-guide/configuring#specifying-parser
  parser: 'vue-eslint-parser',

  // https://eslint.vuejs.org/user-guide/#faq
  parserOptions: {
    parser: '@babel/eslint-parser',
    ecmaVersion: 2022,
    sourceType: 'module'
  },

  overrides: [
    {
      files: ['*.json'],
      parser: 'jsonc-eslint-parser',
      extends: ['plugin:jsonc/base'],
      rules: {
        'no-tabs': 'off',
        'comma-spacing': 'off'
      }
    },
    {
      files: ['*.yaml', '*.yml'],
      parser: 'yaml-eslint-parser',
      extends: ['plugin:yml/recommended'],
      rules: {
        'yml/no-irregular-whitespace': 'off'
      }
    }
  ],

  // https://eslint.org/docs/user-guide/configuring#extending-configuration-files
  // order matters: from least important to most important in terms of overriding
  // Prettier + Vue: https://medium.com/@gogl.alex/how-to-properly-set-up-eslint-with-prettier-for-vue-or-nuxt-in-vscode-e42532099a9c
  extends: [
    'prettier',
    'eslint:recommended',
    'plugin:vue/recommended',
    'standard',
    'plugin:jsonc/recommended-with-json',
    'plugin:vuejs-accessibility/recommended',
    'plugin:@intlify/vue-i18n/recommended'
  ],

  // https://eslint.org/docs/user-guide/configuring#configuring-plugins
  plugins: ['vue', 'vuejs-accessibility', 'n', 'unicorn', '@intlify/vue-i18n'],

  rules: {
    'space-before-function-paren': 'off',
    'comma-dangle': ['error', 'only-multiline'],
    'vue/no-v-html': 'off',
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'no-unused-vars': 'warn',
    'no-undef': 'warn',
    'object-shorthand': 'off',
    'vue/no-template-key': 'warn',
    'vue/no-useless-template-attributes': 'off',
    'vue/multi-word-component-names': 'off',
    'vuejs-accessibility/no-onchange': 'off',
    'vuejs-accessibility/label-has-for': ['error', {
      required: {
        some: ['nesting', 'id']
      }
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
    // TODO: enable at a later date. currently disabled to prevent massive conflicts for initial PR
    // '@intlify/vue-i18n/no-unused-keys': [
    //   'error',
    //   {
    //     extensions: ['.js', '.vue', 'yaml']
    //   }
    // ],
    '@intlify/vue-i18n/no-duplicate-keys-in-locale': 'error',
    '@intlify/vue-i18n/no-raw-text': [
      'error',
      {
        attributes: {
          '/.+/': [
            'title',
            'aria-label',
            'aria-placeholder',
            'aria-roledescription',
            'aria-valuetext',
            'tooltip',
            'message'
          ],
          input: ['placeholder', 'value'],
          img: ['alt']
        },
        ignoreText: ['-', '•', '/']
      }
    ],
  },
  settings: {
    'vue-i18n': {
      localeDir: './static/locales/*.yaml'
    }
  }
}
