import {
  app, BrowserWindow, dialog, Menu, ipcMain,
  powerSaveBlocker, screen, session, shell, nativeTheme, net, protocol
} from 'electron'
import path from 'path'
import cp from 'child_process'

import { IpcChannels, DBActions, SyncEvents } from '../constants'
import baseHandlers from '../datastores/handlers/base'
import { extractExpiryTimestamp, ImageCache } from './ImageCache'
import { existsSync } from 'fs'

if (process.argv.includes('--version')) {
  app.exit()
} else {
  runApp()
}

function runApp() {
  require('electron-context-menu')({
    showSearchWithGoogle: false,
    showSaveImageAs: true,
    showCopyImageAddress: true,
    showSelectAll: false,
    prepend: (defaultActions, parameters, browserWindow) => [
      {
        label: 'Show / Hide Video Statistics',
        visible: parameters.mediaType === 'video',
        click: () => {
          browserWindow.webContents.send('showVideoStatistics')
        }
      },
      {
        label: 'Open in a New Window',
        // Only show the option for in-app URLs and not external ones
        visible: parameters.linkURL.split('#')[0] === browserWindow.webContents.getURL().split('#')[0],
        click: () => {
          createWindow({ replaceMainWindow: false, windowStartupUrl: parameters.linkURL, showWindowNow: true })
        }
      },
      // Only show select all in text fields
      {
        label: 'Select All',
        enabled: parameters.editFlags.canSelectAll,
        visible: parameters.isEditable,
        click: () => {
          browserWindow.webContents.selectAll()
        }
      }
    ]
  })

  // disable electron warning
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
  const isDebug = process.argv.includes('--debug')

  let mainWindow
  let startupUrl

  app.commandLine.appendSwitch('enable-accelerated-video-decode')
  app.commandLine.appendSwitch('enable-file-cookies')
  app.commandLine.appendSwitch('ignore-gpu-blacklist')

  // command line switches need to be added before the app ready event first
  // that means we can't use the normal settings system as that is asynchonous,
  // doing it synchronously ensures that we add it before the event fires
  const replaceHttpCache = existsSync(`${app.getPath('userData')}/experiment-replace-http-cache`)
  if (replaceHttpCache) {
    // the http cache causes excessive disk usage during video playback
    // we've got a custom image cache to make up for disabling the http cache
    // experimental as it increases RAM use in favour of reduced disk use
    app.commandLine.appendSwitch('disable-http-cache')
  }

  // See: https://stackoverflow.com/questions/45570589/electron-protocol-handler-not-working-on-windows
  // remove so we can register each time as we run the app.
  app.removeAsDefaultProtocolClient('freetube')

  // If we are running a non-packaged version of the app && on windows
  if (process.env.NODE_ENV === 'development' && process.platform === 'win32') {
    // Set the path of electron.exe and your app.
    // These two additional parameters are only available on windows.
    app.setAsDefaultProtocolClient('freetube', process.execPath, [path.resolve(process.argv[1])])
  } else {
    app.setAsDefaultProtocolClient('freetube')
  }

  if (process.env.NODE_ENV !== 'development') {
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
  }

  app.on('ready', async (_, __) => {
    let docArray
    try {
      docArray = await baseHandlers.settings._findAppReadyRelatedSettings()
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
        value: 'YES+',
        sameSite: 'no_restriction'
      })
    })

    // make InnerTube requests work with the fetch function
    // InnerTube rejects requests if the referer isn't YouTube or empty
    const innertubeRequestFilter = { urls: ['https://www.youtube.com/youtubei/*'] }

    session.defaultSession.webRequest.onBeforeSendHeaders(innertubeRequestFilter, ({ requestHeaders }, callback) => {
      requestHeaders.referer = 'https://www.youtube.com'
      // eslint-disable-next-line node/no-callback-literal
      callback({ requestHeaders })
    })

    if (replaceHttpCache) {
      // in-memory image cache

      const imageCache = new ImageCache()

      protocol.registerBufferProtocol('imagecache', (request, callback) => {
        // Remove `imagecache://` prefix
        const url = decodeURIComponent(request.url.substring(13))
        if (imageCache.has(url)) {
          const cached = imageCache.get(url)

          // eslint-disable-next-line node/no-callback-literal
          callback({
            mimeType: cached.mimeType,
            data: cached.data
          })
          return
        }

        const newRequest = net.request({
          method: request.method,
          url
        })

        // Electron doesn't allow certain headers to be set:
        // https://www.electronjs.org/docs/latest/api/client-request#requestsetheadername-value
        // also blacklist Origin and Referrer as we don't want to let YouTube know about them
        const blacklistedHeaders = ['content-length', 'host', 'trailer', 'te', 'upgrade', 'cookie2', 'keep-alive', 'transfer-encoding', 'origin', 'referrer']

        for (const header of Object.keys(request.headers)) {
          if (!blacklistedHeaders.includes(header.toLowerCase())) {
            newRequest.setHeader(header, request.headers[header])
          }
        }

        newRequest.on('response', (response) => {
          const chunks = []
          response.on('data', (chunk) => {
            chunks.push(chunk)
          })

          response.on('end', () => {
            const data = Buffer.concat(chunks)

            const expiryTimestamp = extractExpiryTimestamp(response.headers)
            const mimeType = response.headers['content-type']

            imageCache.add(url, mimeType, data, expiryTimestamp)

            // eslint-disable-next-line node/no-callback-literal
            callback({
              mimeType,
              data: data
            })
          })

          response.on('error', (error) => {
            console.error('image cache error', error)

            // error objects don't get serialised properly
            // https://stackoverflow.com/a/53624454

            const errorJson = JSON.stringify(error, (key, value) => {
              if (value instanceof Error) {
                return {
                  // Pull all enumerable properties, supporting properties on custom Errors
                  ...value,
                  // Explicitly pull Error's non-enumerable properties
                  name: value.name,
                  message: value.message,
                  stack: value.stack
                }
              }

              return value
            })

            // eslint-disable-next-line node/no-callback-literal
            callback({
              statusCode: response.statusCode ?? 400,
              mimeType: 'application/json',
              data: Buffer.from(errorJson)
            })
          })
        })

        newRequest.on('error', (err) => {
          console.error(err)
        })

        newRequest.end()
      })

      const imageRequestFilter = { urls: ['https://*/*', 'http://*/*'] }
      session.defaultSession.webRequest.onBeforeRequest(imageRequestFilter, (details, callback) => {
        // the requests made by the imagecache:// handler to fetch the image,
        // are allowed through, as their resourceType is 'other'
        if (details.resourceType === 'image') {
          // eslint-disable-next-line node/no-callback-literal
          callback({
            redirectURL: `imagecache://${encodeURIComponent(details.url)}`
          })
        } else {
          // eslint-disable-next-line node/no-callback-literal
          callback({})
        }
      })

      // --- end of `if experimentsDisableDiskCache` ---
    }

    await createWindow()

    if (process.env.NODE_ENV === 'development') {
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
      console.error(err)
    }
  }

  async function createWindow(
    {
      replaceMainWindow = true,
      windowStartupUrl = null,
      showWindowNow = false,
      searchQueryText = null
    } = { }) {
    // Syncing new window background to theme choice.
    const windowBackground = await baseHandlers.settings._findTheme().then(({ value }) => {
      switch (value) {
        case 'dark':
          return '#212121'
        case 'light':
          return '#f1f1f1'
        case 'black':
          return '#000000'
        case 'dracula':
          return '#282a36'
        case 'catppuccin-mocha':
          return '#1e1e2e'
        case 'system':
        default:
          return nativeTheme.shouldUseDarkColors ? '#212121' : '#f1f1f1'
      }
    }).catch((error) => {
      console.error(error)
      // Default to nativeTheme settings if nothing is found.
      return nativeTheme.shouldUseDarkColors ? '#212121' : '#f1f1f1'
    })

    /**
     * Initial window options
     */
    const commonBrowserWindowOptions = {
      backgroundColor: windowBackground,
      darkTheme: nativeTheme.shouldUseDarkColors,
      icon: process.env.NODE_ENV === 'development'
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
          show: showWindowNow
        },
        commonBrowserWindowOptions
      )
    )

    // region Ensure child windows use same options since electron 14

    // https://github.com/electron/electron/blob/14-x-y/docs/api/window-open.md#native-window-example
    newWindow.webContents.setWindowOpenHandler((details) => {
      createWindow({
        replaceMainWindow: false,
        showWindowNow: true,
        windowStartupUrl: details.url
      })
      return {
        action: 'deny'
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

    const boundsDoc = await baseHandlers.settings._findBounds()
    if (typeof boundsDoc?.value === 'object') {
      const { maximized, fullScreen, ...bounds } = boundsDoc.value
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

      if (fullScreen) {
        newWindow.setFullScreen(true)
      }
    }

    // If called multiple times
    // Duplicate menu items will be added
    if (replaceMainWindow) {
      // eslint-disable-next-line
      setMenu()
    }

    // load root file/url
    if (process.env.NODE_ENV === 'development') {
      let devStartupURL = 'http://localhost:9080'
      if (windowStartupUrl != null) {
        devStartupURL = windowStartupUrl
      }
      newWindow.loadURL(devStartupURL)
    } else {
      if (windowStartupUrl != null) {
        newWindow.loadURL(windowStartupUrl)
      } else {
        /* eslint-disable-next-line */
        newWindow.loadFile(`${__dirname}/index.html`)
      }
    }

    if (typeof searchQueryText === 'string' && searchQueryText.length > 0) {
      ipcMain.once('searchInputHandlingReady', () => {
        newWindow.webContents.send('updateSearchInputText', searchQueryText)
      })
    }

    // Show when loaded
    newWindow.once('ready-to-show', () => {
      if (newWindow.isVisible()) {
        // only open the dev tools if they aren't already open
        if (process.env.NODE_ENV === 'development' && !newWindow.webContents.isDevToolsOpened()) {
          newWindow.webContents.openDevTools({ activate: false })
        }
        return
      }

      newWindow.show()
      newWindow.focus()

      if (process.env.NODE_ENV === 'development') {
        newWindow.webContents.openDevTools({ activate: false })
      }
    })

    newWindow.once('close', async () => {
      if (BrowserWindow.getAllWindows().length !== 1) {
        return
      }

      const value = {
        ...newWindow.getNormalBounds(),
        maximized: newWindow.isMaximized(),
        fullScreen: newWindow.isFullScreen()
      }

      await baseHandlers.settings._updateBounds(value)
    })

    newWindow.once('closed', () => {
      const allWindows = BrowserWindow.getAllWindows()
      if (allWindows.length !== 0 && newWindow === mainWindow) {
        // Replace mainWindow to avoid accessing `mainWindow.webContents`
        // Which raises "Object has been destroyed" error
        mainWindow = allWindows[0]
      }
    })
  }

  ipcMain.once('appReady', () => {
    if (startupUrl) {
      mainWindow.webContents.send('openUrl', startupUrl)
    }
  })

  ipcMain.once('relaunchRequest', () => {
    if (process.env.NODE_ENV === 'development') {
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

  nativeTheme.on('updated', () => {
    const allWindows = BrowserWindow.getAllWindows()

    allWindows.forEach((window) => {
      window.webContents.send(IpcChannels.NATIVE_THEME_UPDATE, nativeTheme.shouldUseDarkColors)
    })
  })

  ipcMain.on(IpcChannels.ENABLE_PROXY, (_, url) => {
    session.defaultSession.setProxy({
      proxyRules: url
    })
  })

  ipcMain.on(IpcChannels.DISABLE_PROXY, () => {
    session.defaultSession.setProxy({})
  })

  ipcMain.on(IpcChannels.OPEN_EXTERNAL_LINK, (_, url) => {
    if (typeof url === 'string') shell.openExternal(url)
  })

  ipcMain.handle(IpcChannels.GET_SYSTEM_LOCALE, () => {
    return app.getLocale()
  })

  ipcMain.handle(IpcChannels.GET_USER_DATA_PATH, () => {
    return app.getPath('userData')
  })

  ipcMain.on(IpcChannels.GET_USER_DATA_PATH_SYNC, (event) => {
    event.returnValue = app.getPath('userData')
  })

  ipcMain.handle(IpcChannels.GET_PICTURES_PATH, () => {
    return app.getPath('pictures')
  })

  ipcMain.handle(IpcChannels.SHOW_OPEN_DIALOG, async ({ sender }, options) => {
    const senderWindow = findSenderWindow(sender)
    if (senderWindow) {
      return await dialog.showOpenDialog(senderWindow, options)
    }
    return await dialog.showOpenDialog(options)
  })

  ipcMain.handle(IpcChannels.SHOW_SAVE_DIALOG, async ({ sender }, options) => {
    const senderWindow = findSenderWindow(sender)
    if (senderWindow) {
      return await dialog.showSaveDialog(senderWindow, options)
    }
    return await dialog.showSaveDialog(options)
  })

  function findSenderWindow(sender) {
    return BrowserWindow.getAllWindows().find((window) => {
      return window.webContents.id === sender.id
    })
  }

  ipcMain.on(IpcChannels.STOP_POWER_SAVE_BLOCKER, (_, id) => {
    powerSaveBlocker.stop(id)
  })

  ipcMain.handle(IpcChannels.START_POWER_SAVE_BLOCKER, (_) => {
    return powerSaveBlocker.start('prevent-display-sleep')
  })

  ipcMain.on(IpcChannels.CREATE_NEW_WINDOW, (_e, { windowStartupUrl = null, searchQueryText = null } = { }) => {
    createWindow({
      replaceMainWindow: false,
      showWindowNow: true,
      windowStartupUrl: windowStartupUrl,
      searchQueryText: searchQueryText
    })
  })

  ipcMain.on(IpcChannels.OPEN_IN_EXTERNAL_PLAYER, (_, payload) => {
    const child = cp.spawn(payload.executable, payload.args, { detached: true, stdio: 'ignore' })
    child.unref()
  })

  // ************************************************* //
  // DB related IPC calls
  // *********** //

  // Settings
  ipcMain.handle(IpcChannels.DB_SETTINGS, async (event, { action, data }) => {
    try {
      switch (action) {
        case DBActions.GENERAL.FIND:
          return await baseHandlers.settings.find()

        case DBActions.GENERAL.UPSERT:
          await baseHandlers.settings.upsert(data._id, data.value)
          syncOtherWindows(
            IpcChannels.SYNC_SETTINGS,
            event,
            { event: SyncEvents.GENERAL.UPSERT, data }
          )
          return null

        default:
          // eslint-disable-next-line no-throw-literal
          throw 'invalid settings db action'
      }
    } catch (err) {
      if (typeof err === 'string') throw err
      else throw err.toString()
    }
  })

  // *********** //
  // History
  ipcMain.handle(IpcChannels.DB_HISTORY, async (event, { action, data }) => {
    try {
      switch (action) {
        case DBActions.GENERAL.FIND:
          return await baseHandlers.history.find()

        case DBActions.GENERAL.UPSERT:
          await baseHandlers.history.upsert(data)
          syncOtherWindows(
            IpcChannels.SYNC_HISTORY,
            event,
            { event: SyncEvents.GENERAL.UPSERT, data }
          )
          return null

        case DBActions.HISTORY.UPDATE_WATCH_PROGRESS:
          await baseHandlers.history.updateWatchProgress(data.videoId, data.watchProgress)
          syncOtherWindows(
            IpcChannels.SYNC_HISTORY,
            event,
            { event: SyncEvents.HISTORY.UPDATE_WATCH_PROGRESS, data }
          )
          return null

        case DBActions.GENERAL.DELETE:
          await baseHandlers.history.delete(data)
          syncOtherWindows(
            IpcChannels.SYNC_HISTORY,
            event,
            { event: SyncEvents.GENERAL.DELETE, data }
          )
          return null

        case DBActions.GENERAL.DELETE_ALL:
          await baseHandlers.history.deleteAll()
          syncOtherWindows(
            IpcChannels.SYNC_HISTORY,
            event,
            { event: SyncEvents.GENERAL.DELETE_ALL }
          )
          return null

        case DBActions.GENERAL.PERSIST:
          baseHandlers.history.persist()
          return null

        default:
          // eslint-disable-next-line no-throw-literal
          throw 'invalid history db action'
      }
    } catch (err) {
      if (typeof err === 'string') throw err
      else throw err.toString()
    }
  })

  // *********** //
  // Profiles
  ipcMain.handle(IpcChannels.DB_PROFILES, async (event, { action, data }) => {
    try {
      switch (action) {
        case DBActions.GENERAL.CREATE: {
          const newProfile = await baseHandlers.profiles.create(data)
          syncOtherWindows(
            IpcChannels.SYNC_PROFILES,
            event,
            { event: SyncEvents.GENERAL.CREATE, data: newProfile }
          )
          return newProfile
        }

        case DBActions.GENERAL.FIND:
          return await baseHandlers.profiles.find()

        case DBActions.GENERAL.UPSERT:
          await baseHandlers.profiles.upsert(data)
          syncOtherWindows(
            IpcChannels.SYNC_PROFILES,
            event,
            { event: SyncEvents.GENERAL.UPSERT, data }
          )
          return null

        case DBActions.GENERAL.DELETE:
          await baseHandlers.profiles.delete(data)
          syncOtherWindows(
            IpcChannels.SYNC_PROFILES,
            event,
            { event: SyncEvents.GENERAL.DELETE, data }
          )
          return null

        case DBActions.GENERAL.PERSIST:
          baseHandlers.profiles.persist()
          return null

        default:
          // eslint-disable-next-line no-throw-literal
          throw 'invalid profile db action'
      }
    } catch (err) {
      if (typeof err === 'string') throw err
      else throw err.toString()
    }
  })

  // *********** //
  // Playlists
  // ! NOTE: A lot of these actions are currently not used for anything
  // As such, only the currently used actions have synchronization implemented
  // The remaining should have it implemented only when playlists
  // get fully implemented into the app
  ipcMain.handle(IpcChannels.DB_PLAYLISTS, async (event, { action, data }) => {
    try {
      switch (action) {
        case DBActions.GENERAL.CREATE:
          await baseHandlers.playlists.create(data)
          // TODO: Syncing (implement only when it starts being used)
          // syncOtherWindows(IpcChannels.SYNC_PLAYLISTS, event, { event: '_', data })
          return null

        case DBActions.GENERAL.FIND:
          return await baseHandlers.playlists.find()

        case DBActions.PLAYLISTS.UPSERT_VIDEO:
          await baseHandlers.playlists.upsertVideoByPlaylistName(data.playlistName, data.videoData)
          syncOtherWindows(
            IpcChannels.SYNC_PLAYLISTS,
            event,
            { event: SyncEvents.PLAYLISTS.UPSERT_VIDEO, data }
          )
          return null

        case DBActions.PLAYLISTS.UPSERT_VIDEO_IDS:
          await baseHandlers.playlists.upsertVideoIdsByPlaylistId(data._id, data.videoIds)
          // TODO: Syncing (implement only when it starts being used)
          // syncOtherWindows(IpcChannels.SYNC_PLAYLISTS, event, { event: '_', data })
          return null

        case DBActions.GENERAL.DELETE:
          await baseHandlers.playlists.delete(data)
          // TODO: Syncing (implement only when it starts being used)
          // syncOtherWindows(IpcChannels.SYNC_PLAYLISTS, event, { event: '_', data })
          return null

        case DBActions.PLAYLISTS.DELETE_VIDEO_ID:
          await baseHandlers.playlists.deleteVideoIdByPlaylistName(data.playlistName, data.videoId)
          syncOtherWindows(
            IpcChannels.SYNC_PLAYLISTS,
            event,
            { event: SyncEvents.PLAYLISTS.DELETE_VIDEO, data }
          )
          return null

        case DBActions.PLAYLISTS.DELETE_VIDEO_IDS:
          await baseHandlers.playlists.deleteVideoIdsByPlaylistName(data.playlistName, data.videoIds)
          // TODO: Syncing (implement only when it starts being used)
          // syncOtherWindows(IpcChannels.SYNC_PLAYLISTS, event, { event: '_', data })
          return null

        case DBActions.PLAYLISTS.DELETE_ALL_VIDEOS:
          await baseHandlers.playlists.deleteAllVideosByPlaylistName(data)
          // TODO: Syncing (implement only when it starts being used)
          // syncOtherWindows(IpcChannels.SYNC_PLAYLISTS, event, { event: '_', data })
          return null

        case DBActions.GENERAL.DELETE_MULTIPLE:
          await baseHandlers.playlists.deleteMultiple(data)
          // TODO: Syncing (implement only when it starts being used)
          // syncOtherWindows(IpcChannels.SYNC_PLAYLISTS, event, { event: '_', data })
          return null

        case DBActions.GENERAL.DELETE_ALL:
          await baseHandlers.playlists.deleteAll()
          // TODO: Syncing (implement only when it starts being used)
          // syncOtherWindows(IpcChannels.SYNC_PLAYLISTS, event, { event: '_', data })
          return null

        default:
          // eslint-disable-next-line no-throw-literal
          throw 'invalid playlist db action'
      }
    } catch (err) {
      if (typeof err === 'string') throw err
      else throw err.toString()
    }
  })

  // *********** //

  function syncOtherWindows(channel, event, payload) {
    const otherWindows = BrowserWindow.getAllWindows().filter((window) => {
      return window.webContents.id !== event.sender.id
    })

    for (const window of otherWindows) {
      window.webContents.send(channel, payload)
    }
  }

  // ************************************************* //

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
        submenu: [
          {
            label: 'New Window',
            accelerator: 'CmdOrCtrl+N',
            click: (_menuItem, _browserWindow, _event) => {
              createWindow({
                replaceMainWindow: false,
                showWindowNow: true
              })
            },
            type: 'normal'
          },
          { type: 'separator' },
          {
            label: 'Preferences',
            accelerator: 'CmdOrCtrl+,',
            click: (_menuItem, browserWindow, _event) => {
              if (browserWindow == null) { return }

              browserWindow.webContents.send(
                'change-view',
                { route: '/settings' }
              )
            },
            type: 'normal'
          },
          { type: 'separator' },
          { role: 'quit' }
        ]
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
          { role: 'toggledevtools', accelerator: 'f12', visible: false },
          {
            label: 'Enter Inspect Element Mode',
            accelerator: 'CmdOrCtrl+Shift+C',
            click: (_, window) => {
              if (window.webContents.isDevToolsOpened()) {
                window.devToolsWebContents.executeJavaScript('DevToolsAPI.enterInspectElementMode()')
              } else {
                window.webContents.once('devtools-opened', () => {
                  window.devToolsWebContents.executeJavaScript('DevToolsAPI.enterInspectElementMode()')
                })
                window.webContents.openDevTools()
              }
            }
          },
          { type: 'separator' },
          { role: 'resetzoom' },
          { role: 'resetzoom', accelerator: 'CmdOrCtrl+num0', visible: false },
          { role: 'zoomin', accelerator: 'CmdOrCtrl+Plus' },
          { role: 'zoomin', accelerator: 'CmdOrCtrl+=', visible: false },
          { role: 'zoomin', accelerator: 'CmdOrCtrl+numadd', visible: false },
          { role: 'zoomout' },
          { role: 'zoomout', accelerator: 'CmdOrCtrl+numsub', visible: false },
          { type: 'separator' },
          { role: 'togglefullscreen' },
          { type: 'separator' },
          {
            label: 'History',
            // MacOS: Command + Y
            // Other OS: Ctrl + H
            accelerator: process.platform === 'darwin' ? 'Cmd+Y' : 'Ctrl+H',
            click: (_menuItem, browserWindow, _event) => {
              if (browserWindow == null) { return }

              browserWindow.webContents.send(
                'change-view',
                { route: '/history' }
              )
            },
            type: 'normal'
          },
          { type: 'separator' },
          {
            label: 'Back',
            accelerator: 'Alt+Left',
            click: (_menuItem, browserWindow, _event) => {
              if (browserWindow == null) { return }

              browserWindow.webContents.send(
                'history-back',
              )
            },
            type: 'normal',
          },
          {
            label: 'Forward',
            accelerator: 'Alt+Right',
            click: (_menuItem, browserWindow, _event) => {
              if (browserWindow == null) { return }

              browserWindow.webContents.send(
                'history-forward',
              )
            },
            type: 'normal',
          },
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
