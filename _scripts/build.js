const os = require('os')
const builder = require('electron-builder')

const Platform = builder.Platform
const Arch = builder.Arch
const { name, productName } = require('../package.json')
const args = process.argv

let targets
const platform = os.platform()
const cpus = os.cpus()

if (platform === 'darwin') {
  let arch = Arch.x64

// Macbook Air 2020 with M1 = 'Apple M1'
  // Macbook Pro 2021 with M1 Pro = 'Apple M1 Pro'
  if (cpus[0].model.startsWith('Apple')) {
    arch = Arch.arm64
  }

  targets = Platform.MAC.createTarget(['dmg'], arch)
} else if (platform === 'win32') {
  targets = Platform.WINDOWS.createTarget()
} else if (platform === 'linux') {
  let arch = Arch.x64

  if (args[2] === 'arm64') {
    arch = Arch.arm64
  }

  if (args[2] === 'arm32') {
    arch = Arch.armv7l
  }

  targets = Platform.LINUX.createTarget(['deb', 'zip', 'apk', 'rpm', 'AppImage', 'pacman'], arch)
}

const config = {
  appId: `io.freetubeapp.${name}`,
  copyright: 'Copyleft © 2020-2021 freetubeapp@protonmail.com',
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
    '!**/node_modules/**/.*',
    '!**/{.github,Jenkinsfile}',
    '!**/{CHANGES.md,CODE_OF_CONDUCT.md,CONTRIBUTING.md,CONTRIBUTION.md,DEVELOPMENT.md,docs,docs.md,docs.mli,examples,History.md,HISTORY.md,index.html,README.md,TODO.md,UPGRADE_GUIDE.md,UPGRADING.md}',
    '!**/{commitlint.config.js,.editorconfig,.eslintignore,.eslintrc.{js,yml},.gitmodules,.huskyrc,.lintstagedrc,.nvmrc,.nycrc{,.json},.prettierrc{,.yaml},tslint.json}',
    '!**/{.babelrc,bower.json,Gruntfile.js,Makefile,.npmrc.proregistry,rollup.config.js,.tm_properties,.tool-versions,tsconfig.json,webpack.config.js}',
    '!**/*.{{,c,m}js,min,ts}.map',
    '!**/*.d.ts',

    // only exclude the src directory for specific packages
    // as some of them have their dist code in there and we don't want to exclude those
    '!**/node_modules/{@fortawesome/vue-fontawesome,agent-base,jquery,localforage,m3u8-parser,marked,mpd-parser,performance-now,video.js,vue,vue-i18n,vue-router}/src/*',
    '!**/node_modules/**/{bin,man,scripts}/*',
    '!**/node_modules/jquery/dist/jquery.slim*.js',
    '!**/node_modules/video.js/dist/{alt/*,video.js}',
    '!**/node_modules/@videojs/*/src'
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
    target: ['deb', 'zip', 'apk', 'rpm', 'AppImage', 'pacman'],
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
    target: ['dmg', 'zip'],
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
    target: ['nsis', 'zip', 'portable', 'squirrel'],
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
  })
  .then(m => {
    console.log(m)
  })
  .catch(e => {
    console.error(e)
  })
