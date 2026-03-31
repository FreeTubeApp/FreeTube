process.env.NODE_ENV = 'development'

const electron = require('electron')
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const kill = require('tree-kill')

const path = require('path')
const { spawn } = require('child_process')

const ProcessLocalesPlugin = require('./ProcessLocalesPlugin')

let electronProcess = null
let manualRestart = null

const remoteDebugging = process.argv.indexOf('--remote-debug') !== -1
const web = process.argv.indexOf('--web') !== -1

let mainConfig
let rendererConfig
let preloadConfig
let botGuardScriptConfig
let webConfig
let SHAKA_LOCALES_TO_BE_BUNDLED

if (!web) {
  mainConfig = require('./webpack.main.config')
  rendererConfig = require('./webpack.renderer.config')
  preloadConfig = require('./webpack.preload.config.js')
  botGuardScriptConfig = require('./webpack.botGuardScript.config')

  SHAKA_LOCALES_TO_BE_BUNDLED = rendererConfig.SHAKA_LOCALES_TO_BE_BUNDLED
  delete rendererConfig.SHAKA_LOCALES_TO_BE_BUNDLED
} else {
  webConfig = require('./webpack.web.config')
}

if (remoteDebugging) {
  // disable dvtools open in electron
  process.env.RENDERER_REMOTE_DEBUGGING = true
}

// Define exit code for relaunch and set it in the environment
const relaunchExitCode = 69
process.env.FREETUBE_RELAUNCH_EXIT_CODE = relaunchExitCode

const port = 9080

async function killElectron(pid) {
  return new Promise((resolve, reject) => {
    if (pid) {
      kill(pid, err => {
        if (err) reject(err)

        resolve()
      })
    } else {
      resolve()
    }
  })
}

async function restartElectron() {
  console.log('\nStarting electron...')

  const { pid } = electronProcess || {}
  await killElectron(pid)

  electronProcess = spawn(electron, [
    path.join(__dirname, '../dist/main.js'),
    // '--enable-logging', // Enable to show logs from all electron processes
    remoteDebugging ? '--inspect=9222' : '',
    remoteDebugging ? '--remote-debugging-port=9223' : ''
  ],
    // { stdio: 'inherit' } // required for logs to actually appear in the stdout
  )

  electronProcess.on('exit', (code, _) => {
    if (code === relaunchExitCode) {
      electronProcess = null
      restartElectron()
      return
    }

    if (!manualRestart) process.exit(0)
  })
}

/**
 * @param {import('webpack').Compiler} compiler
 * @param {WebpackDevServer} devServer
 */
function setupNotifyLocaleUpdate(compiler, devServer) {
  const notifyLocaleChange = (updatedLocales) => {
    devServer.sendMessage(devServer.webSocketServer.clients, 'freetube-locale-update', updatedLocales)
  }

  compiler.options.plugins
    .filter(plugin => plugin instanceof ProcessLocalesPlugin)
    .forEach((/** @type {ProcessLocalesPlugin} */plugin) => {
      plugin.notifyLocaleChange = notifyLocaleChange
    })
}

function startBotGuardScript() {
  webpack(botGuardScriptConfig, (err) => {
    if (err) console.error(err)

    console.log(`\nCompiled ${botGuardScriptConfig.name} script!`)
  })
}

function startMain() {
  const compiler = webpack(mainConfig)
  const { name } = compiler

  compiler.hooks.afterEmit.tap('afterEmit', async () => {
    console.log(`\nCompiled ${name} script!`)

    manualRestart = true
    await restartElectron()
    setTimeout(() => {
      manualRestart = false
    }, 2500)

    console.log(`\nWatching file changes for ${name} script...`)
  })

  compiler.watch({
    aggregateTimeout: 500,
  },
  err => {
    if (err) console.error(err)
  })
}

function startPreload() {
  const compiler = webpack(preloadConfig)
  const { name } = compiler

  let firstTime = true

  compiler.hooks.afterEmit.tap('afterEmit', async () => {
    console.log(`\nCompiled ${name} script!`)

    if (firstTime) {
      firstTime = false
    } else {
      manualRestart = true
      await restartElectron()
      setTimeout(() => {
        manualRestart = false
      }, 2500)
    }

    console.log(`\nWatching file changes for ${name} script...`)
  })

  compiler.watch({
    aggregateTimeout: 500,
  },
  err => {
    if (err) console.error(err)
  })
}

function startRenderer(callback) {
  const compiler = webpack(rendererConfig)
  const { name } = compiler

  compiler.hooks.afterEmit.tap('afterEmit', () => {
    console.log(`\nCompiled ${name} script!`)
    console.log(`\nWatching file changes for ${name} script...`)
  })

  const server = new WebpackDevServer({
    client: {
      overlay: {
        runtimeErrors: false
      }
    },
    static: [
      {
        directory: path.resolve(__dirname, '..', 'static'),
        watch: {
          ignored: [
            /(dashFiles|storyboards)\/*/,
            '/**/.DS_Store',
            '**/static/locales/*'
          ]
        },
        publicPath: '/static'
      },
      {
        directory: path.resolve(__dirname, '..', 'node_modules', 'shaka-player', 'ui', 'locales'),
        publicPath: '/static/shaka-player-locales',
        watch: {
          // Ignore everything that isn't one of the locales that we would bundle in production mode
          ignored: `**/!(${SHAKA_LOCALES_TO_BE_BUNDLED.join('|')}).json`
        }
      }
    ],
    port
  }, compiler)

  server.startCallback(err => {
    if (err) console.error(err)

    setupNotifyLocaleUpdate(compiler, server)

    callback()
  })
}

function startWeb () {
  const compiler = webpack(webConfig)
  const { name } = compiler

  compiler.hooks.afterEmit.tap('afterEmit', () => {
    console.log(`\nCompiled ${name} script!`)
    console.log(`\nWatching file changes for ${name} script...`)
  })

  const server = new WebpackDevServer({
    open: true,
    static: {
      directory: path.resolve(__dirname, '..', 'static'),
      watch: {
        ignored: [
          /(dashFiles|storyboards)\/*/,
          '/**/.DS_Store',
          '**/static/locales/*'
        ]
      }
    },
    port
  }, compiler)

  server.startCallback(err => {
    if (err) console.error(err)

    setupNotifyLocaleUpdate(compiler, server)
  })
}
if (!web) {
  startRenderer(() => {
    startBotGuardScript()
    startPreload()
    startMain()
  })
} else {
  startWeb()
}
