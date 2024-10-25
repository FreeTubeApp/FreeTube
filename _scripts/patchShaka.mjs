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

async function removeRobotoFont() {
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
    if (typeof cssFileHandle !== 'undefined') {
      closeSync(cssFileHandle)
    }
  }
}

async function replaceAndDownloadMaterialIconsFont() {
  let cssFileHandle
  try {
    cssFileHandle = openSync(`${SHAKA_DIST_DIR}/controls.css`, 'r+')

    let cssContents = readFileSync(cssFileHandle, 'utf-8')

    const fontFaceRegex = /@font-face{font-family:'Material Icons Round'[^}]+format\('opentype'\)}/

    if (fontFaceRegex.test(cssContents)) {
      const cssResponse = await fetch('https://fonts.googleapis.com/icon?family=Material+Icons+Round', {
        headers: {
          // Without the user-agent it returns the otf file instead of the woff2 one
          'user-agent': 'Firefox/125.0'
        }
      })

      const text = await cssResponse.text()

      let newFontCSS = text.match(/(@font-face\s*{[^}]+})/)[1].replaceAll('\n', '')


      const urlMatch = newFontCSS.match(/https:\/\/fonts\.gstatic\.com\/s\/materialiconsround\/(?<version>[^/]+)\/[^.]+\.(?<extension>\w+)/)

      const url = urlMatch[0]
      const { version, extension } = urlMatch.groups

      const fontResponse = await fetch(url)
      const fontContent = new Uint8Array(await fontResponse.arrayBuffer())

      const filename = `shaka-materialiconsround-${version}.${extension}`
      writeFileSync(`${SHAKA_DIST_DIR}/${filename}`, fontContent)

      newFontCSS = newFontCSS.replace(url, `./${filename}`)

      cssContents = cssContents.replace(fontFaceRegex, newFontCSS)

      ftruncateSync(cssFileHandle)
      writeSync(cssFileHandle, cssContents, 0, 'utf-8')

      console.log('Changed shaka-player Material Icons Rounded font to use the smaller woff2 format instead of otf')
      console.log('Downloaded shaka-player Material Icons Rounded font')
    }
  } catch (e) {
    console.error(e)
  } finally {
    if (typeof cssFileHandle !== 'undefined') {
      closeSync(cssFileHandle)
    }
  }
}

fixTypes()
await removeRobotoFont()
await replaceAndDownloadMaterialIconsFont()
