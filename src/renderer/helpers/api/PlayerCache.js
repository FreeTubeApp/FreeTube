import fs from 'fs/promises'
import path from 'path'

import { pathExists } from '../filesystem'

// based off https://github.com/LuanRT/YouTube.js/blob/6caa679df6ddc77d25be02dcb7355b722ab268aa/src/utils/Cache.ts
// avoids errors caused by the fully dynamic `fs` and `path` module imports that youtubei.js's UniversalCache does
export class PlayerCache {
  constructor(cacheDirectory) {
    this.cacheDirectory = cacheDirectory
  }

  async get(key) {
    const filePath = path.resolve(this.cacheDirectory, key)

    try {
      const contents = await fs.readFile(filePath)
      return contents.buffer
    } catch (e) {
      if (e?.code === 'ENOENT') {
        return undefined
      }
      throw e
    }
  }

  async set(key, value) {
    await fs.mkdir(this.cacheDirectory, { recursive: true })

    const filePath = path.resolve(this.cacheDirectory, key)
    await fs.writeFile(filePath, new Uint8Array(value))
  }

  async remove(key) {
    const filePath = path.resolve(this.cacheDirectory, key)

    if (await pathExists(filePath)) {
      try {
        await fs.unlink(filePath)
      } catch { }
    }
  }
}
