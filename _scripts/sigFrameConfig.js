const { hash } = require('crypto')
const { join } = require('path')
const { readFileSync } = require('fs')

const path = join(__dirname, '../src/renderer/sigFrameScript.js')
const rawScript = readFileSync(path, 'utf8')

const script = rawScript

module.exports.sigFrameTemplateParameters = {
  sigFrameSrc: `data:text/html,${encodeURIComponent(`<!doctype html><script>${script}</script>`)}`,
  sigFrameCspHash: `sha256-${hash('sha256', script, 'base64')}`
}
