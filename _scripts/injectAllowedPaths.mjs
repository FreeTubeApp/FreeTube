/**
 * Injects the paths that the renderer process is allowed to read into the main.js file,
 * by replacing __FREETUBE_ALLOWED_PATHS__ with an array of strings with the paths.
 *
 * This allows the main process to validate the paths which the renderer process accesses,
 * to ensure that it cannot access other files on the disk, without the users permission (e.g. file picker).
 */
import { closeSync, ftruncateSync, openSync, readFileSync, readdirSync, writeSync } from 'fs'
import { dirname, join, relative, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const distDirectory = resolve(__dirname, '..', 'dist')
const webDirectory = join(distDirectory, 'web')

const paths = readdirSync(distDirectory, {
  recursive: true,
  withFileTypes: true
})
  .filter(dirent => {
    // only include files not directories
    return dirent.isFile() &&
      // disallow the renderer process/browser windows to read the main.js file
      dirent.name !== 'main.js' &&
      dirent.name !== 'main.js.LICENSE.txt' &&
      // filter out any web build files, in case the dist directory contains a web build
      !dirent.path.startsWith(webDirectory)
  })
  .map(dirent => {
    const joined = join(dirent.path, dirent.name)
    return '/' + relative(distDirectory, joined).replaceAll('\\', '/')
  })

let fileHandle
try {
  fileHandle = openSync(join(distDirectory, 'main.js'), 'r+')

  let contents = readFileSync(fileHandle, 'utf-8')

  contents = contents.replace('__FREETUBE_ALLOWED_PATHS__', JSON.stringify(paths))

  ftruncateSync(fileHandle)
  writeSync(fileHandle, contents, 0, 'utf-8')
} finally {
  if (typeof fileHandle !== 'undefined') {
    closeSync(fileHandle)
  }
}
