const { readFile, writeFile } = require('fs/promises')
const { join } = require('path')

;(async () => {
  const manifest = (await readFile(join(__dirname, '../android/app/src/main/AndroidManifest.xml'))).toString()
  const invidiousInstances = JSON.parse((await readFile(join(__dirname, '../static/invidious-instances.json'))).toString())
  const supportedLinks = manifest.match(/<!-- supported links -->[\S\s]*?<!-- \/supported links -->/gm)
  const instancesXml = invidiousInstances.map(({ url, cors }) => {
    return `<data android:host="${url.replace('https://', '')}" />`
  }).join('\n              ')
  const postManifest = manifest.replace(supportedLinks[0], `<!-- supported links -->\n              ${instancesXml}\n            <!-- /supported links -->`)
  await writeFile(join(__dirname, '../android/app/src/main/AndroidManifest.xml'), postManifest)
})()
