import { app, BrowserWindow, Menu, ipcMain, screen } from 'electron'
import { productName } from '../../package.json'
import Datastore from 'nedb'

require('electron-context-menu')({
  showSearchWithGoogle: false,
  showSaveImageAs: true,
  showCopyImageAddress: true,
  prepend: (params, browserWindow) => []
})

const localDataStorage = app.getPath('userData') // Grabs the userdata directory based on the user's OS

const settingsDb = new Datastore({
  filename: localDataStorage + '/settings.db',
  autoload: true
})

// set app name
app.setName(productName)

// disable electron warning
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
const path = require('path')
const isDev = process.env.NODE_ENV === 'development'
const isDebug = process.argv.includes('--debug')
let mainWindow
let startupUrl

// CORS somehow gets re-enabled in Electron v9.0.4
// This line disables it.
// This line can possible be removed if the issue is fixed upstream
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors')

// See: https://stackoverflow.com/questions/45570589/electron-protocol-handler-not-working-on-windows
// remove so we can register each time as we run the app.
app.removeAsDefaultProtocolClient('freetube')

// If we are running a non-packaged version of the app && on windows
if (isDev && process.platform === 'win32') {
  // Set the path of electron.exe and your app.
  // These two additional parameters are only available on windows.
  app.setAsDefaultProtocolClient('freetube', process.execPath, [path.resolve(process.argv[1])])
} else {
  app.setAsDefaultProtocolClient('freetube')
}

// TODO: Uncomment if needed
// only allow single instance of application
if (!isDev) {
  const gotTheLock = app.requestSingleInstanceLock()

  if (gotTheLock) {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      // Someone tried to run a second instance, we should focus our window.
      if (mainWindow && typeof (commandLine) !== 'undefined') {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.focus()

        const url = getLinkUrl(commandLine)
        if (url) {
          mainWindow.webContents.send('openUrl', url)
        }
      }
    })

    app.on('ready', (event, commandLine, workingDirectory) => {
      settingsDb.findOne({
        _id: 'disableSmoothScrolling'
      }, function (err, doc) {
        if (err) {
          app.exit(0)
          return
        }

        if (doc !== null && doc.value) {
          app.commandLine.appendSwitch('disable-smooth-scrolling')
        } else {
          app.commandLine.appendSwitch('enable-smooth-scrolling')
        }

        createWindow()

        if (isDev) {
          installDevTools()
        }

        if (isDebug) {
          mainWindow.webContents.openDevTools()
        }
      })
    })
  } else {
    app.quit()
  }
} else {
  require('electron-debug')({
    showDevTools: !(process.env.RENDERER_REMOTE_DEBUGGING === 'true')
  })

  app.on('ready', () => {
    settingsDb.findOne({
      _id: 'disableSmoothScrolling'
    }, function (err, doc) {
      if (err) {
        app.exit(0)
        return
      }

      if (doc !== null && doc.value) {
        app.commandLine.appendSwitch('disable-smooth-scrolling')
      } else {
        app.commandLine.appendSwitch('enable-smooth-scrolling')
      }

      createWindow()

      if (isDev) {
        installDevTools()
      }

      if (isDebug) {
        mainWindow.webContents.openDevTools()
      }
    })
  })
}

async function installDevTools () {
  try {
    /* eslint-disable */
    require('devtron').install()
    require('vue-devtools').install()
    /* eslint-enable */
  } catch (err) {
    console.log(err)
  }
}

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    backgroundColor: '#fff',
    icon: isDev
      ? path.join(__dirname, '../../_icons/iconColor.png')
      : `${__dirname}/_icons/iconColor.png`,
    autoHideMenuBar: true,
    // useContentSize: true,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: false,
      webSecurity: false,
      backgroundThrottling: false,
      enableRemoteModule: true
    },
    show: false
  })

  mainWindow.setBounds({
    width: 1200,
    height: 800
  })

  settingsDb.findOne({
    _id: 'bounds'
  }, function (err, doc) {
    if (doc === null || err) {
      return
    }

    if (typeof doc !== 'object' || typeof doc.value !== 'object') {
      return
    }

    const { maximized, ...bounds } = doc.value
    const allDisplaysSummaryWidth = screen
      .getAllDisplays()
      .reduce((accumulator, { size: { width } }) => accumulator + width, 0)

    if (allDisplaysSummaryWidth >= bounds.x) {
      mainWindow.setBounds({
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height
      })
    }
    if (maximized) {
      mainWindow.maximize()
    }
  })

  // eslint-disable-next-line
  setMenu()

  // load root file/url
  if (isDev) {
    mainWindow.loadURL('http://localhost:9080')
  } else {
    mainWindow.loadFile(`${__dirname}/index.html`)

    global.__static = path
      .join(__dirname, '/static')
      .replace(/\\/g, '\\\\')
  }

  // Show when loaded
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  mainWindow.on('closed', () => {
    console.log('closed')
  })

  ipcMain.on('setBounds', (_e, data) => {
    const value = {
      ...mainWindow.getBounds(),
      maximized: mainWindow.isMaximized()
    }

    settingsDb.findOne({
      _id: 'bounds'
    }, function (err, doc) {
      if (err) {
        return
      }
      if (doc !== null) {
        settingsDb.update({
          _id: 'bounds'
        }, {
          $set: {
            value
          }
        }, {})
      } else {
        settingsDb.insert({
          _id: 'bounds',
          value
        })
      }
    })
  })

  ipcMain.on('appReady', () => {
    if (startupUrl) {
      mainWindow.webContents.send('openUrl', startupUrl)
    }
  })

  ipcMain.on('disableSmoothScrolling', () => {
    app.commandLine.appendSwitch('disable-smooth-scrolling')
    mainWindow.close()
    createWindow()
  })

  ipcMain.on('enableSmoothScrolling', () => {
    app.commandLine.appendSwitch('enable-smooth-scrolling')
    mainWindow.close()
    createWindow()
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }

  mainWindow.webContents.session.clearCache()
  mainWindow.webContents.session.clearStorageData({
    storages: [
      'appcache',
      'cookies',
      'filesystem',
      'indexdb',
      'shadercache',
      'websql',
      'serviceworkers',
      'cachestorage'
    ]
  })
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

/*
 * Callback when processing a freetube:// link (macOS)
 */
app.on('open-url', (event, url) => {
  event.preventDefault()

  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('openUrl', baseUrl(url))
  } else {
    startupUrl = baseUrl(url)
  }
})

/*
 * Check if we were passed a freetube:// URL on process startup (linux/win)
 */
const url = getLinkUrl(process.argv)
if (url) {
  startupUrl = url
}

function baseUrl(arg) {
  return arg.replace('freetube://', '')
}

function getLinkUrl(argv) {
  for (const arg of argv) {
    if (arg.indexOf('freetube://') !== -1) {
      return baseUrl(arg)
    }
  }
  return null
}

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'
autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */

/* eslint-disable-next-line */
const sendMenuEvent = async data => {
  mainWindow.webContents.send('change-view', data)
}

const template = [{
  label: 'File',
  submenu: [
    {
      role: 'quit'
    }
  ]
},
{
  label: 'Edit',
  submenu: [{
    role: 'cut'
  },
  {
    role: 'copy',
    accelerator: 'CmdOrCtrl+C',
    selector: 'copy:'
  },
  {
    role: 'paste',
    accelerator: 'CmdOrCtrl+V',
    selector: 'paste:'
  },
  {
    role: 'pasteandmatchstyle'
  },
  {
    role: 'delete'
  },
  {
    role: 'selectall'
  }
  ]
},
{
  label: 'View',
  submenu: [{
    role: 'reload'
  },
  {
    role: 'forcereload',
    accelerator: 'CmdOrCtrl+Shift+R'
  },
  {
    role: 'toggledevtools'
  },
  {
    type: 'separator'
  },
  {
    role: 'resetzoom'
  },
  {
    role: 'zoomin'
  },
  {
    role: 'zoomout'
  },
  {
    type: 'separator'
  },
  {
    role: 'togglefullscreen'
  }
  ]
},
{
  role: 'window',
  submenu: [{
    role: 'minimize'
  },
  {
    role: 'close'
  }
  ]
}
]

function setMenu () {
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    })

    template.push({
      role: 'window'
    })

    template.push({
      role: 'help'
    })

    template.push({ role: 'services' })
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
