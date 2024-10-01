import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import jsoncEslintParser from 'jsonc-eslint-parser'
import eslintPluginJsonc from 'eslint-plugin-jsonc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

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
