import {
  app, BrowserWindow, dialog, Menu, ipcMain,
  powerSaveBlocker, screen, session, shell,
  nativeTheme, net, protocol, clipboard,
  Tray
} from 'electron'
import path from 'path'
import cp from 'child_process'

import {
  IpcChannels,
  DBActions,
  SyncEvents,
  ABOUT_BITCOIN_ADDRESS,
  KeyboardShortcuts,
  DefaultFolderKind,
  SEARCH_CHAR_LIMIT,
} from '../constants'
import * as baseHandlers from '../datastores/handlers/base'
import { extractExpiryTimestamp, ImageCache } from './ImageCache'
import { existsSync } from 'fs'
import asyncFs from 'fs/promises'
import { promisify } from 'util'
import { brotliDecompress } from 'zlib'

import contextMenu from 'electron-context-menu'

import packageDetails from '../../package.json'
import { handleOpenInExternalPlayer } from './externalPlayer'
import { generatePoToken } from './poTokenGenerator'
import { isFreeTubeUrl } from './utils'

const brotliDecompressAsync = promisify(brotliDecompress)

if (process.argv.includes('--version')) {
  console.log(`v${packageDetails.version} Beta`) // eslint-disable-line no-console
  app.exit()
} else if (process.argv.includes('--help') || process.argv.includes('-h')) {
  printHelp()
  app.exit()
} else {
  // Only allow single instance of the application
  // Exit if we didn't get the lock, because another instance already has it
  if (process.env.NODE_ENV !== 'development' && !app.requestSingleInstanceLock()) {
    app.exit()
  } else {
    baseHandlers.loadDatastores()
    runApp()
  }
}

function printHelp() {
  // eslint-disable-next-line no-console
  console.log(`\
usage: ${process.argv0} [options...] [url]
Options:
  --help, -h           show this message, then exit
  --version            print the current version, then exit
  --new-window         reuse an existing instance if possible`)
}

function runApp() {
  /** @type {Set<string>} */
  const ALLOWED_RENDERER_FILES = process.env.NODE_ENV === 'production'
    // __FREETUBE_ALLOWED_PATHS__ is replaced by the injectAllowedPaths.mjs script
    ? new Set(__FREETUBE_ALLOWED_PATHS__)
    : new Set()

  if (process.env.NODE_ENV === 'production') {
    protocol.registerSchemesAsPrivileged([{
      scheme: 'app',
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true
      }
    }])
  }

  const ROOT_APP_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:9080' : 'app://bundle/index.html'

  let backendPreference = 'local'
  let backendFallback = true

  contextMenu({
    showSearchWithGoogle: false,
    showSaveImageAs: true,
    showCopyImageAddress: true,
    showSelectAll: false,
    showCopyLink: false,
    prepend: (defaultActions, parameters, browserWindow) => [
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
    ],
    // only show the copy link entry for external links and the /playlist, /channel and /watch in-app URLs
    // the /playlist, /channel and /watch in-app URLs get transformed to their equivalent YouTube or Invidious URLs
    append: (defaultActions, parameters, browserWindow) => {
      let visible = false
      const urlParts = parameters.linkURL.split('#')
      const isInAppUrl = urlParts[0] === browserWindow.webContents.getURL().split('#')[0]

      if (parameters.linkURL.length > 0) {
        if (isInAppUrl) {
          const path = urlParts[1]

          if (path) {
            visible = ['/channel', '/watch', '/hashtag', '/post'].some(p => path.startsWith(p)) ||
              // Only show copy link entry for non user playlists
              (path.startsWith('/playlist') && !/playlistType=user/.test(path))
          }
        } else {
          visible = true
        }
      }

      const copy = (url) => {
        if (parameters.linkText) {
          clipboard.write({
            bookmark: parameters.linkText,
            text: url
          })
        } else {
          clipboard.writeText(url)
        }
      }

      const transformURL = (toYouTube) => {
        let origin

        if (toYouTube) {
          origin = 'https://www.youtube.com'
        } else {
          origin = 'https://redirect.invidious.io'
        }

        const [path, query] = urlParts[1].split('?')
        const [route, id] = path.split('/').filter(p => p)

        switch (route) {
          case 'playlist':
            return `${origin}/playlist?list=${id}`
          case 'channel':
            return `${origin}/channel/${id}`
          case 'hashtag':
            return `${origin}/hashtag/${id}`
          case 'watch': {
            let url

            if (toYouTube) {
              url = new URL(`https://youtu.be/${id}`)
            } else {
              url = new URL(`https://redirect.invidious.io/watch?v=${id}`)
            }

            if (query) {
              const params = new URLSearchParams(query)
              const newParams = new URLSearchParams(url.search)
              let hasParams = false

              if (params.has('playlistId') && params.get('playlistType') !== 'user') {
                newParams.set('list', params.get('playlistId'))
                hasParams = true
              }

              if (params.has('timestamp')) {
                newParams.set('t', params.get('timestamp'))
                hasParams = true
              }

              if (hasParams) {
                url.search = newParams.toString()
              }
            }

            return url.toString()
          }
          case 'post': {
            if (query) {
              const authorId = new URLSearchParams(query).get('authorId')

              if (authorId) {
                if (toYouTube) {
                  return `${origin}/channel/${authorId}/community?lb=${id}`
                } else {
                  return `${origin}/post/${id}?ucid=${authorId}`
                }
              }
            }

            return `${origin}/post/${id}`
          }
        }
      }

      const textShortEnoughForSearch = parameters.selectionText.trim().length <= SEARCH_CHAR_LIMIT

      return [
        {
          label: 'Copy Lin&k',
          visible: visible && !isInAppUrl,
          click: () => {
            copy(parameters.linkURL)
          }
        },
        {
          label: 'Copy YouTube Link',
          visible: visible && isInAppUrl,
          click: () => {
            copy(transformURL(true))
          }
        },
        {
          label: 'Copy Invidious Link',
          visible: visible && isInAppUrl && (backendPreference === 'invidious' || backendFallback),
          click: () => {
            copy(transformURL(false))
          }
        },
        // Only show search in new window for
        // Static text or link
        // NOT internal link
        // NOT link with no customized link text
        // NOT link for timestamp
        {
          label: textShortEnoughForSearch ? 'Search “{selection}” in a New Window' : `“{selection}” is too long for search (> ${SEARCH_CHAR_LIMIT} chars)`,
          enabled: textShortEnoughForSearch,
          visible: (
            !isInAppUrl &&
            !parameters.isEditable &&
            (parameters.linkURL != null && !parameters.linkURL.includes(parameters.selectionText) && !(/(\d{1,2}:)*\d{1,2}:\d{2}/.test(parameters.linkText))) &&
            parameters.selectionText.trim().length > 0
          ),
          click: () => {
            const queryText = parameters.selectionText.trim()
            createWindow({
              replaceMainWindow: false,
              windowStartupUrl: `${ROOT_APP_URL}#/search/${encodeURIComponent(queryText)}`,
              searchQueryText: queryText,
              showWindowNow: true,
            })
          }
        },
      ]
    },
  })

  if (process.platform === 'win32') {
    app.setUserTasks([
      {
        program: process.execPath,
        arguments: '--new-window',
        iconPath: process.execPath,
        iconIndex: 0,
        title: 'New Window',
        description: 'Open New Window'
      }
    ])
  }

  // disable electron warning
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
  const isDebug = process.argv.includes('--debug')

  let mainWindow
  let startupUrl
  let tray = null
  let trayOnMinimize = false
  let trayWindows = []
  const trayMaximizedWindows = {}

  const userDataPath = app.getPath('userData')

  // command line switches need to be added before the app ready event first
  // that means we can't use the normal settings system as that is asynchronous,
  // doing it synchronously ensures that we add it before the event fires
  const REPLACE_HTTP_CACHE_PATH = `${userDataPath}/experiment-replace-http-cache`
  const replaceHttpCache = existsSync(REPLACE_HTTP_CACHE_PATH)
  if (replaceHttpCache) {
    // the http cache causes excessive disk usage during video playback
    // we've got a custom image cache to make up for disabling the http cache
    // experimental as it increases RAM use in favour of reduced disk use
    app.commandLine.appendSwitch('disable-http-cache')
  }

  const PLAYER_CACHE_PATH = `${userDataPath}/player_cache`

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
    app.on('second-instance', async (_, commandLine, __) => {
      // Someone tried to run a second instance
      if (typeof commandLine !== 'undefined') {
        const newStartupUrl = getLinkUrl(commandLine)

        if (!(mainWindow && mainWindow.webContents)) {
          startupUrl = newStartupUrl
          if (app.isReady()) await createWindow()
          return
        }

        if (commandLine.includes('--new-window')) {
          // The user wants to create a new window in the existing instance
          if (newStartupUrl) startupUrl = newStartupUrl
          await createWindow({
            showWindowNow: true,
            replaceMainWindow: true,
          })
          return
        }

        const openDeepLinksInNewWindow = (await baseHandlers.settings._findOne('openDeepLinksInNewWindow'))?.value
        if (!openDeepLinksInNewWindow) {
          // Just focus the main window (instead of starting a new instance)
          if (mainWindow.isMinimized()) {
            if (process.platform !== 'darwin' && trayOnMinimize) {
              trayClick(mainWindow)
            } else {
              mainWindow.restore()
            }
          }
          mainWindow.focus()
          if (newStartupUrl) mainWindow.webContents.send(IpcChannels.OPEN_URL, newStartupUrl)
          return
        }

        const newWindow = await createWindow({
          replaceMainWindow: false,
          showWindowNow: true,
        })

        /**
         * @param {import('electron').IpcMainEvent} event
         */
        const readyHandler = (event) => {
          if (isFreeTubeUrl(event.senderFrame.url)) {
            newWindow.webContents.ipc.off(IpcChannels.APP_READY, readyHandler)

            event.reply(IpcChannels.OPEN_URL, newStartupUrl)
          }
        }

        newWindow.webContents.ipc.on(IpcChannels.APP_READY, readyHandler)
      }
    })
  }

  let proxyUrl

  app.on('ready', async (_, __) => {
    if (process.platform === 'darwin') {
      const dockMenu = Menu.buildFromTemplate([
        {
          label: 'New Window',
          click: () => {
            createWindow({
              replaceMainWindow: false,
              showWindowNow: true
            })
          }
        }
      ])
      app.dock.setMenu(dockMenu)
    }

    if (process.env.NODE_ENV === 'production') {
      protocol.handle('app', async (request) => {
        if (request.method !== 'GET') {
          return new Response(null, {
            status: 405,
            headers: {
              Allow: 'GET'
            }
          })
        }

        const { host, pathname } = new URL(request.url)

        if (host !== 'bundle' || !ALLOWED_RENDERER_FILES.has(pathname)) {
          return new Response(null, {
            status: 400
          })
        }

        const contents = await asyncFs.readFile(path.join(__dirname, pathname))

        if (pathname.endsWith('.json.br')) {
          const decompressed = await brotliDecompressAsync(contents)

          return new Response(decompressed.buffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Content-Encoding': 'br'
            }
          })
        } else {
          return new Response(contents.buffer, {
            status: 200,
            headers: {
              'Content-Type': contentTypeFromFileExtension(pathname.split('.').at(-1))
            }
          })
        }
      })
    }

    // Electron defaults to approving all permission checks and permission requests.
    // FreeTube only needs a few permissions, so we reject requests for other permissions
    // and reject all requests on non-FreeTube URLs.
    //
    // FreeTube needs the following permissions:
    // - "fullscreen": So that the video player can enter full screen
    // - "clipboard-sanitized-write": To allow the user to copy video URLs and error messages
    // - "fileSystem" Needed for the Web File System API (e.g. importing and exporting data)

    session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
      if (!isFreeTubeUrl(requestingOrigin)) {
        return false
      }

      return (
        permission === 'fullscreen' ||
        permission === 'clipboard-sanitized-write' ||
        (permission === 'fileSystem' && !details.isDirectory)
      )
    })

    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
      if (!isFreeTubeUrl(webContents.getURL())) {
        // eslint-disable-next-line n/no-callback-literal
        callback(false)
        return
      }

      callback(
        permission === 'fullscreen' ||
        permission === 'clipboard-sanitized-write' ||
        (permission === 'fileSystem' && !details.isDirectory)
      )
    })

    session.defaultSession.on('file-system-access-restricted', (event, details, callback) => {
      if (!isFreeTubeUrl(details.origin)) {
        // eslint-disable-next-line n/no-callback-literal
        callback('deny')
        return
      }

      // eslint-disable-next-line n/no-callback-literal
      callback(details.isDirectory ? 'deny' : 'allow')
    })

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
          case 'backendFallback':
            backendFallback = doc.value
            break
          case 'backendPreference':
            backendPreference = doc.value
            break
          case 'hideToTrayOnMinimize':
            if (process.platform !== 'darwin') {
              trayOnMinimize = doc.value
            }
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
      proxyUrl = `${proxyProtocol}://${proxyHostname}:${proxyPort}`

      session.defaultSession.setProxy({
        proxyRules: proxyUrl
      })
    }

    const fixedUserAgent = session.defaultSession.getUserAgent()
      .split(' ')
      .filter(part => !part.includes('Electron') && !part.includes(packageDetails.productName))
      .join(' ')
    session.defaultSession.setUserAgent(fixedUserAgent)

    // Set CONSENT cookie on reasonable domains
    const consentCookieDomains = [
      'https://www.youtube.com',
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

    session.defaultSession.cookies.set({
      url: 'https://www.youtube.com',
      name: 'SOCS',
      value: 'CAI',
      sameSite: 'no_restriction',
    })

    const onBeforeSendHeadersRequestFilter = {
      urls: ['https://*/*', 'http://*/*'],
      types: ['xhr', 'media', 'image']
    }
    session.defaultSession.webRequest.onBeforeSendHeaders(onBeforeSendHeadersRequestFilter, ({ requestHeaders, url, webContents }, callback) => {
      const urlObj = new URL(url)

      if (url.startsWith('https://www.youtube.com/youtubei/')) {
        // make InnerTube requests work with the fetch function
        // InnerTube rejects requests if the referer isn't YouTube or empty
        requestHeaders.Referer = 'https://www.youtube.com/'
        requestHeaders.Origin = 'https://www.youtube.com'

        requestHeaders['Sec-Fetch-Site'] = 'same-origin'
        requestHeaders['Sec-Fetch-Mode'] = 'same-origin'
        requestHeaders['X-Youtube-Bootstrap-Logged-In'] = 'false'
      } else if (url === 'https://www.youtube.com/sw.js_data' || url.startsWith('https://www.youtube.com/api/timedtext')) {
        requestHeaders.Referer = 'https://www.youtube.com/sw.js'
        requestHeaders['Sec-Fetch-Site'] = 'same-origin'
        requestHeaders['Sec-Fetch-Mode'] = 'same-origin'
      } else if (
        urlObj.origin.endsWith('.googleusercontent.com') ||
        urlObj.origin.endsWith('.ggpht.com') ||
        urlObj.origin.endsWith('.ytimg.com')
      ) {
        requestHeaders.Referer = 'https://www.youtube.com/'
        requestHeaders.Origin = 'https://www.youtube.com'
      } else if (urlObj.origin.endsWith('.googlevideo.com') && urlObj.pathname === '/videoplayback') {
        requestHeaders.Referer = 'https://www.youtube.com/'
        requestHeaders.Origin = 'https://www.youtube.com'

        // YouTube doesn't send the Content-Type header for the media requests, so we shouldn't either
        delete requestHeaders['Content-Type']
      } else if (webContents) {
        const invidiousAuthorization = invidiousAuthorizations.get(webContents.id)

        if (invidiousAuthorization && url.startsWith(invidiousAuthorization.url)) {
          requestHeaders.Authorization = invidiousAuthorization.authorization
        }
      }

      callback({ requestHeaders })
    })

    // when we create a real session on the watch page, youtube returns tracking cookies, which we definitely don't want
    const trackingCookieRequestFilter = { urls: ['https://www.youtube.com/sw.js_data', 'https://www.youtube.com/iframe_api'] }

    session.defaultSession.webRequest.onHeadersReceived(trackingCookieRequestFilter, ({ responseHeaders }, callback) => {
      if (responseHeaders) {
        delete responseHeaders['set-cookie']
      }

      callback({ responseHeaders })
    })

    if (replaceHttpCache) {
      // in-memory image cache

      const imageCache = new ImageCache()

      protocol.handle('imagecache', (request) => {
        const [requestUrl, rawWebContentsId] = request.url.split('#')

        return new Promise((resolve, reject) => {
          const url = decodeURIComponent(requestUrl.substring(13))
          if (imageCache.has(url)) {
            const cached = imageCache.get(url)

            resolve(new Response(cached.data, {
              headers: { 'content-type': cached.mimeType }
            }))
            return
          }

          let headers

          if (rawWebContentsId) {
            const invidiousAuthorization = invidiousAuthorizations.get(parseInt(rawWebContentsId))

            if (invidiousAuthorization && url.startsWith(invidiousAuthorization.url)) {
              headers = {
                Authorization: invidiousAuthorization.authorization
              }
            }
          }

          const newRequest = net.request({
            method: request.method,
            url,
            headers
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

              resolve(new Response(data, {
                headers: { 'content-type': mimeType }
              }))
            })

            response.on('error', (error) => {
              console.error('image cache error', error)
              reject(error)
            })
          })

          newRequest.on('error', (err) => {
            console.error(err)
          })

          newRequest.end()
        })
      })

      const imageRequestFilter = { urls: ['https://*/*', 'http://*/*'], types: ['image'] }
      session.defaultSession.webRequest.onBeforeRequest(imageRequestFilter, (details, callback) => {
        // the requests made by the imagecache:// handler to fetch the image,
        // are allowed through, as their resourceType is 'other'

        let redirectURL = `imagecache://${encodeURIComponent(details.url)}`

        if (details.webContents) {
          redirectURL += `#${details.webContents.id}`
        }

        callback({
          redirectURL
        })
      })

      // --- end of `if experimentsDisableDiskCache` ---
    }

    await createWindow()

    if (isDebug) {
      mainWindow.webContents.openDevTools()
    }
  })

  app.on('login', async (event, webContents, request, authInfo, callback) => {
    if (authInfo.isProxy) {
      event.preventDefault()
      const proxyUsername = (await baseHandlers.settings._findOne('proxyUsername'))?.value
      const proxyPassword = (await baseHandlers.settings._findOne('proxyPassword'))?.value
      callback(proxyUsername, proxyPassword)
    }
  })

  function trayClick(window, close = false) {
    if (!close) {
      if (window.id in trayMaximizedWindows) {
        window.maximize()
      } else {
        window.show()

        // Calling hide() inside minimize is broken for some Linux distros (window minimizes again when trying to drag,
        // resize or maximize it, among other shenanigans). It seems to work as intended with this workaround.
        if (process.platform === 'linux') {
          window.hide()
          window.show()
        }
      }

      if (trayWindows.length === BrowserWindow.getAllWindows().length) { mainWindow = window }
    } else if (trayWindows.length > 0) {
      window.close()
    }

    trayWindows.splice(trayWindows.findIndex(item => item.id === window.id), 1)

    if (trayWindows.length > 0) {
      createTrayContextMenu()
    } else {
      destroyTray()
    }
  }

  function createTrayContextMenu() {
    const menuItems = []
    trayWindows.forEach(window => {
      menuItems.push({
        label: window.title,
        submenu: [
          {
            label: 'Show',
            click: () => trayClick(window)
          },
          {
            label: 'Close',
            click: () => trayClick(window, true)
          }
        ]
      })
    })

    menuItems.push(
      {
        type: 'separator'
      },
      ...defaultTrayMenu()
    )

    const menu = Menu.buildFromTemplate(menuItems)
    tray.setContextMenu(menu)
  }

  function defaultTrayMenu() {
    return [
      {
        label: 'New Window',
        click: () => createWindow({
          showWindowNow: true,
          replaceMainWindow: trayWindows.some(item => item.id === mainWindow.id)
        })
      },
      {
        label: 'Quit',
        click: handleQuit
      }
    ]
  }

  function destroyTray() {
    if (!tray) return

    if (process.platform !== 'linux') {
      tray.destroy()
      tray = null
    } else {
      const menu = Menu.buildFromTemplate(defaultTrayMenu())
      tray.setContextMenu(menu)
    }
  }

  function showHiddenWindows() {
    trayWindows.forEach(window => {
      window.minimize()
    })

    destroyTray()
    trayWindows = []
  }

  /**
   * @param {string} extension
   */
  function contentTypeFromFileExtension(extension) {
    switch (extension) {
      case 'html':
        return 'text/html'
      case 'css':
        return 'text/css'
      case 'js':
        return 'text/javascript'
      case 'ttf':
        return 'font/ttf'
      case 'woff2':
        return 'font/woff2'
      case 'svg':
        return 'image/svg+xml'
      case 'png':
        return 'image/png'
      case 'json':
        return 'application/json'
      case 'txt':
        return 'text/plain'
      default:
        return 'application/octet-stream'
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
    const windowBackground = await baseHandlers.settings._findOne('baseTheme').then((setting) => {
      if (!setting) {
        return nativeTheme.shouldUseDarkColors ? '#212121' : '#f1f1f1'
      }

      // Determine window color to be shown (shown most prominently during initial app load)
      // Uses the --bg-color for each corresponding theme
      switch (setting.value) {
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
        case 'pastel-pink':
          return '#ffd1dc'
        case 'hot-pink':
          return '#de1c85'
        case 'nordic':
          return '#2b2f3a'
        case 'solarized-dark':
          return '#002B36'
        case 'solarized-light':
          return '#fdf6e3'
        case 'gruvbox-dark':
          return '#282828'
        case 'gruvbox-light':
          return '#fbf1c7'
        case 'catppuccin-frappe':
          return '#303446'
        case 'everforest-dark-hard':
          return '#272e33'
        case 'everforest-dark-medium':
          return '#2d353b'
        case 'everforest-dark-low':
          return '#333c43'
        case 'everforest-light-hard':
          return '#fffbef'
        case 'everforest-light-medium':
          return '#fdf6e3'
        case 'everforest-light-low':
          return '#f3ead3'
        case 'catppuccin-latte':
          return '#eff1f5'
        case 'system':
        default:
          return nativeTheme.shouldUseDarkColors ? '#212121' : '#f1f1f1'
      }
    }).catch((error) => {
      console.error(error)
      // Default to nativeTheme settings if nothing is found.
      return nativeTheme.shouldUseDarkColors ? '#212121' : '#f1f1f1'
    })

    let savedBounds, savedMaximized, savedFullScreen

    const boundsDoc = await baseHandlers.settings._findOne('bounds')
    if (typeof boundsDoc?.value === 'object') {
      const { maximized, fullScreen, ...bounds } = boundsDoc.value
      const windowVisible = screen.getAllDisplays().some(display => {
        const { x, y, width, height } = display.bounds
        return !(bounds.x > x + width || bounds.x + bounds.width < x || bounds.y > y + height || bounds.y + bounds.height < y)
      })

      if (windowVisible) {
        savedBounds = bounds
      }

      savedMaximized = maximized
      savedFullScreen = fullScreen
    }

    const newWindow = new BrowserWindow({
      // It will be shown later when ready via `ready-to-show` event
      show: showWindowNow,
      backgroundColor: windowBackground,
      darkTheme: nativeTheme.shouldUseDarkColors,
      icon: process.env.NODE_ENV === 'development'
        ? path.join(__dirname, '../../_icons/iconColor.png')
        : path.join(__dirname, '../_icons/iconColor.png'),
      autoHideMenuBar: true,
      // useContentSize: true,
      webPreferences: {
        webSecurity: false,
        backgroundThrottling: false,
        preload: process.env.NODE_ENV === 'development'
          ? path.resolve(__dirname, '../../dist/preload.js')
          : path.resolve(__dirname, 'preload.js')
      },
      minWidth: 340,
      minHeight: 380,
      ...savedBounds
        ? {
            x: savedBounds.x,
            y: savedBounds.y,
            width: savedBounds.width,
            height: savedBounds.height
          }
        : {
            width: 1200,
            height: 800
          }
    })

    // region Ensure child windows use same options since electron 14

    // https://github.com/electron/electron/blob/14-x-y/docs/api/window-open.md#native-window-example
    newWindow.webContents.setWindowOpenHandler((details) => {
      const url = URL.parse(details.url)

      // Only handle valid URLs that came from a FreeTube page
      if (url !== null && isFreeTubeUrl(newWindow.webContents.getURL())) {
        if (isFreeTubeUrl(url)) {
          createWindow({
            replaceMainWindow: false,
            showWindowNow: true,
            windowStartupUrl: details.url
          })
        } else if (
          url.protocol === 'http:' || url.protocol === 'https:' ||

          // Email address on the about page and Autolinker detects and links email addresses
          url.protocol === 'mailto:' ||

          // Autolinker detects and links phone numbers
          url.protocol === 'tel:' ||

          // Donation links on the about page
          (url.protocol === 'bitcoin:' && url.pathname === ABOUT_BITCOIN_ADDRESS)
        ) {
          shell.openExternal(details.url)
        }
      }

      return { action: 'deny' }
    })

    // endregion Ensure child windows use same options since electron 14

    if (process.platform !== 'darwin') {
      function manageTray(window, removeWindow = false) {
        if (tray) {
          if (!removeWindow) {
            trayWindows.push(window)
            createTrayContextMenu()
          } else if (trayWindows.some(item => item.id === window.id)) {
            trayClick(window)
          }
        } else {
          const icon = process.env.NODE_ENV === 'development'
            ? path.join(__dirname, '..', '..', '_icons', 'iconColor.png')
            : path.join(__dirname, '..', '_icons', 'iconColor.png')

          tray = new Tray(icon)

          tray.setIgnoreDoubleClickEvents(true)
          tray.setToolTip('FreeTube')

          trayWindows = [window]
          createTrayContextMenu()

          if (process.platform !== 'linux') {
            tray.on('click', (event) => {
              if (trayWindows.length === 1) { trayClick(trayWindows[0]) }
            })
          }
        }
      }

      newWindow.on('minimize', () => {
        if (trayOnMinimize) {
          newWindow.hide()
          manageTray(newWindow)

          if (newWindow === mainWindow) {
            // A timer is needed because getFocusedWindow doesn't update until the minimize event ends
            setTimeout(() => {
              const newMainWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows().find(window => window.isVisible())
              if (newMainWindow) { mainWindow = newMainWindow }
            }, 100)
          }
        }
      })

      newWindow.on('maximize', () => {
        if (trayOnMinimize) { trayMaximizedWindows[newWindow.id] = true }
      })

      newWindow.on('unmaximize', () => {
        if (trayOnMinimize) { delete trayMaximizedWindows[newWindow.id] }
      })
    }

    if (replaceMainWindow) {
      mainWindow = newWindow
    }

    if (savedMaximized) {
      newWindow.maximize()
    }

    if (savedFullScreen) {
      newWindow.setFullScreen(true)
    }

    // If called multiple times
    // Duplicate menu items will be added
    if (replaceMainWindow) {
      setMenu()
    }

    // load root file/url
    if (windowStartupUrl != null) {
      newWindow.loadURL(windowStartupUrl)
    } else {
      newWindow.loadURL(ROOT_APP_URL)
    }

    if (typeof searchQueryText === 'string' && searchQueryText.length > 0) {
      /**
       * @param {import('electron').IpcMainEvent} event
       */
      const searchInputReadyHandler = (event) => {
        if (isFreeTubeUrl(event.senderFrame.url)) {
          newWindow.webContents.ipc.off(IpcChannels.SEARCH_INPUT_HANDLING_READY, searchInputReadyHandler)

          event.reply(IpcChannels.UPDATE_SEARCH_INPUT_TEXT, searchQueryText)
        }
      }

      newWindow.webContents.ipc.on(IpcChannels.SEARCH_INPUT_HANDLING_READY, searchInputReadyHandler)
    }

    const showWindow = () => {
      if (newWindow.isVisible()) {
        // only open the dev tools if they aren't already open
        if (process.env.NODE_ENV === 'development' && !newWindow.webContents.isDevToolsOpened()) {
          newWindow.webContents.openDevTools({ activate: false })
        }
        return
      }

      if (process.platform !== 'darwin' && trayOnMinimize && trayWindows.length > 0) {
        trayClick(newWindow)
      } else {
        newWindow.show()
        newWindow.focus()
      }

      if (process.env.NODE_ENV === 'development') {
        newWindow.webContents.openDevTools({ activate: false })
      }
    }

    // The `ready-to-show` event doesn't always fire on wayland.
    // Use the `did-finish-load` event on the web contents instead as that is similar enough
    // https://github.com/electron/electron/issues/48859

    if (process.platform === 'linux' && app.commandLine.getSwitchValue('ozone-platform') === 'wayland') {
      newWindow.webContents.once('did-finish-load', showWindow)
    } else {
      // Show when loaded
      newWindow.once('ready-to-show', showWindow)
    }

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

      stopPowerSaveBlockerForWindow(newWindow)
    })

    return newWindow
  }

  ipcMain.on(IpcChannels.APP_READY, (event) => {
    if (isFreeTubeUrl(event.senderFrame.url)) {
      if (startupUrl) {
        mainWindow.webContents.send(IpcChannels.OPEN_URL, startupUrl)
      }
      startupUrl = null
    }
  })

  ipcMain.on(IpcChannels.SET_WINDOW_TITLE, (event, title) => {
    if (isFreeTubeUrl(event.senderFrame.url) && typeof title === 'string') {
      BrowserWindow.fromWebContents(event.sender)?.setTitle(title)
    }
  })

  function relaunch() {
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
  }

  ipcMain.once(IpcChannels.RELAUNCH_REQUEST, () => {
    relaunch()
  })

  nativeTheme.on('updated', () => {
    const allWindows = BrowserWindow.getAllWindows()

    allWindows.forEach((window) => {
      if (isFreeTubeUrl(window.webContents.getURL())) {
        window.webContents.send(IpcChannels.NATIVE_THEME_UPDATE, nativeTheme.shouldUseDarkColors)
      }
    })
  })

  ipcMain.handle(IpcChannels.GENERATE_PO_TOKEN, (event, videoId, context) => {
    if (isFreeTubeUrl(event.senderFrame.url)) {
      return generatePoToken(videoId, context, proxyUrl)
    }
  })

  ipcMain.on(IpcChannels.ENABLE_PROXY, (event, url) => {
    if (!isFreeTubeUrl(event.senderFrame.url)) {
      return
    }

    session.defaultSession.setProxy({
      proxyRules: url
    })
    proxyUrl = url
    session.defaultSession.closeAllConnections()
  })

  ipcMain.on(IpcChannels.DISABLE_PROXY, (event) => {
    if (!isFreeTubeUrl(event.senderFrame.url)) {
      return
    }

    session.defaultSession.setProxy({})
    proxyUrl = undefined
    session.defaultSession.closeAllConnections()
  })

  // #region navigation history

  const NAV_HISTORY_DISPLAY_LIMIT = 15
  // Math.trunc but with a bitwise OR so that it can be calcuated at build time and the number inlined
  const HALF_OF_NAV_HISTORY_DISPLAY_LIMIT = (NAV_HISTORY_DISPLAY_LIMIT / 2) | 0

  ipcMain.handle(IpcChannels.GET_NAVIGATION_HISTORY, ({ senderFrame, sender }) => {
    if (!isFreeTubeUrl(senderFrame.url)) {
      return
    }

    const activeIndex = sender.navigationHistory.getActiveIndex()
    const length = sender.navigationHistory.length()

    let end

    if (activeIndex < HALF_OF_NAV_HISTORY_DISPLAY_LIMIT) {
      end = Math.min(length - 1, NAV_HISTORY_DISPLAY_LIMIT - 1)
    } else if (length - activeIndex < HALF_OF_NAV_HISTORY_DISPLAY_LIMIT + 1) {
      end = length - 1
    } else {
      end = activeIndex + HALF_OF_NAV_HISTORY_DISPLAY_LIMIT
    }

    const dropdownOptions = []

    for (let index = end; index >= Math.max(0, end + 1 - NAV_HISTORY_DISPLAY_LIMIT); --index) {
      const routeLabel = sender.navigationHistory.getEntryAtIndex(index)?.title

      dropdownOptions.push({
        label: routeLabel,
        value: index - activeIndex,
        active: index === activeIndex
      })
    }

    return dropdownOptions
  })

  // #endregion navigation history

  ipcMain.handle(IpcChannels.GET_SYSTEM_LOCALE, (event) => {
    if (isFreeTubeUrl(event.senderFrame.url)) {
      // we should switch to getPreferredSystemLanguages at some point and iterate through until we find a supported locale
      return app.getSystemLocale()
    }
  })

  ipcMain.handle(IpcChannels.GET_SCREENSHOT_FALLBACK_FOLDER, (event) => {
    if (isFreeTubeUrl(event.senderFrame.url)) {
      return path.join(app.getPath('pictures'), 'Freetube')
    }
  })

  ipcMain.on(IpcChannels.CHOOSE_DEFAULT_FOLDER, async (event, kind) => {
    if (!isFreeTubeUrl(event.senderFrame.url) || (kind !== DefaultFolderKind.DOWNLOADS && kind !== DefaultFolderKind.SCREENSHOTS)) {
      return
    }

    const settingId = kind === DefaultFolderKind.DOWNLOADS ? 'downloadFolderPath' : 'screenshotFolderPath'

    let currentPath = (await baseHandlers.settings._findOne(settingId))?.value

    if (typeof currentPath !== 'string' || currentPath.length === 0) {
      currentPath = app.getPath(kind === DefaultFolderKind.DOWNLOADS ? 'downloads' : 'pictures')
    }

    const dialogOptions = {
      defaultPath: currentPath,
      properties: ['openDirectory']
    }

    let result

    const window = BrowserWindow.fromWebContents(event.sender)
    if (window) {
      result = await dialog.showOpenDialog(window, dialogOptions)
    } else {
      result = await dialog.showOpenDialog(dialogOptions)
    }

    if (result.canceled) {
      return
    }

    await baseHandlers.settings.upsert(settingId, result.filePaths[0])

    const syncPayload = {
      event: SyncEvents.GENERAL.UPSERT,
      data: {
        _id: settingId,
        value: result.filePaths[0]
      }
    }

    BrowserWindow.getAllWindows().forEach((window) => {
      if (isFreeTubeUrl(window.webContents.getURL())) {
        window.webContents.send(IpcChannels.SYNC_SETTINGS, syncPayload)
      }
    })
  })

  ipcMain.handle(IpcChannels.WRITE_TO_DEFAULT_FOLDER, async (event, kind, filename, arrayBuffer) => {
    if (
      !isFreeTubeUrl(event.senderFrame.url) ||
      (kind !== DefaultFolderKind.DOWNLOADS && kind !== DefaultFolderKind.SCREENSHOTS) ||
      typeof filename !== 'string' ||
      !(arrayBuffer instanceof ArrayBuffer)) {
      return
    }

    const settingId = kind === DefaultFolderKind.DOWNLOADS ? 'downloadFolderPath' : 'screenshotFolderPath'

    const folderPath = (await baseHandlers.settings._findOne(settingId))?.value

    let directory
    if (typeof folderPath === 'string' && folderPath.length > 0) {
      directory = folderPath
    } else {
      directory = path.join(app.getPath(kind === DefaultFolderKind.DOWNLOADS ? 'downloads' : 'pictures'), 'FreeTube')
    }

    directory = path.normalize(directory)

    const filePath = path.resolve(directory, filename)

    // Ensure that we are only writing inside of the expected directory
    if (path.dirname(filePath) !== directory) {
      throw new Error('Invalid save location')
    }

    try {
      await asyncFs.mkdir(directory, { recursive: true })

      await asyncFs.writeFile(filePath, new DataView(arrayBuffer))
    } catch (error) {
      console.error('WRITE_TO_DEFAULT_FOLDER failed', error)
      // throw a new error so that we don't expose the real error to the renderer
      throw new Error('Failed to save')
    }
  })

  /** @type {Map<number, number>} */
  const activePowerSaveBlockers = new Map()

  /**
   * @param {BrowserWindow} window
   */
  function stopPowerSaveBlockerForWindow(window) {
    const powerSaveBlockerId = activePowerSaveBlockers.get(window.id)

    if (typeof powerSaveBlockerId === 'number') {
      powerSaveBlocker.stop(powerSaveBlockerId)

      activePowerSaveBlockers.delete(window.id)
    }
  }

  ipcMain.on(IpcChannels.STOP_POWER_SAVE_BLOCKER, (event) => {
    if (!isFreeTubeUrl(event.senderFrame.url)) {
      return
    }

    const browserWindow = BrowserWindow.fromWebContents(event.sender)

    if (browserWindow) {
      stopPowerSaveBlockerForWindow(browserWindow)
    }
  })

  ipcMain.on(IpcChannels.START_POWER_SAVE_BLOCKER, (event) => {
    if (!isFreeTubeUrl(event.senderFrame.url)) {
      return
    }

    const browserWindow = BrowserWindow.fromWebContents(event.sender)

    if (browserWindow && !activePowerSaveBlockers.has(browserWindow.id)) {
      const powerSaveBlockerId = powerSaveBlocker.start('prevent-display-sleep')

      activePowerSaveBlockers.set(browserWindow.id, powerSaveBlockerId)
    }
  })

  ipcMain.on(IpcChannels.CREATE_NEW_WINDOW, (event, path, query, searchQueryText) => {
    if (!isFreeTubeUrl(event.senderFrame.url)) {
      return
    }

    if (
      typeof path !== 'string' ||
      (query != null && typeof query !== 'object') ||
      (searchQueryText != null && typeof searchQueryText !== 'string')
    ) {
      return
    }

    if (path.charAt(0) !== '/') {
      path = `/${path}`
    }

    let windowStartupUrl = `${ROOT_APP_URL}#${path}`

    if (query) {
      windowStartupUrl += '?' + new URLSearchParams(query).toString()
    }

    createWindow({
      replaceMainWindow: false,
      showWindowNow: true,
      windowStartupUrl,
      searchQueryText
    })
  })

  ipcMain.on(IpcChannels.OPEN_IN_EXTERNAL_PLAYER, handleOpenInExternalPlayer)

  ipcMain.handle(IpcChannels.GET_REPLACE_HTTP_CACHE, (event) => {
    if (isFreeTubeUrl(event.senderFrame.url)) {
      return replaceHttpCache
    }
  })

  ipcMain.once(IpcChannels.TOGGLE_REPLACE_HTTP_CACHE, async (event) => {
    if (!isFreeTubeUrl(event.senderFrame.url)) {
      return
    }

    if (replaceHttpCache) {
      await asyncFs.rm(REPLACE_HTTP_CACHE_PATH)
    } else {
      // create an empty file
      const handle = await asyncFs.open(REPLACE_HTTP_CACHE_PATH, 'w')
      await handle.close()
    }

    relaunch()
  })

  function playerCachePathForKey(key) {
    // Remove path separators and period characters,
    // to prevent any files outside of the player_cache directory,
    // from being read or written
    const sanitizedKey = `${key}`.replaceAll(/[./\\]/g, '__')

    return path.join(PLAYER_CACHE_PATH, sanitizedKey)
  }

  ipcMain.handle(IpcChannels.PLAYER_CACHE_GET, async (event, key) => {
    if (!isFreeTubeUrl(event.senderFrame.url)) {
      return
    }

    const filePath = playerCachePathForKey(key)

    try {
      const contents = await asyncFs.readFile(filePath)

      return contents.buffer
    } catch (e) {
      // Don't log the error if the file doesn't exist as we'll just fetch it from YouTube
      // this usually happens when YouTube updates their player JavaScript
      if (e.code !== 'ENOENT') {
        console.error(e)
      }

      return undefined
    }
  })

  ipcMain.handle(IpcChannels.PLAYER_CACHE_SET, async (event, key, value) => {
    if (!isFreeTubeUrl(event.senderFrame.url)) {
      return
    }

    const filePath = playerCachePathForKey(key)

    await asyncFs.mkdir(PLAYER_CACHE_PATH, { recursive: true })

    await asyncFs.writeFile(filePath, new Uint8Array(value))
  })

  /** @type {Map<number, { url: string, authorization: string }>} */
  const invidiousAuthorizations = new Map()

  ipcMain.on(IpcChannels.SET_INVIDIOUS_AUTHORIZATION, (event, authorization, url) => {
    if (!isFreeTubeUrl(event.senderFrame.url)) {
      return
    }

    if (!authorization) {
      invidiousAuthorizations.delete(event.sender.id)
    } else if (typeof authorization === 'string' && typeof url === 'string') {
      invidiousAuthorizations.set(event.sender.id, { authorization, url })
    }
  })

  // ************************************************* //
  // DB related IPC calls
  // *********** //

  // Settings
  ipcMain.handle(IpcChannels.DB_SETTINGS, async (event, { action, data }) => {
    if (!isFreeTubeUrl(event.senderFrame.url)) {
      return
    }

    try {
      switch (action) {
        case DBActions.GENERAL.FIND:
          return await baseHandlers.settings.find()

        case DBActions.GENERAL.UPSERT:
          // These two are only allowed to be changed by the CHOOSE_DEFAULT_FOLDER IPC action
          // to avoid the "write to default folder" IPC calls being abused to write to arbitrary locations
          if (data._id === 'downloadFolderPath' || data._id === 'screenshotFolderPath') {
            return null
          }

          await baseHandlers.settings.upsert(data._id, data.value)
          syncOtherWindows(
            IpcChannels.SYNC_SETTINGS,
            event,
            { event: SyncEvents.GENERAL.UPSERT, data }
          )
          switch (data._id) {
            // Update app menu on related setting update
            case 'backendFallback':
              backendFallback = data.value
              await setMenu()
              break
            case 'backendPreference':
              backendPreference = data.value
              await setMenu()
              break
            case 'hideTrendingVideos':
            case 'hidePopularVideos':
            case 'hidePlaylists':
              await setMenu()
              break
            case 'hideToTrayOnMinimize':
              if (process.platform !== 'darwin') {
                trayOnMinimize = data.value
                if (!trayOnMinimize) { showHiddenWindows() }
              }
              break

            default:
              // Do nothing for unmatched settings
          }
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
    if (!isFreeTubeUrl(event.senderFrame.url)) {
      return
    }

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

        case DBActions.GENERAL.OVERWRITE:
          await baseHandlers.history.overwrite(data)
          syncOtherWindows(
            IpcChannels.SYNC_HISTORY,
            event,
            { event: SyncEvents.GENERAL.OVERWRITE, data }
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

        case DBActions.HISTORY.UPDATE_PLAYLIST:
          await baseHandlers.history.updateLastViewedPlaylist(data.videoId, data.lastViewedPlaylistId, data.lastViewedPlaylistType, data.lastViewedPlaylistItemId)
          syncOtherWindows(
            IpcChannels.SYNC_HISTORY,
            event,
            { event: SyncEvents.HISTORY.UPDATE_PLAYLIST, data }
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
    if (!isFreeTubeUrl(event.senderFrame.url)) {
      return
    }

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

        case DBActions.PROFILES.ADD_CHANNEL:
          await baseHandlers.profiles.addChannelToProfiles(data.channel, data.profileIds)
          syncOtherWindows(
            IpcChannels.SYNC_PROFILES,
            event,
            { event: SyncEvents.PROFILES.ADD_CHANNEL, data }
          )
          return null

        case DBActions.PROFILES.REMOVE_CHANNEL:
          await baseHandlers.profiles.removeChannelFromProfiles(data.channelId, data.profileIds)
          syncOtherWindows(
            IpcChannels.SYNC_PROFILES,
            event,
            { event: SyncEvents.PROFILES.REMOVE_CHANNEL, data }
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
    if (!isFreeTubeUrl(event.senderFrame.url)) {
      return
    }

    try {
      switch (action) {
        case DBActions.GENERAL.CREATE:
          await baseHandlers.playlists.create(data)
          syncOtherWindows(
            IpcChannels.SYNC_PLAYLISTS,
            event,
            { event: SyncEvents.GENERAL.CREATE, data }
          )
          return null

        case DBActions.GENERAL.FIND:
          return await baseHandlers.playlists.find()

        case DBActions.GENERAL.UPSERT:
          await baseHandlers.playlists.upsert(data)
          syncOtherWindows(
            IpcChannels.SYNC_PLAYLISTS,
            event,
            { event: SyncEvents.GENERAL.UPSERT, data }
          )
          return null

        case DBActions.PLAYLISTS.UPSERT_VIDEO:
          await baseHandlers.playlists.upsertVideoByPlaylistId(data._id, data.lastUpdatedAt, data.videoData)
          syncOtherWindows(
            IpcChannels.SYNC_PLAYLISTS,
            event,
            { event: SyncEvents.PLAYLISTS.UPSERT_VIDEO, data }
          )
          return null

        case DBActions.PLAYLISTS.UPSERT_VIDEOS:
          await baseHandlers.playlists.upsertVideosByPlaylistId(data._id, data.lastUpdatedAt, data.videos)
          syncOtherWindows(
            IpcChannels.SYNC_PLAYLISTS,
            event,
            { event: SyncEvents.PLAYLISTS.UPSERT_VIDEOS, data }
          )
          return null

        case DBActions.GENERAL.DELETE:
          await baseHandlers.playlists.delete(data)
          syncOtherWindows(
            IpcChannels.SYNC_PLAYLISTS,
            event,
            { event: SyncEvents.GENERAL.DELETE, data }
          )
          return null

        case DBActions.PLAYLISTS.DELETE_VIDEO_ID:
          await baseHandlers.playlists.deleteVideoIdByPlaylistId(data._id, data.lastUpdatedAt, data.videoId, data.playlistItemId)
          syncOtherWindows(
            IpcChannels.SYNC_PLAYLISTS,
            event,
            { event: SyncEvents.PLAYLISTS.DELETE_VIDEO, data }
          )
          return null

        case DBActions.PLAYLISTS.DELETE_VIDEO_IDS:
          await baseHandlers.playlists.deleteVideoIdsByPlaylistId(data._id, data.lastUpdatedAt, data.playlistItemIds)
          syncOtherWindows(
            IpcChannels.SYNC_PLAYLISTS,
            event,
            { event: SyncEvents.PLAYLISTS.DELETE_VIDEOS, data }
          )
          return null

        case DBActions.PLAYLISTS.DELETE_ALL_VIDEOS:
          await baseHandlers.playlists.deleteAllVideosByPlaylistId(data)
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

  // ************** //
  // Search History
  ipcMain.handle(IpcChannels.DB_SEARCH_HISTORY, async (event, { action, data }) => {
    if (!isFreeTubeUrl(event.senderFrame.url)) {
      return
    }

    try {
      switch (action) {
        case DBActions.GENERAL.FIND:
          return await baseHandlers.searchHistory.find()

        case DBActions.GENERAL.UPSERT:
          await baseHandlers.searchHistory.upsert(data)
          syncOtherWindows(
            IpcChannels.SYNC_SEARCH_HISTORY,
            event,
            { event: SyncEvents.GENERAL.UPSERT, data }
          )
          return null

        case DBActions.GENERAL.OVERWRITE:
          await baseHandlers.searchHistory.overwrite(data)
          syncOtherWindows(
            IpcChannels.SYNC_SEARCH_HISTORY,
            event,
            { event: SyncEvents.GENERAL.OVERWRITE, data }
          )
          return null

        case DBActions.GENERAL.DELETE:
          await baseHandlers.searchHistory.delete(data)
          syncOtherWindows(
            IpcChannels.SYNC_SEARCH_HISTORY,
            event,
            { event: SyncEvents.GENERAL.DELETE, data }
          )
          return null

        case DBActions.GENERAL.DELETE_ALL:
          await baseHandlers.searchHistory.deleteAll()
          syncOtherWindows(
            IpcChannels.SYNC_SEARCH_HISTORY,
            event,
            { event: SyncEvents.GENERAL.DELETE_ALL }
          )
          return null

        default:
          // eslint-disable-next-line no-throw-literal
          throw 'invalid search history db action'
      }
    } catch (err) {
      if (typeof err === 'string') throw err
      else throw err.toString()
    }
  })

  // *********** //
  // Profiles
  ipcMain.handle(IpcChannels.DB_SUBSCRIPTION_CACHE, async (event, { action, data }) => {
    if (!isFreeTubeUrl(event.senderFrame.url)) {
      return
    }

    try {
      switch (action) {
        case DBActions.GENERAL.FIND:
          return await baseHandlers.subscriptionCache.find()

        case DBActions.SUBSCRIPTION_CACHE.UPDATE_VIDEOS_BY_CHANNEL:
          await baseHandlers.subscriptionCache.updateVideosByChannelId(data.channelId, data.entries, data.timestamp)
          syncOtherWindows(
            IpcChannels.SYNC_SUBSCRIPTION_CACHE,
            event,
            { event: SyncEvents.SUBSCRIPTION_CACHE.UPDATE_VIDEOS_BY_CHANNEL, data }
          )
          return null

        case DBActions.SUBSCRIPTION_CACHE.UPDATE_LIVE_STREAMS_BY_CHANNEL:
          await baseHandlers.subscriptionCache.updateLiveStreamsByChannelId(data.channelId, data.entries, data.timestamp)
          syncOtherWindows(
            IpcChannels.SYNC_SUBSCRIPTION_CACHE,
            event,
            { event: SyncEvents.SUBSCRIPTION_CACHE.UPDATE_LIVE_STREAMS_BY_CHANNEL, data }
          )
          return null

        case DBActions.SUBSCRIPTION_CACHE.UPDATE_SHORTS_BY_CHANNEL:
          await baseHandlers.subscriptionCache.updateShortsByChannelId(data.channelId, data.entries, data.timestamp)
          syncOtherWindows(
            IpcChannels.SYNC_SUBSCRIPTION_CACHE,
            event,
            { event: SyncEvents.SUBSCRIPTION_CACHE.UPDATE_SHORTS_BY_CHANNEL, data }
          )
          return null

        case DBActions.SUBSCRIPTION_CACHE.UPDATE_SHORTS_WITH_CHANNEL_PAGE_SHORTS_BY_CHANNEL:
          await baseHandlers.subscriptionCache.updateShortsWithChannelPageShortsByChannelId(data.channelId, data.entries)
          syncOtherWindows(
            IpcChannels.SYNC_SUBSCRIPTION_CACHE,
            event,
            { event: SyncEvents.SUBSCRIPTION_CACHE.UPDATE_SHORTS_WITH_CHANNEL_PAGE_SHORTS_BY_CHANNEL, data }
          )
          return null

        case DBActions.SUBSCRIPTION_CACHE.UPDATE_COMMUNITY_POSTS_BY_CHANNEL:
          await baseHandlers.subscriptionCache.updateCommunityPostsByChannelId(data.channelId, data.entries, data.timestamp)
          syncOtherWindows(
            IpcChannels.SYNC_SUBSCRIPTION_CACHE,
            event,
            { event: SyncEvents.SUBSCRIPTION_CACHE.UPDATE_COMMUNITY_POSTS_BY_CHANNEL, data }
          )
          return null

        case DBActions.GENERAL.DELETE_MULTIPLE:
          await baseHandlers.subscriptionCache.deleteMultipleChannels(data)
          syncOtherWindows(
            IpcChannels.SYNC_SUBSCRIPTION_CACHE,
            event,
            { event: SyncEvents.GENERAL.DELETE_MULTIPLE, data }
          )
          return null

        case DBActions.GENERAL.DELETE_ALL:
          await baseHandlers.subscriptionCache.deleteAll()
          syncOtherWindows(
            IpcChannels.SYNC_SUBSCRIPTION_CACHE,
            event,
            { event: SyncEvents.GENERAL.DELETE_ALL, data }
          )
          return null

        default:
          // eslint-disable-next-line no-throw-literal
          throw 'invalid subscriptionCache db action'
      }
    } catch (err) {
      if (typeof err === 'string') throw err
      else throw err.toString()
    }
  })

  // *********** //

  function syncOtherWindows(channel, event, payload) {
    const otherWindows = BrowserWindow.getAllWindows().filter((window) => {
      return window.webContents.id !== event.sender.id && isFreeTubeUrl(window.webContents.getURL())
    })

    for (const window of otherWindows) {
      window.webContents.send(channel, payload)
    }
  }

  // ************************************************* //

  let resourcesCleanUpDone = false

  app.on('window-all-closed', () => {
    // Clean up resources (datastores' compaction + Electron cache and storage data clearing)
    handleQuit()
  })

  if (process.platform === 'darwin') {
    // `window-all-closed` doesn't fire for Cmd+Q
    // https://www.electronjs.org/docs/latest/api/app#event-window-all-closed
    // This is also fired when `app.quit` called
    // Not using `before-quit` since that one is fired before windows are closed
    app.on('will-quit', e => {
      // Let app quit when the cleanup is finished

      if (resourcesCleanUpDone) { return }

      e.preventDefault()
      cleanUpResources().finally(() => {
        // Quit AFTER the resources cleanup is finished
        // Which calls the listener again, which is why we have the variable

        app.quit()
      })
    })
  }

  if (process.platform !== 'darwin') {
    app.on('before-quit', () => {
      if (tray) { tray.destroy() }
    })
  }

  function handleQuit() {
    cleanUpResources().finally(() => {
      mainWindow = null
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })
  }

  async function cleanUpResources() {
    if (resourcesCleanUpDone) {
      return
    }

    await Promise.allSettled([
      baseHandlers.compactAllDatastores(),
      session.defaultSession.clearCache(),
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
    ])

    resourcesCleanUpDone = true
  }

  // MacOS event
  // https://www.electronjs.org/docs/latest/api/app#event-activate-macos
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  /*
   * Callback when processing a freetube:// link (macOS)
   */
  app.on('open-url', async (event, url) => {
    event.preventDefault()

    const newStartupUrl = baseUrl(url)
    if (!(mainWindow && mainWindow.webContents)) {
      startupUrl = newStartupUrl
      if (app.isReady()) await createWindow()
      return
    }

    const openDeepLinksInNewWindow = (await baseHandlers.settings._findOne('openDeepLinksInNewWindow'))?.value
    if (!openDeepLinksInNewWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
      mainWindow.webContents.send(IpcChannels.OPEN_URL, newStartupUrl)
      return
    }

    const newWindow = await createWindow({
      replaceMainWindow: false,
      showWindowNow: true,
    })

    /**
     * @param {import('electron').IpcMainEvent} event
     */
    const readyHandler = (event) => {
      if (isFreeTubeUrl(event.senderFrame.url)) {
        newWindow.webContents.ipc.off(IpcChannels.APP_READY, readyHandler)

        event.reply(IpcChannels.OPEN_URL, newStartupUrl)
      }
    }

    newWindow.webContents.ipc.on(IpcChannels.APP_READY, readyHandler)
  })

  app.on('web-contents-created', (_, webContents) => {
    webContents.once('destroyed', () => {
      invidiousAuthorizations.delete(webContents.id)
    })
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
    let newArg = arg.replace('freetube://', '')
    // add support for authority free url
      .replace('freetube:', '')

    // fix for Qt URL, like `freetube://https//www.youtube.com/watch?v=...`
    // For details see https://github.com/FreeTubeApp/FreeTube/pull/3119
    if (newArg.startsWith('https') && newArg.charAt(5) !== ':') {
      newArg = 'https:' + newArg.substring(5)
    }
    return newArg
  }

  function getLinkUrl(argv) {
    if (argv.length > 1) {
      return baseUrl(argv[argv.length - 1])
    } else {
      return null
    }
  }

  /*
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

  function navigateTo(path, browserWindow) {
    if (browserWindow == null || !isFreeTubeUrl(browserWindow.webContents.getURL())) {
      return
    }

    browserWindow.webContents.send(IpcChannels.CHANGE_VIEW, path)
  }

  async function setMenu() {
    const sidenavSettings = baseHandlers.settings._findSidenavSettings()
    const hideTrendingVideos = (await sidenavSettings.hideTrendingVideos)?.value
    const hidePopularVideos = (await sidenavSettings.hidePopularVideos)?.value
    const hidePlaylists = (await sidenavSettings.hidePlaylists)?.value

    const template = [
      ...process.platform === 'darwin'
        ? [
            {
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
            }
          ]
        : [],
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
              navigateTo('/settings', browserWindow)
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
          {
            label: 'GPU Internals (chrome://gpu)',
            click() {
              const gpuWindow = new BrowserWindow({
                show: true,
                autoHideMenuBar: true,
                webPreferences: {
                  devTools: false
                }
              })
              gpuWindow.loadURL('chrome://gpu')
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
            label: 'Back',
            accelerator: 'Alt+Left',
            click: (_menuItem, browserWindow, _event) => {
              if (browserWindow == null) { return }

              browserWindow.webContents.navigationHistory.goBack()
            },
            type: 'normal',
          },
          ...(process.platform === 'darwin'
            ? [
                {
                  label: 'Back',
                  accelerator: KeyboardShortcuts.APP.GENERAL.HISTORY_BACKWARD_ALT_MAC,
                  click: (_menuItem, browserWindow, _event) => {
                    if (browserWindow == null) { return }

                    browserWindow.webContents.navigationHistory.goBack()
                  },
                  visible: false,
                },
              ]
            : []),
          {
            label: 'Forward',
            accelerator: 'Alt+Right',
            click: (_menuItem, browserWindow, _event) => {
              if (browserWindow == null) { return }

              browserWindow.webContents.navigationHistory.goForward()
            },
            type: 'normal',
          },
          ...(process.platform === 'darwin'
            ? [
                {
                  label: 'Forward',
                  accelerator: KeyboardShortcuts.APP.GENERAL.HISTORY_FORWARD_ALT_MAC,
                  click: (_menuItem, browserWindow, _event) => {
                    if (browserWindow == null) { return }

                    browserWindow.webContents.navigationHistory.goForward()
                  },
                  visible: false,
                },
              ]
            : []),
        ]
      },
      {
        label: 'Navigate',
        submenu: [
          {
            label: 'Subscriptions',
            click: (_menuItem, browserWindow, _event) => {
              navigateTo('/subscriptions', browserWindow)
            },
            type: 'normal'
          },
          {
            label: 'Channels',
            click: (_menuItem, browserWindow, _event) => {
              navigateTo('/subscribedchannels', browserWindow)
            },
            type: 'normal'
          },
          (!hideTrendingVideos && (backendFallback || backendPreference === 'local')) && {
            label: 'Trending',
            click: (_menuItem, browserWindow, _event) => {
              navigateTo('/trending', browserWindow)
            },
            type: 'normal'
          },
          (!hidePopularVideos && (backendFallback || backendPreference === 'invidious')) && {
            label: 'Most Popular',
            click: (_menuItem, browserWindow, _event) => {
              navigateTo('/popular', browserWindow)
            },
            type: 'normal'
          },
          !hidePlaylists && {
            label: 'Playlists',
            click: (_menuItem, browserWindow, _event) => {
              navigateTo('/userplaylists', browserWindow)
            },
            type: 'normal'
          },
          {
            label: 'History',
            // MacOS: Command + Y
            // Other OS: Ctrl + H
            accelerator: process.platform === 'darwin' ? 'Cmd+Y' : 'Ctrl+H',
            click: (_menuItem, browserWindow, _event) => {
              navigateTo('/history', browserWindow)
            },
            type: 'normal'
          },
          {
            label: 'Profile Manager',
            click: (_menuItem, browserWindow, _event) => {
              navigateTo('/settings/profile/', browserWindow)
            },
            type: 'normal'
          },
        ].filter((v) => v !== false),
      },
      {
        role: 'window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' }
        ]
      },
      ...process.platform === 'darwin'
        ? [
            { role: 'window' },
            { role: 'help' },
            { role: 'services' }
          ]
        : []
    ]

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
  }
}
