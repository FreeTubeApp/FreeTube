import {
  app, BrowserWindow, dialog, Menu, ipcMain,
  powerSaveBlocker, screen, session, shell
} from 'electron'
import Datastore from 'nedb-promises'
import path from 'path'
import cp from 'child_process'

if (process.argv.includes('--version')) {
  console.log(`v${app.getVersion()}`)
  app.exit()
} else {
  runApp()
}

function runApp() {
  require('electron-context-menu')({
    showSearchWithGoogle: false,
    showSaveImageAs: true,
    showCopyImageAddress: true,
    prepend: (params, browserWindow) => []
  })

  const localDataStorage = app.getPath('userData') // Grabs the userdata directory based on the user's OS

  const settingsDb = Datastore.create({
    filename: localDataStorage + '/settings.db',
    autoload: true
  })

  // disable electron warning
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
  const isDev = process.env.NODE_ENV === 'development'
  const isDebug = process.argv.includes('--debug')
  let mainWindow
  let startupUrl

  // CORS somehow gets re-enabled in Electron v9.0.4
  // This line disables it.
  // This line can possible be removed if the issue is fixed upstream
  app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors')

  app.commandLine.appendSwitch('enable-accelerated-video-decode')
  app.commandLine.appendSwitch('enable-file-cookies')
  app.commandLine.appendSwitch('ignore-gpu-blacklist')

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

  if (!isDev) {
    // Only allow single instance of the application
    const gotTheLock = app.requestSingleInstanceLock()
    if (!gotTheLock) {
      app.quit()
    }

    app.on('second-instance', (_, commandLine, __) => {
      // Someone tried to run a second instance, we should focus our window
      if (mainWindow && typeof commandLine !== 'undefined') {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.focus()

        const url = getLinkUrl(commandLine)
        if (url) {
          mainWindow.webContents.send('openUrl', url)
        }
      }
    })
  } else {
    require('electron-debug')({
      showDevTools: !(process.env.RENDERER_REMOTE_DEBUGGING === 'true')
    })
  }

  app.on('ready', async (_, __) => {
    let docArray
    try {
      docArray = await settingsDb.find({
        $or: [
          { _id: 'disableSmoothScrolling' },
          { _id: 'useProxy' },
          { _id: 'proxyProtocol' },
          { _id: 'proxyHostname' },
          { _id: 'proxyPort' }
        ]
      })
    } catch (err) {
      console.error(err)
      app.exit()
      return
    }

    let disableSmoothScrolling = false
    let useProxy = false
    let proxyProtocol = 'socks5'
    let proxyHostname = '127.0.0.1'
    let proxyPort = '9050'

    if (docArray?.length > 0) {
      docArray.forEach((doc) => {
        switch (doc._id) {
          case 'disableSmoothScrolling':
            disableSmoothScrolling = doc.value
            break
          case 'useProxy':
            useProxy = doc.value
            break
          case 'proxyProtocol':
            proxyProtocol = doc.value
            break
          case 'proxyHostname':
            proxyHostname = doc.value
            break
          case 'proxyPort':
            proxyPort = doc.value
            break
        }
      })
    }

    if (disableSmoothScrolling) {
      app.commandLine.appendSwitch('disable-smooth-scrolling')
    } else {
      app.commandLine.appendSwitch('enable-smooth-scrolling')
    }

    if (useProxy) {
      session.defaultSession.setProxy({
        proxyRules: `${proxyProtocol}://${proxyHostname}:${proxyPort}`
      })
    }

    // Set CONSENT cookie on reasonable domains
    const consentCookieDomains = [
      'http://www.youtube.com',
      'https://www.youtube.com',
      'http://youtube.com',
      'https://youtube.com'
    ]
    consentCookieDomains.forEach(url => {
      session.defaultSession.cookies.set({
        url: url,
        name: 'CONSENT',
        value: 'YES+'
      })
    })

    await createWindow()

    if (isDev) {
      installDevTools()
    }

    if (isDebug) {
      mainWindow.webContents.openDevTools()
    }
  })

  async function installDevTools() {
    try {
      /* eslint-disable */
      require('vue-devtools').install()
      /* eslint-enable */
    } catch (err) {
      console.log(err)
    }
  }

  async function createWindow(replaceMainWindow = true) {
    /**
     * Initial window options
     */
    const commonBrowserWindowOptions = {
      backgroundColor: '#212121',
      icon: isDev
        ? path.join(__dirname, '../../_icons/iconColor.png')
        /* eslint-disable-next-line */
        : `${__dirname}/_icons/iconColor.png`,
      autoHideMenuBar: true,
      // useContentSize: true,
      webPreferences: {
        nodeIntegration: true,
        nodeIntegrationInWorker: false,
        webSecurity: false,
        backgroundThrottling: false,
        contextIsolation: false
      }
    }
    const newWindow = new BrowserWindow(
      Object.assign(
        {
          // It will be shown later when ready via `ready-to-show` event
          show: false
        },
        commonBrowserWindowOptions
      )
    )

    // region Ensure child windows use same options since electron 14

    // https://github.com/electron/electron/blob/14-x-y/docs/api/window-open.md#native-window-example
    newWindow.webContents.setWindowOpenHandler(() => {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: Object.assign(
          {
            // It should be visible on click
            show: true
          },
          commonBrowserWindowOptions
        )
      }
    })

    // endregion Ensure child windows use same options since electron 14

    if (replaceMainWindow) {
      mainWindow = newWindow
    }

    newWindow.setBounds({
      width: 1200,
      height: 800
    })

    const boundsDoc = await settingsDb.findOne({ _id: 'bounds' })
    if (typeof boundsDoc?.value === 'object') {
      const { maximized, ...bounds } = boundsDoc.value
      const allDisplaysSummaryWidth = screen
        .getAllDisplays()
        .reduce((accumulator, { size: { width } }) => accumulator + width, 0)

      if (allDisplaysSummaryWidth >= bounds.x) {
        newWindow.setBounds({
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height
        })
      }
      if (maximized) {
        newWindow.maximize()
      }
    }

    // If called multiple times
    // Duplicate menu items will be added
    if (replaceMainWindow) {
      // eslint-disable-next-line
      setMenu()
    }

    // load root file/url
    if (isDev) {
      newWindow.loadURL('http://localhost:9080')
    } else {
      /* eslint-disable-next-line */
      newWindow.loadFile(`${__dirname}/index.html`)

      global.__static = path
        .join(__dirname, '/static')
        .replace(/\\/g, '\\\\')
    }

    // Show when loaded
    newWindow.once('ready-to-show', () => {
      newWindow.show()
      newWindow.focus()
    })

    newWindow.once('close', async () => {
      if (BrowserWindow.getAllWindows().length !== 1) {
        return
      }

      const value = {
        ...newWindow.getNormalBounds(),
        maximized: newWindow.isMaximized()
      }

      await settingsDb.update(
        { _id: 'bounds' },
        { _id: 'bounds', value },
        { upsert: true }
      )
    })

    newWindow.once('closed', () => {
      const allWindows = BrowserWindow.getAllWindows()
      if (allWindows.length !== 0 && newWindow === mainWindow) {
        // Replace mainWindow to avoid accessing `mainWindow.webContents`
        // Which raises "Object has been destroyed" error
        mainWindow = allWindows[0]
      }

      console.log('closed')
    })
  }

  ipcMain.once('appReady', () => {
    if (startupUrl) {
      mainWindow.webContents.send('openUrl', startupUrl)
    }
  })

  ipcMain.once('relaunchRequest', () => {
    if (isDev) {
      app.exit(parseInt(process.env.FREETUBE_RELAUNCH_EXIT_CODE))
      return
    }

    // The AppImage and Windows portable formats must be accounted for
    // because `process.execPath` points at the temporarily extracted
    // executables, not the executables themselves
    //
    // It's possible to detect these formats and identify their
    // executables' paths by checking the environmental variables
    const { env: { APPIMAGE, PORTABLE_EXECUTABLE_FILE } } = process

    if (!APPIMAGE) {
      // If it's a Windows portable, PORTABLE_EXECUTABLE_FILE will
      // hold a value.
      // Otherwise, `process.execPath` should be used instead.
      app.relaunch({
        args: process.argv.slice(1),
        execPath: PORTABLE_EXECUTABLE_FILE || process.execPath
      })
    } else {
      // If it's an AppImage, things must be done the "hard way"
      // `app.relaunch` doesn't work because of FUSE limitations
      // Spawn a new process using the APPIMAGE env variable
      const subprocess = cp.spawn(APPIMAGE, { detached: true, stdio: 'ignore' })
      subprocess.unref()
    }

    app.quit()
  })

  ipcMain.on('enableProxy', (_, url) => {
    console.log(url)
    session.defaultSession.setProxy({
      proxyRules: url
    })
  })

  ipcMain.on('disableProxy', () => {
    session.defaultSession.setProxy({})
  })

  ipcMain.on('openExternalLink', (_, url) => {
    if (typeof url === 'string') shell.openExternal(url)
  })

  ipcMain.handle('getSystemLocale', () => {
    return app.getLocale()
  })

  ipcMain.handle('getUserDataPath', () => {
    return app.getPath('userData')
  })

  ipcMain.on('getUserDataPathSync', (event) => {
    event.returnValue = app.getPath('userData')
  })

  ipcMain.handle('showOpenDialog', async (_, options) => {
    return await dialog.showOpenDialog(options)
  })

  ipcMain.handle('showSaveDialog', async (_, options) => {
    return await dialog.showSaveDialog(options)
  })

  ipcMain.on('stopPowerSaveBlocker', (_, id) => {
    powerSaveBlocker.stop(id)
  })

  ipcMain.handle('startPowerSaveBlocker', (_, type) => {
    return powerSaveBlocker.start(type)
  })

  ipcMain.on('createNewWindow', () => {
    createWindow(false)
  })

  ipcMain.on('syncWindows', (event, payload) => {
    const otherWindows = BrowserWindow.getAllWindows().filter(
      (window) => {
        return window.webContents.id !== event.sender.id
      }
    )

    for (const window of otherWindows) {
      window.webContents.send('syncWindows', payload)
    }
  })

  ipcMain.on('openInExternalPlayer', (_, payload) => {
    const child = cp.spawn(payload.executable, payload.args, { detached: true, stdio: 'ignore' })
    child.unref()
  })

  app.once('window-all-closed', () => {
    // Clear cache and storage if it's the last window
    session.defaultSession.clearCache()
    session.defaultSession.clearStorageData({
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

    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
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
   * Check if an argument was passed and send it over to the GUI (Linux / Windows).
   * Remove freetube:// protocol if present
   */
  const url = getLinkUrl(process.argv)
  if (url) {
    startupUrl = url
  }

  function baseUrl(arg) {
    return arg.replace('freetube://', '')
  }

  function getLinkUrl(argv) {
    if (argv.length > 1) {
      return baseUrl(argv[argv.length - 1])
    } else {
      return null
    }
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

  function setMenu() {
    const template = [
      {
        label: 'File',
        submenu: [{ role: 'quit' }]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'cut' },
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
          { role: 'pasteandmatchstyle' },
          { role: 'delete' },
          { role: 'selectall' }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          {
            role: 'forcereload',
            accelerator: 'CmdOrCtrl+Shift+R'
          },
          { role: 'toggledevtools' },
          { type: 'separator' },
          { role: 'resetzoom' },
          { role: 'zoomin' },
          { role: 'zoomout' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        role: 'window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' }
        ]
      }
    ]

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

      template.push(
        { role: 'window' },
        { role: 'help' },
        { role: 'services' }
      )
    }

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  }
}
