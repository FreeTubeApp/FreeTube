// This script fixes shaka-player referencing the Roboto font on google fonts in its CSS
// by updating the CSS to point to the local Roboto font
// this script only makes changes if they are needed, so running it multiple times doesn't cause any problems

import { closeSync, ftruncateSync, openSync, readFileSync, writeSync } from 'fs'
import { resolve } from 'path'

const SHAKA_DIST_DIR = resolve(import.meta.dirname, '../node_modules/shaka-player/dist')

function removeRobotoFont() {
  let cssFileHandle
  try {
    cssFileHandle = openSync(`${SHAKA_DIST_DIR}/controls.css`, 'r+')

    let cssContents = readFileSync(cssFileHandle, 'utf-8')

    const beforeReplacement = cssContents.length
    cssContents = cssContents.replace(/@font-face{font-family:Roboto;[^}]+}/, '')

    if (cssContents.length !== beforeReplacement) {
      ftruncateSync(cssFileHandle)
      writeSync(cssFileHandle, cssContents, 0, 'utf-8')

      console.log('Removed shaka-player Roboto font, so it uses ours')
    }
  } finally {
    if (cssFileHandle !== undefined) {
      closeSync(cssFileHandle)
    }
  }
}

removeRobotoFont()
