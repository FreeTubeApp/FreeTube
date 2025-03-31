const os = require('os')
const builder = require('electron-builder')
const config = require('./ebuilder.config.js')

const Platform = builder.Platform
const Arch = builder.Arch
const args = process.argv

/** @type {Map<import('electron-builder').Platform, Map<import('electron-builder').Arch, Array<string>>>} */
let targets
const platform = os.platform()

if (platform === 'darwin') {
  let arch = Arch.x64

  if (args[2] === 'arm64') {
    arch = Arch.arm64
  }

  targets = Platform.MAC.createTarget(['DMG', 'zip', '7z'], arch)
} else if (platform === 'win32') {
  let arch = Arch.x64

  if (args[2] === 'arm64') {
    arch = Arch.arm64
  }

  targets = Platform.WINDOWS.createTarget(['nsis', 'zip', '7z', 'portable'], arch)
} else if (platform === 'linux') {
  let arch = Arch.x64

  if (args[2] === 'arm64') {
    arch = Arch.arm64
  }

  if (args[2] === 'arm32') {
    arch = Arch.armv7l
  }

  targets = Platform.LINUX.createTarget(['deb', 'zip', '7z', 'rpm', 'AppImage', 'pacman'], arch)
}

builder
  .build({
    targets,
    config,
    publish: 'never'
  })
  .then(m => {
    console.log(m)
  })
  .catch(e => {
    console.error(e)
  })
