import { rm } from 'fs/promises'
import { join } from 'path'

const BUILD_PATH = join(import.meta.dirname, '..', 'build')
const DIST_PATH = join(import.meta.dirname, '..', 'dist')
const TEST_RESULTS_PATH = join(import.meta.dirname, '..', 'test-results')

await Promise.all([
  rm(BUILD_PATH, { recursive: true, force: true }),
  rm(DIST_PATH, { recursive: true, force: true }),
  rm(TEST_RESULTS_PATH, { recursive: true, force: true }),
])
