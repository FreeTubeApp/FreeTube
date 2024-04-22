// This script fixes shaka not exporting its type definitions and referencing remote google fonts in its CSS
// by adding an export line to the type definitions and downloading the fonts and updating the CSS to point to the local files
// this script only makes changes if they are needed, so running it multiple times doesn't cause any problems

import { appendFileSync, closeSync, ftruncateSync, openSync, readFileSync, writeFileSync, writeSync } from 'fs'
import { resolve } from 'path'

const SHAKA_DIST_DIR = resolve(import.meta.dirname, '../node_modules/shaka-player/dist')

function fixTypes() {
  let fixedTypes = false

  let fileHandleNormal
  try {
    fileHandleNormal = openSync(`${SHAKA_DIST_DIR}/shaka-player.ui.d.ts`, 'a+')

    const contents = readFileSync(fileHandleNormal, 'utf-8')

    // This script is run after every `yarn install`, even if shaka-player wasn't updated
    // So we want to check first, if we actually need to make any changes
    // or if the ones from the previous run are still intact
    if (!contents.includes('export default shaka')) {
      appendFileSync(fileHandleNormal, 'export default shaka;\n')

      fixedTypes = true
    }
  } finally {
    if (typeof fileHandleNormal !== 'undefined') {
      closeSync(fileHandleNormal)
    }
  }

  let fileHandleDebug
  try {
    fileHandleDebug = openSync(`${SHAKA_DIST_DIR}/shaka-player.ui.debug.d.ts`, 'a+')

    const contents = readFileSync(fileHandleDebug, 'utf-8')

    // This script is run after every `yarn install`, even if shaka-player wasn't updated
    // So we want to check first, if we actually need to make any changes
    // or if the ones from the previous run are still intact
    if (!contents.includes('export default shaka')) {
      appendFileSync(fileHandleDebug, 'export default shaka;\n')

      fixedTypes = true
    }
  } finally {
    if (typeof fileHandleDebug !== 'undefined') {
      closeSync(fileHandleDebug)
    }
  }

  if (fixedTypes) {
    console.log('Fixed shaka-player types')
  }
}

async function fixRemoteFonts() {
  let cssFileHandle
  try {
    cssFileHandle = openSync(`${SHAKA_DIST_DIR}/controls.css`, 'r+')

    let cssContents = readFileSync(cssFileHandle, 'utf-8')

    const beforeRobotoReplacement = cssContents.length
    cssContents = cssContents.replace(/@font-face\{font-family:Roboto;[^}]+\}/, '')

    if (cssContents.length !== beforeRobotoReplacement) {
      console.log('Removed shaka-player Roboto font, so it uses ours')
    }

    const remoteFontsRegex = /https:\/\/fonts\.gstatic\.com\/s\/(?<name>[^\/]+)\/(?<version>[^\/]+)\/[^.]+\.(?<extension>[a-z]+)/g
    /** @type {RegExpMatchArray[]} */
    const remoteFontMatches = [...cssContents.matchAll(remoteFontsRegex)]

    if (remoteFontMatches.length > 0) {
      console.log('Downloading shaka-player remote fonts...')

      for (const match of remoteFontMatches) {
        const url = match[0]
        const { name, version, extension } = match.groups

        const response = await fetch(url)
        const fontContent = new Uint8Array(await response.arrayBuffer())

        const filename = `shaka-${name}-${version}.${extension}`
        writeFileSync(`${SHAKA_DIST_DIR}/${filename}`, fontContent)

        cssContents = cssContents.replace(url, `./${filename}`)
      }

      ftruncateSync(cssFileHandle)
      writeSync(cssFileHandle, cssContents, 0, 'utf-8')

      console.log('Localised shaka-player fonts')
    }
  } finally {
    if (typeof cssFileHandle !== 'undefined') {
      closeSync(cssFileHandle)
    }
  }
}

fixTypes()
await fixRemoteFonts()
