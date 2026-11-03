import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^DB_HANDLERS_ELECTRON_RENDERER_OR_WEB$/,
        replacement: path.resolve('tests/mocks/settingsDatabase.js')
      }
    ]
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js']
  }
})
