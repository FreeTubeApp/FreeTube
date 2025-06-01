import { Arch, build, Platform } from 'electron-builder'
import config from './ebuilder.config.mjs'

const args = process.argv

/** @type {Map<import('electron-builder').Platform, Map<import('electron-builder').Arch, Array<string>>>} */
let targets
const platform = process.platform

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

try {
  const output = await build({ targets, config, publish: 'never' })
  console.log(output)
} catch (error) {
  console.error(error)
}
