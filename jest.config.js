module.exports = {
  verbose: true,
  setupFiles: ['./tests/setup.js'],
  moduleFileExtensions: ['js', 'json', 'vue'],
  transform: {
    '.*\\.(vue)$': 'vue-jest',
    '^.+\\.js$': 'babel-jest'
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/renderer/components/**/*.{js,ts,vue}',
    '!**/node_modules/**'
  ],
  coverageReporters: ['html', 'text-summary']
}
