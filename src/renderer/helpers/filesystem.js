import fs from 'fs/promises'

/**
 * Async version of existsSync, as node doesn't have it
 * @param {string} path
 */
export async function pathExists(path) {
  try {
    await fs.access(path)
    return true
  } catch {
    return false
  }
}
