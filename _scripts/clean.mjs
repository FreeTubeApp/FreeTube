import { rm } from 'fs/promises'
import { join } from 'path'

const BUILD_PATH = join(import.meta.dirname, '..', 'build')
const DIST_PATH = join(import.meta.dirname, '..', 'dist')

await Promise.all([
  rm(BUILD_PATH, { recursive: true, force: true }),
  rm(DIST_PATH, { recursive: true, force: true })
])
