const { execSync } = require('child_process')
const builder = require('electron-builder')
const path = require('path')

exports.default = async function(context) {
  if (context.electronPlatformName === 'darwin' && context.arch === builder.Arch.arm64) {
    const appPath = path.join(context.appOutDir, 'FreeTube.app')
    const frameworksPath = path.join(appPath, 'Contents/Frameworks')

    execSync(`/usr/bin/codesign --force --sign - ${frameworksPath.toString()}/*`)
    execSync(`/usr/bin/codesign --force --sign - ${appPath.toString()}`)
  }
}
