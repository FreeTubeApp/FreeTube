import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import yamlEslintParser from 'yaml-eslint-parser'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

export default [
  ...compat.extends(
    'plugin:yml/recommended',
  ).map(config => ({
    ...config,
    files: ['**/*.{yml,yaml}'],
    ignores: [
      '**/node_modules',
      '**/_scripts',
      '**/dist',
    ],

    languageOptions: {
      parser: yamlEslintParser,
    },

    rules: {
      'yml/no-irregular-whitespace': 'off',
    },
  })),
]
