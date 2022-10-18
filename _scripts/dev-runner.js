process.env.NODE_ENV = 'development'

const open = require('open')
const electron = require('electron')
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const kill = require('tree-kill')

const path = require('path')
const { spawn } = require('child_process')

const mainConfig = require('./webpack.main.config')
const rendererConfig = require('./webpack.renderer.config')
const webConfig = require('./webpack.web.config')
const workersConfig = require('./webpack.workers.config')

let electronProcess = null
let manualRestart = null

const remoteDebugging = process.argv.indexOf('--remote-debug') !== -1
const web = process.argv.indexOf('--web') !== -1

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
    // '--enable-logging', Enable to show logs from all electron processes
    remoteDebugging ? '--inspect=9222' : '',
    remoteDebugging ? '--remote-debugging-port=9223' : '',
  ])

  electronProcess.on('exit', (code, _) => {
    if (code === relaunchExitCode) {
      electronProcess = null
      restartElectron()
      return
    }

    if (!manualRestart) process.exit(0)
  })
}

function startMain() {
  const webpackSetup = webpack([mainConfig, workersConfig])

  webpackSetup.compilers.forEach(compiler => {
    const { name } = compiler

    switch (name) {
      case 'workers':
        compiler.hooks.afterEmit.tap('afterEmit', async () => {
          console.log(`\nCompiled ${name} script!`)
          console.log(`\nWatching file changes for ${name} script...`)
        })
        break
      case 'main':
      default:
        compiler.hooks.afterEmit.tap('afterEmit', async () => {
          console.log(`\nCompiled ${name} script!`)

          manualRestart = true
          await restartElectron()
          setTimeout(() => {
            manualRestart = false
          }, 2500)

          console.log(`\nWatching file changes for ${name} script...`)
        })
        break
    }
  })

  webpackSetup.watch({
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
    static: {
      directory: path.join(process.cwd(), 'static'),
      watch: {
        ignored: [
          /(dashFiles|storyboards)\/*/,
          '/**/.DS_Store',
        ]
      }
    },
    port
  }, compiler)

  server.startCallback(err => {
    if (err) console.error(err)

    callback()
  })
}

function startWeb (callback) {
  const compiler = webpack(webConfig)
  const { name } = compiler

  compiler.hooks.afterEmit.tap('afterEmit', () => {
    console.log(`\nCompiled ${name} script!`)
    console.log(`\nWatching file changes for ${name} script...`)
  })

  const server = new WebpackDevServer({
    static: {
      directory: path.join(process.cwd(), 'dist/web/static'),
      watch: {
        ignored: [
          /(dashFiles|storyboards)\/*/,
          '/**/.DS_Store',
        ]
      }
    },
    port
  }, compiler)

  server.startCallback(err => {
    if (err) console.error(err)

    callback({ port: server.options.port })
  })
}
if (!web) {
  startRenderer(startMain)
} else {
  startWeb(({ port }) => {
    open(`http://localhost:${port}`)
  })
}
