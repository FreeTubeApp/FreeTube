import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import jsoncEslintParser from 'jsonc-eslint-parser'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

export default [
  ...compat.extends(
    'plugin:jsonc/base',
  ).map(config => ({
    ...config,
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
  })),
]
