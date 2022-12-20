import { access, mkdir, readFile, unlink, writeFile } from 'fs/promises'
import { resolve } from 'path'

// based off https://github.com/LuanRT/YouTube.js/blob/6caa679df6ddc77d25be02dcb7355b722ab268aa/src/utils/Cache.ts
// avoids errors caused by the fully dynamic `fs` and `path` module imports that youtubei.js's UniversalCache does
export class PlayerCache {
  constructor(cacheDirectory) {
    this.cacheDirectory = cacheDirectory
  }

  async get(key) {
    const filePath = resolve(this.cacheDirectory, key)

    try {
      const contents = await readFile(filePath)
      return contents.buffer
    } catch (e) {
      if (e?.code === 'ENOENT') {
        return undefined
      }
      throw e
    }
  }

  async set(key, value) {
    await mkdir(this.cacheDirectory, { recursive: true })

    const filePath = resolve(this.cacheDirectory, key)
    await writeFile(filePath, new Uint8Array(value))
  }

  async remove(key) {
    const filePath = resolve(this.cacheDirectory, key)

    // only try to delete the file if it exists, access() throws an exception if the file doesn't exist
    try {
      await access(filePath)
      await unlink(filePath)
    } catch { }
  }
}
