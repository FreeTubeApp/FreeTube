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
      rules: {
        'no-tabs': 'off',
        'comma-spacing': 'off'
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
    // 'plugin:vuejs-accessibility/recommended' // uncomment once issues are fixed
  ],

  // https://eslint.org/docs/user-guide/configuring#configuring-plugins
  plugins: ['vue', 'vuejs-accessibility', 'n', 'unicorn'],

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
    'n/no-callback-literal': 'warn',
    'n/no-path-concat': 'warn',
    'unicorn/better-regex': 'error',
    'unicorn/no-array-push-push': 'error',
    'unicorn/prefer-keyboard-event-key': 'error',
    'unicorn/prefer-regexp-test': 'error',
    'unicorn/prefer-string-replace-all': 'error'
  }
}
