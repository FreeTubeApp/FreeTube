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

  // https://vuejs.github.io/eslint-plugin-vue/user-guide/#faq
  parserOptions: {
    parser: 'babel-eslint',
    ecmaVersion: 2018,
    sourceType: 'module'
  },

  // https://eslint.org/docs/user-guide/configuring#extending-configuration-files
  // order matters: from least important to most important in terms of overriding
  // Prettier + Vue: https://medium.com/@gogl.alex/how-to-properly-set-up-eslint-with-prettier-for-vue-or-nuxt-in-vscode-e42532099a9c
  extends: [
    'prettier',
    'eslint:recommended',
    'plugin:vue/recommended',
    'standard'
  ],

  // https://eslint.org/docs/user-guide/configuring#configuring-plugins
  plugins: ['vue'],

  rules: {
    'space-before-function-paren': 'off',
    'comma-dangle': ['error', 'never'],
    'vue/no-v-html': 'off',
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'no-unused-vars': 'warn',
    'no-undef': 'warn',
    'vue/no-template-key': 'warn',
    'vue/no-useless-template-attributes': 'off',
    'vue/multi-word-component-names': 'off'
  }
}
