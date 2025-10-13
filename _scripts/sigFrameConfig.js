const { hash } = require('crypto')
const { join } = require('path')
const { readFileSync } = require('fs')

const path = join(__dirname, '../src/renderer/sigFrameScript.js')
const rawScript = readFileSync(path, 'utf8')

const script = rawScript.split(/\r?\n/).map(line => line.trim()).filter(line => !line.startsWith('//')).join('')

module.exports.sigFrameTemplateParameters = {
  sigFrameSrc: `data:text/html,${encodeURIComponent(`<!doctype html><script>${script}</script>`)}`,
  sigFrameCspHash: `sha512-${hash('sha512', script, 'base64')}`
}
