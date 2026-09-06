const { hash } = require('crypto')
const { join } = require('path')
const { readFileSync } = require('fs')

const path = join(__dirname, '../src/renderer/sigViewScript.js')
const rawScript = readFileSync(path, 'utf8')

const script = process.env.NODE_ENV === 'development'
  ? rawScript
  : require('terser').minify_sync({ [path]: rawScript }).code

module.exports.sigViewTemplateParameters = {
  sigViewRaw: `<!doctype html><script>${script}</script>`,
  sigViewCspHash: `sha512-${hash('sha512', script, 'base64')}`
}
