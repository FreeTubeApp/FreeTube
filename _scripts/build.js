const os = require('os')
const builder = require('electron-builder')

const Platform = builder.Platform
const Arch = builder.Arch
const { name, productName } = require('../package.json')
const args = process.argv

let targets
const platform = os.platform()

if (platform === 'darwin') {
  let arch = Arch.x64

  if (args[2] === 'arm64') {
    arch = Arch.arm64
  }

  targets = Platform.MAC.createTarget(['DMG','zip', '7z'], arch)
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

  targets = Platform.LINUX.createTarget(['deb', 'zip', '7z', 'apk', 'rpm', 'AppImage', 'pacman'], arch)
}

const config = {
  appId: `io.freetubeapp.${name}`,
  copyright: 'Copyleft © 2020-2022 freetubeapp@protonmail.com',
  // asar: false,
  // compression: 'store',
  productName,
  directories: {
    output: './build/',
  },
  protocols: [
    {
      name: "FreeTube",
      schemes: [
        "freetube"
      ]
    }
  ],
  files: [
    '_icons/iconColor.*',
    'icon.svg',
    './dist/**/*',
    '!dist/web/*',
    '!node_modules/**/*',

    // renderer
    'node_modules/{miniget,ytsr}/**/*',

    '!**/README.md',
    '!**/*.js.map',
    '!**/*.d.ts',
  ],
  dmg: {
    contents: [
      {
        path: '/Applications',
        type: 'link',
        x: 410,
        y: 230,
      },
      {
        type: 'file',
        x: 130,
        y: 230,
      },
    ],
    window: {
      height: 380,
      width: 540,
    }
  },
  linux: {
    category: 'Network',
    icon: '_icons/icon.svg',
    target: ['deb', 'zip', '7z', 'apk', 'rpm', 'AppImage', 'pacman'],
  },
  // See the following issues for more information
  // https://github.com/jordansissel/fpm/issues/1503
  // https://github.com/jgraph/drawio-desktop/issues/259
  rpm: {
    fpm: [`--rpm-rpmbuild-define=_build_id_links none`]
  },
  deb: {
    depends: [
      "libgtk-3-0",
      "libnotify4",
      "libnss3",
      "libxss1",
      "libxtst6",
      "xdg-utils",
      "libatspi2.0-0",
      "libuuid1",
      "libsecret-1-0"
    ]
  },
  mac: {
    category: 'public.app-category.utilities',
    icon: '_icons/iconMac.icns',
    target: ['dmg', 'zip', '7z'],
    type: 'distribution',
    extendInfo: {
      CFBundleURLTypes: [
        'freetube'
      ],
      CFBundleURLSchemes: [
        'freetube'
      ]
    }
  },
  win: {
    icon: '_icons/icon.ico',
    target: ['nsis', 'zip', '7z', 'portable'],
  },
  nsis: {
    allowToChangeInstallationDirectory: true,
    oneClick: false,
  },
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
