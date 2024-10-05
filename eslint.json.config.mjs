import jsoncEslintParser from 'jsonc-eslint-parser'
import eslintPluginJsonc from 'eslint-plugin-jsonc'

export default [
  ...eslintPluginJsonc.configs['flat/base'],
  {
    files: ['**/*.json'],
    ignores: [
      '**/node_modules',
      '**/_scripts',
      '**/dist',
    ],

    languageOptions: {
      parser: jsoncEslintParser,
    },

    rules: {
      'no-tabs': 'off',
      'comma-spacing': 'off',
    },
  },
]
